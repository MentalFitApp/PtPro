import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot, orderBy, query, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { db, toDate, updateStatoPercorso } from '../../../../firebase';
import { getTenantDoc, getTenantSubcollection, CURRENT_TENANT_ID } from '../../../../config/tenant';
import { uploadToR2 } from '../../../../cloudflareStorage';
import normalizePhotoURLs from '../../../../utils/normalizePhotoURLs';
import { useToast } from '../../../../contexts/ToastContext';

/**
 * Custom hook per gestire tutto lo stato di ClientDetail
 * Riduce i 53 useState in un unico hook organizzato
 */
export default function useClientDetailState(clientId, backPath, navigate) {
  const toast = useToast();
  
  // === DATI PRINCIPALI ===
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checks, setChecks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  
  // Rate (legacy + nuove)
  const [legacyRates, setLegacyRates] = useState([]);
  const [subcollectionRates, setSubcollectionRates] = useState([]);
  
  // Schede
  const [schedaAllenamento, setSchedaAllenamento] = useState(null);
  const [schedaAlimentazione, setSchedaAlimentazione] = useState(null);
  const [schedeLoading, setSchedeLoading] = useState(true);
  
  // === UI STATE ===
  const [showAmounts, setShowAmounts] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  
  // === MODALS STATE ===
  const [modals, setModals] = useState({
    renewal: false,
    edit: false,
    extend: false,
    editPayment: false,
    photoZoom: { open: false, url: '', alt: '' },
    photoCompare: false,
    scheduleCall: false,
    workoutCalendar: false,
    newCheck: false,
  });
  
  // === LOADING STATES ===
  const [loadingStates, setLoadingStates] = useState({
    generatingLink: false,
    resettingPassword: false,
    uploadingPhoto: null,
    uploadingCheckPhoto: null,
  });
  
  const [editingPaymentIndex, setEditingPaymentIndex] = useState(null);
  const [magicLink, setMagicLink] = useState(null);
  const [nextCall, setNextCall] = useState(null);

  // === EFFECTS PER CARICAMENTO DATI ===
  useEffect(() => {
    if (!clientId) {
      setError('ID cliente non valido.');
      setTimeout(() => navigate(backPath), 3000);
      return;
    }

    const unsubscribers = [];

    // Client
    const clientRef = getTenantDoc(db, 'clients', clientId);
    unsubscribers.push(onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClient(data);
        updateStatoPercorso(clientId);
      } else {
        setError('Cliente non trovato.');
        setTimeout(() => navigate(backPath), 3000);
      }
      setLoading(false);
    }, () => {
      setError('Errore caricamento.');
      setTimeout(() => navigate(backPath), 3000);
      setLoading(false);
    }));

    // Anamnesi
    const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
    const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
    unsubscribers.push(onSnapshot(anamnesiRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.photoURLs) data.photoURLs = normalizePhotoURLs(data.photoURLs);
        setAnamnesi(data);
      } else {
        setAnamnesi(null);
      }
    }));

    // Checks
    const checksQuery = query(
      getTenantSubcollection(db, 'clients', clientId, 'checks'), 
      orderBy('createdAt', 'desc')
    );
    unsubscribers.push(onSnapshot(checksQuery, (snap) => {
      const checksData = snap.docs.map(doc => {
        const check = { id: doc.id, ...doc.data() };
        if (check.photoURLs) check.photoURLs = normalizePhotoURLs(check.photoURLs);
        return check;
      });
      setChecks(checksData);
    }));

    // Payments
    const paymentsQuery = query(
      getTenantSubcollection(db, 'clients', clientId, 'payments'), 
      orderBy('paymentDate', 'desc')
    );
    unsubscribers.push(onSnapshot(paymentsQuery, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // Rates (subcollection)
    const ratesQuery = query(
      getTenantSubcollection(db, 'clients', clientId, 'rates'), 
      orderBy('dueDate', 'asc')
    );
    unsubscribers.push(onSnapshot(ratesQuery, (snap) => {
      const ratesData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          dueDate: data.dueDate ? (data.dueDate.toDate ? data.dueDate.toDate().toISOString().split('T')[0] : data.dueDate) : '',
          paid: data.paid || false,
          paidDate: data.paidDate ? (data.paidDate.toDate ? data.paidDate.toDate().toISOString() : data.paidDate) : null,
          isRenewal: data.isRenewal || false,
          fromSubcollection: true
        };
      });
      setSubcollectionRates(ratesData);
    }));

    // Scheda Allenamento
    const schedaAllenRef = getTenantDoc(db, 'schede_allenamento', clientId);
    unsubscribers.push(onSnapshot(schedaAllenRef, (docSnap) => {
      setSchedaAllenamento(docSnap.exists() ? docSnap.data() : null);
      setSchedeLoading(false);
    }));

    // Scheda Alimentazione
    const schedaAlimRef = getTenantDoc(db, 'schede_alimentazione', clientId);
    unsubscribers.push(onSnapshot(schedaAlimRef, (docSnap) => {
      setSchedaAlimentazione(docSnap.exists() ? docSnap.data() : null);
    }));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [clientId, navigate, backPath]);

  // Carica rate legacy
  useEffect(() => {
    if (client?.rate) setLegacyRates(client.rate);
  }, [client]);

  // === COMPUTED VALUES ===
  const rates = useMemo(() => {
    const legacy = legacyRates.map((r, idx) => ({ ...r, legacyIndex: idx }));
    return [...legacy, ...subcollectionRates];
  }, [legacyRates, subcollectionRates]);

  const latestCheck = checks?.[0];
  const previousCheck = checks?.[1];

  // === ACTIONS ===
  const openModal = useCallback((modalName, extraData = {}) => {
    setModals(prev => ({ ...prev, [modalName]: extraData.open !== undefined ? extraData : true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ 
      ...prev, 
      [modalName]: modalName === 'photoZoom' ? { open: false, url: '', alt: '' } : false 
    }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Eliminare ${client?.name}?`)) {
      try { 
        await deleteDoc(getTenantDoc(db, 'clients', clientId)); 
        navigate(backPath); 
      } catch { 
        toast.error('Errore eliminazione.'); 
      }
    }
  }, [client?.name, clientId, navigate, backPath, toast]);

  const handleResetPassword = useCallback(async () => {
    if (!client?.email) {
      toast.error('Il cliente non ha un\'email associata');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, resettingPassword: true }));
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, client.email);
      toast.success(`Email di reset password inviata a ${client.email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        toast.error('Nessun utente trovato con questa email');
      } else {
        toast.error('Errore nell\'invio dell\'email di reset');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, resettingPassword: false }));
    }
  }, [client?.email, toast]);

  const generateMagicLink = useCallback(async () => {
    if (!client || loadingStates.generatingLink) return;
    
    setLoadingStates(prev => ({ ...prev, generatingLink: true }));
    try {
      const functions = getFunctions(undefined, 'europe-west1');
      const generateMagicLinkFn = httpsCallable(functions, 'generateMagicLink');
      
      const result = await generateMagicLinkFn({
        clientId: client.id,
        tenantId: CURRENT_TENANT_ID,
        email: client.email,
        name: client.name
      });
      
      if (result.data.success) {
        setMagicLink(result.data.magicLink);
        navigator.clipboard.writeText(result.data.magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        toast.error('Errore nella generazione del Magic Link');
      }
    } catch (error) {
      toast.error('Errore: ' + (error.message || 'Riprova più tardi'));
    } finally {
      setLoadingStates(prev => ({ ...prev, generatingLink: false }));
    }
  }, [client, loadingStates.generatingLink, toast]);

  const copyCredentials = useCallback(async () => {
    if (!client) return;
    
    if (!magicLink) {
      await generateMagicLink();
      return;
    }
    
    const text = `Ciao ${client.name}, ti invio il link per entrare nel tuo profilo personale...\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${magicLink}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [client, magicLink, generateMagicLink]);

  // Rate handlers
  const handleAddRate = useCallback(async (rate) => {
    const ratesRef = getTenantSubcollection(db, 'clients', client.id, 'rates');
    await addDoc(ratesRef, {
      amount: parseFloat(rate.amount) || 0,
      dueDate: rate.dueDate ? new Date(rate.dueDate) : null,
      paid: rate.paid || false,
      paidDate: rate.paidDate ? new Date(rate.paidDate) : null,
      createdAt: new Date(),
      isRenewal: false
    });
  }, [client?.id]);

  const handleUpdateRate = useCallback(async (idx, updatedRate) => {
    const rate = rates[idx];
    if (rate.fromSubcollection && rate.id) {
      const rateRef = doc(getTenantSubcollection(db, 'clients', client.id, 'rates'), rate.id);
      await updateDoc(rateRef, {
        amount: parseFloat(updatedRate.amount) || rate.amount,
        dueDate: updatedRate.dueDate ? new Date(updatedRate.dueDate) : (rate.dueDate ? new Date(rate.dueDate) : null),
        paid: updatedRate.paid ?? rate.paid,
        paidDate: updatedRate.paidDate ? new Date(updatedRate.paidDate) : (updatedRate.paid && !rate.paidDate ? new Date() : null)
      });
    } else {
      const legacyIdx = rate.legacyIndex;
      const newLegacyRates = legacyRates.map((r, i) => i === legacyIdx ? { ...r, ...updatedRate } : r);
      setLegacyRates(newLegacyRates);
      await updateDoc(getTenantDoc(db, 'clients', client.id), { rate: newLegacyRates });
    }
  }, [rates, client?.id, legacyRates]);

  const handleDeleteRate = useCallback(async (idx) => {
    const rate = rates[idx];
    if (rate.fromSubcollection && rate.id) {
      const rateRef = doc(getTenantSubcollection(db, 'clients', client.id, 'rates'), rate.id);
      await deleteDoc(rateRef);
    } else {
      const legacyIdx = rate.legacyIndex;
      const newLegacyRates = legacyRates.filter((_, i) => i !== legacyIdx);
      setLegacyRates(newLegacyRates);
      await updateDoc(getTenantDoc(db, 'clients', client.id), { rate: newLegacyRates });
    }
  }, [rates, client?.id, legacyRates]);

  // Photo upload
  const handleAnamnesiPhotoUpload = useCallback(async (position, file) => {
    if (!file || !clientId) return;
    
    setLoadingStates(prev => ({ ...prev, uploadingPhoto: position }));
    try {
      const photoUrl = await uploadToR2(file, clientId, 'anamnesi_photos', null, true);
      
      const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
      const anamnesiDocRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
      
      const currentPhotos = anamnesi?.photoURLs || { front: null, right: null, left: null, back: null };
      const updatedPhotos = { ...currentPhotos, [position]: photoUrl };
      
      await setDoc(anamnesiDocRef, {
        ...anamnesi,
        photoURLs: updatedPhotos,
        updatedAt: new Date(),
        updatedBy: 'admin'
      }, { merge: true });
      
      setAnamnesi(prev => ({ ...prev, photoURLs: updatedPhotos }));
    } catch (error) {
      toast.error('Errore nel caricamento: ' + error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, uploadingPhoto: null }));
    }
  }, [clientId, anamnesi, toast]);

  return {
    // Dati
    client,
    loading,
    error,
    checks,
    payments,
    anamnesi,
    rates,
    schedaAllenamento,
    schedaAlimentazione,
    schedeLoading,
    latestCheck,
    previousCheck,
    
    // UI State
    showAmounts,
    setShowAmounts,
    activeTab,
    setActiveTab,
    copied,
    
    // Modals
    modals,
    openModal,
    closeModal,
    editingPaymentIndex,
    setEditingPaymentIndex,
    
    // Loading
    loadingStates,
    magicLink,
    nextCall,
    
    // Actions
    handleDelete,
    handleResetPassword,
    generateMagicLink,
    copyCredentials,
    handleAddRate,
    handleUpdateRate,
    handleDeleteRate,
    handleAnamnesiPhotoUpload,
  };
}
