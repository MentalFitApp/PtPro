// src/utils/accountLinking.js
import { 
  linkWithPopup, 
  GoogleAuthProvider,
  FacebookAuthProvider,
  unlink
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getTenantDoc } from '../config/tenant';

/**
 * Ottieni tutti i provider collegati all'account corrente
 */
export async function getLinkedProviders(user) {
  if (!user) return [];
  
  // providerData contiene tutti i provider collegati
  const providers = user.providerData.map(p => ({
    providerId: p.providerId,
    email: p.email,
    displayName: p.displayName,
    photoURL: p.photoURL,
    uid: p.uid
  }));
  
  return providers;
}

/**
 * Verifica se un provider specifico è collegato
 */
export function isProviderLinked(user, providerId) {
  if (!user) return false;
  return user.providerData.some(p => p.providerId === providerId);
}

/**
 * Collega account Google
 */
export async function linkGoogleAccount() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    
    console.log('✅ Account Google collegato:', result.user.email);
    
    // Forza refresh del token per assicurarsi che le nuove credenziali siano attive
    await result.user.getIdToken(true);
    console.log('✅ Token refreshato dopo linking');
    
    // Aggiorna documento utente nel tenant (sia users che clients)
    await updateUserProviders(result.user);
    
    return { 
      success: true, 
      user: result.user,
      credential: result.credential 
    };
    
  } catch (error) {
    console.error('❌ Errore collegamento Google:', error);
    
    if (error.code === 'auth/credential-already-in-use') {
      return { 
        success: false, 
        error: 'Questo account Google è già collegato ad un altro utente',
        code: 'already-in-use'
      };
    }
    
    if (error.code === 'auth/provider-already-linked') {
      return { 
        success: false, 
        error: 'Account Google già collegato a questo utente',
        code: 'already-linked'
      };
    }

    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'Questa email è già registrata con un altro account',
        code: 'email-in-use'
      };
    }

    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Popup chiuso. Riprova.',
        code: 'popup-closed'
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Collega account Facebook
 */
export async function linkFacebookAccount() {
  const provider = new FacebookAuthProvider();
  
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    
    console.log('✅ Account Facebook collegato:', result.user.email);
    
    // Aggiorna documento utente nel tenant
    await updateUserProviders(result.user);
    
    return { 
      success: true, 
      user: result.user 
    };
    
  } catch (error) {
    console.error('❌ Errore collegamento Facebook:', error);
    
    if (error.code === 'auth/credential-already-in-use') {
      return { 
        success: false, 
        error: 'Questo account Facebook è già collegato ad un altro utente' 
      };
    }
    
    if (error.code === 'auth/provider-already-linked') {
      return { 
        success: false, 
        error: 'Account Facebook già collegato' 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Scollega un provider dall'account
 */
export async function unlinkProvider(providerId) {
  const user = auth.currentUser;
  
  if (!user) {
    return { success: false, error: 'Utente non autenticato' };
  }
  
  // Verifica che non sia l'ultimo provider
  if (user.providerData.length <= 1) {
    return { 
      success: false, 
      error: 'Non puoi scollegare l\'ultimo metodo di accesso. Collega prima un altro provider.' 
    };
  }
  
  try {
    await unlink(user, providerId);
    console.log('✅ Provider scollegato:', providerId);
    
    // Aggiorna documento utente nel tenant
    await updateUserProviders(auth.currentUser);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Errore scollegamento provider:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Aggiorna i provider nel documento utente del tenant
 * Mantiene traccia dei provider collegati per analytics e sicurezza
 * Aggiorna sia 'users' che 'clients' per supportare entrambi i tipi di utente
 */
async function updateUserProviders(user) {
  if (!user) return;
  
  try {
    const providers = user.providerData.map(p => ({
      providerId: p.providerId,
      email: p.email,
      linkedAt: new Date().toISOString()
    }));
    
    const updateData = {
      linkedProviders: providers,
      lastProviderUpdate: serverTimestamp()
    };
    
    // Prova ad aggiornare documento 'users' (per community members)
    try {
      const userDocRef = getTenantDoc(db, 'users', user.uid);
      await updateDoc(userDocRef, updateData);
      console.log('✅ Provider aggiornati in users/', user.uid);
    } catch (userError) {
      // Ignora se users non esiste
      console.log('ℹ️ Documento users non trovato, provo clients...');
    }
    
    // Prova ad aggiornare documento 'clients' (per clienti)
    try {
      const clientDocRef = getTenantDoc(db, 'clients', user.uid);
      await updateDoc(clientDocRef, updateData);
      console.log('✅ Provider aggiornati in clients/', user.uid);
    } catch (clientError) {
      // Ignora se clients non esiste
      console.log('ℹ️ Documento clients non trovato');
    }
    
    console.log('✅ Provider aggiornati nel tenant:', providers.length);
    
  } catch (error) {
    console.error('⚠️ Errore aggiornamento provider nel tenant:', error);
    // Non bloccare il flusso se l'update fallisce
  }
}

/**
 * Ottieni nome leggibile del provider
 */
export function getProviderDisplayName(providerId) {
  const names = {
    'password': 'Email e Password',
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'apple.com': 'Apple',
    'phone': 'Telefono'
  };
  
  return names[providerId] || providerId;
}

/**
 * Ottieni icona del provider
 */
export function getProviderIcon(providerId) {
  const icons = {
    'password': '📧',
    'google.com': 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
    'facebook.com': 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg',
    'apple.com': '🍎',
    'phone': '📱'
  };
  
  return icons[providerId] || '🔐';
}

/**
 * Verifica se l'utente dovrebbe vedere il suggerimento di collegare Google
 */
export function shouldShowLinkSuggestion(user) {
  // Non mostrare se già collegato
  if (isProviderLinked(user, 'google.com')) return false;
  
  // Non mostrare se ha già dismissato
  if (localStorage.getItem('link-google-dismissed')) return false;
  
  // Mostra solo se l'account ha almeno 1 giorno
  const creationTime = new Date(user.metadata.creationTime).getTime();
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  return creationTime < oneDayAgo;
}

/**
 * Dismissi il suggerimento permanentemente
 */
export function dismissLinkSuggestion() {
  localStorage.setItem('link-google-dismissed', 'true');
}
