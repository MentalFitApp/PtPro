// src/pages/dipendenti.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db, toDate } from "../../firebase";
import {
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from "../../config/tenant";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import { formatCurrency } from "../../utils/formatters";
import { Edit2, Trash2, Calendar, TrendingUp, DollarSign, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';

const RUOLI_DISPONIBILI = ["Setter", "Coach", "Admin", "Manager", "Altro"];

const Dipendenti = () => {
  const { confirmDelete } = useConfirm();
  const toast = useToast();
  const [dipendenti, setDipendenti] = useState([]);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incassoNuoviClienti, setIncassoNuoviClienti] = useState(0);
  const [incassoRinnovi, setIncassoRinnovi] = useState(0);
  const [includeRenewals, setIncludeRenewals] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [calendarioCollapsed, setCalendarioCollapsed] = useState(true);
  const [showEditPagamentoModal, setShowEditPagamentoModal] = useState(false);

  // Form
  const [formDip, setFormDip] = useState({ nome: "", nominativo: "", iban: "", tipo: "percentuale", percentuale: "", fissi: [], ruolo: "Setter" });
  const [editingDip, setEditingDip] = useState(null);

  // Pagamento
  const [formPagamento, setFormPagamento] = useState({
    dipId: "",
    importoBase: "",
    percentualeDaPagare: 100,
    bonus: "",
    data: format(new Date(), "yyyy-MM-dd"),
    note: "",
  });
  const [editingPagamento, setEditingPagamento] = useState(null);

  // Filtro
  const [meseFiltro, setMeseFiltro] = useState(format(new Date(), "yyyy-MM"));

  // === INCASSO MESE FILTRATO - OTTIMIZZATO ===
  useEffect(() => {
    const loadIncassoMeseFiltrato = async () => {
      try {
        // Usa il mese filtrato invece del mese corrente
        const [year, month] = meseFiltro.split('-').map(Number);
        const filterDate = new Date(year, month - 1, 1);
        const monthStart = startOfMonth(filterDate);
        const monthEnd = endOfMonth(filterDate);
        
        // Limit a 100 clienti attivi
        const clientsSnap = await getDocs(
          query(getTenantCollection(db, 'clients'), limit(100))
        );
        
        // Batch processing - 15 clienti per volta
        const BATCH_SIZE = 15;
        let totalNuovi = 0;
        let totalRinnovi = 0;
        
        for (let i = 0; i < clientsSnap.docs.length; i += BATCH_SIZE) {
          const batch = clientsSnap.docs.slice(i, i + BATCH_SIZE);
          
          // Carica tutti i dati in parallelo per ogni cliente del batch
          const results = await Promise.all(
            batch.map(async (clientDoc) => {
              const clientData = clientDoc.data();
              const isOldClient = clientData.isOldClient === true;
              let clientNuovi = 0;
              let clientRinnovi = 0;
              
              // Carica payments e rates in parallelo - CON LIMIT
              const [paymentsSnap, ratesSnap] = await Promise.all([
                getDocs(query(getTenantSubcollection(db, 'clients', clientDoc.id, 'payments'), limit(50))).catch(() => ({ docs: [] })),
                getDocs(query(getTenantSubcollection(db, 'clients', clientDoc.id, 'rates'), limit(20))).catch(() => ({ docs: [] }))
              ]);
            
            // 1. Processa payments
            paymentsSnap.docs.forEach(paymentDoc => {
              const paymentData = paymentDoc.data();
              const paymentDate = toDate(paymentData.paymentDate || paymentData.date || paymentData.createdAt);
              const isRenewal = paymentData.isRenewal === true;
              
              if (isOldClient && !isRenewal) return;
              
              if (paymentDate && paymentDate >= monthStart && paymentDate <= monthEnd && !paymentData.isPast) {
                const amount = parseFloat(paymentData.amount) || 0;
                if (isRenewal) {
                  clientRinnovi += amount;
                } else {
                  clientNuovi += amount;
                }
              }
            });
            
            // 2. Processa rates subcollection
            ratesSnap.docs.forEach(rateDoc => {
              const rateData = rateDoc.data();
              if (!rateData.paid || !rateData.paidDate) return;
              
              const paidDate = toDate(rateData.paidDate);
              if (paidDate && paidDate >= monthStart && paidDate <= monthEnd) {
                const amount = parseFloat(rateData.amount) || 0;
                if (rateData.isRenewal === true) {
                  clientRinnovi += amount;
                } else {
                  clientNuovi += amount;
                }
              }
            });
            
            // 3. Processa rate legacy dal documento cliente
            (clientData.rate || []).forEach(rate => {
              if (rate.paid && rate.paidDate) {
                const rateDate = toDate(rate.paidDate);
                if (rateDate && rateDate >= monthStart && rateDate <= monthEnd) {
                  const amount = parseFloat(rate.amount) || 0;
                  clientNuovi += amount;
                }
              }
            });
            
            return { nuovi: clientNuovi, rinnovi: clientRinnovi };
            })
          );
          
          // Aggrega risultati batch
          results.forEach(({ nuovi, rinnovi }) => {
            totalNuovi += nuovi;
            totalRinnovi += rinnovi;
          });
          
          // Pausa tra batch
          if (i + BATCH_SIZE < clientsSnap.docs.length) {
            await new Promise(r => setTimeout(r, 50));
          }
        }
        
        setIncassoNuoviMese(totalNuovi);
        setIncassoRinnoviMese(totalRinnovi);
      } catch (err) {
        console.error('Errore caricamento incasso mese filtrato:', err);
      }
    };
    loadIncassoMeseFiltrato();
  }, [meseFiltro]); // Ricarica quando cambia il mese filtrato

  // === DIPENDENTI & PAGAMENTI ===
  useEffect(() => {
    const unsubDip = onSnapshot(getTenantCollection(db, 'dipendenti_provvigioni'), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        percentuale: doc.data().percentuale || 0,
        fissi: doc.data().fissi || [],
        ruolo: doc.data().ruolo || "Setter",
        nominativo: doc.data().nominativo || "",
        archived: doc.data().archived || false,
      }));
      setDipendenti(list);
      setLoading(false);
    });

    const unsubPag = onSnapshot(getTenantCollection(db, 'pagamenti_dipendenti'), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate(),
      }));
      setPagamenti(list);
    });

    return () => { unsubDip(); unsubPag(); };
  }, []);

  // === MAPPA DIPENDENTI ===
  const dipendentiMap = useMemo(() => {
    const map = new Map();
    dipendenti.forEach(dip => map.set(dip.id, dip));
    return map;
  }, [dipendenti]);

  // === PROVVIGIONI TOTALI + UTILE NETTO ===
  const incassoTotale = includeRenewals ? (incassoNuoviClienti + incassoRinnovi) : incassoNuoviClienti;
  
  const { provvigioniTotali, pagatiTotali, daPagareTotali, utileNetto } = useMemo(() => {
    let provv = 0;
    let pagati = 0;

    dipendenti.filter(d => !d.archived).forEach(dip => {
      if (dip.tipo === "percentuale") {
        provv += (incassoTotale * dip.percentuale) / 100;
      } else {
        const fissiMese = dip.fissi
          .filter(f => format(new Date(f.data), "yyyy-MM") === meseFiltro)
          .reduce((s, f) => s + f.importo, 0);
        provv += fissiMese;
      }

      pagati += pagamenti
        .filter(p => p.dipId === dip.id && format(p.data, "yyyy-MM") === meseFiltro)
        .reduce((s, p) => s + p.importo, 0);
    });

    const utile = incassoTotale - pagati;
    return { provvigioniTotali: provv, pagatiTotali: pagati, daPagareTotali: provv - pagati, utileNetto: utile };
  }, [dipendenti, incassoTotale, pagamenti, meseFiltro]);

  // === CALENDARIO ===
  const giorniMese = eachDayOfInterval({
    start: startOfMonth(meseCalendario),
    end: endOfMonth(meseCalendario),
  });

  const pagamentiDelGiorno = (giorno) => {
    return pagamenti.filter(p => isSameDay(p.data, giorno));
  };

  // === FUNZIONI ===
  const resetFormDip = () => {
    setFormDip({ nome: "", nominativo: "", iban: "", tipo: "percentuale", percentuale: "", fissi: [], ruolo: "Setter" });
    setEditingDip(null);
  };

  const salvaDipendente = async () => {
    if (!formDip.nome.trim()) return;
    const ref = editingDip ? getTenantDoc(db, 'dipendenti_provvigioni', editingDip.id) : doc(getTenantCollection(db, 'dipendenti_provvigioni'));
    const data = {
      nome: formDip.nome.trim(),
      nominativo: formDip.nominativo.trim(),
      iban: formDip.iban.trim(),
      tipo: formDip.tipo,
      percentuale: formDip.tipo === "percentuale" ? parseFloat(formDip.percentuale) || 0 : 0,
      fissi: formDip.tipo === "fisso"
        ? formDip.fissi.map((f) => ({ importo: parseFloat(f.importo) || 0, data: f.data })).filter((f) => f.importo > 0 && f.data)
        : [],
      ruolo: formDip.ruolo,
      updatedAt: serverTimestamp(),
    };
    if (!editingDip) data.createdAt = serverTimestamp();
    await setDoc(ref, data, { merge: true });
    resetFormDip();
  };

  const archiviaDipendente = async (dip) => {
    if (!confirm(`Archiviare ${dip.nome}?`)) return;
    await setDoc(getTenantDoc(db, 'dipendenti_provvigioni', dip.id), { archived: true }, { merge: true });
  };

  const salvaPagamento = async () => {
    if (!formPagamento.dipId || !formPagamento.importoBase || !formPagamento.data) return;
    const importoTotale = parseFloat(formPagamento.importoBase) + (parseFloat(formPagamento.bonus) || 0);
    const ref = editingPagamento ? getTenantDoc(db, 'pagamenti_dipendenti', editingPagamento.id) : doc(getTenantCollection(db, 'pagamenti_dipendenti'));
    await setDoc(ref, {
      dipId: formPagamento.dipId,
      importo: importoTotale,
      importoBase: parseFloat(formPagamento.importoBase),
      percentualePagata: formPagamento.percentualeDaPagare,
      bonus: parseFloat(formPagamento.bonus) || 0,
      data: new Date(formPagamento.data),
      note: formPagamento.note.trim(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setFormPagamento({ dipId: "", importoBase: "", percentualeDaPagare: 100, bonus: "", data: format(new Date(), "yyyy-MM-dd"), note: "" });
    setEditingPagamento(null);
    setShowEditPagamentoModal(false);
    toast.success('Pagamento salvato');
  };

  const eliminaPagamento = async (id) => {
    const confirmed = await confirmDelete('questo pagamento');
    if (!confirmed) return;
    await deleteDoc(getTenantDoc(db, 'pagamenti_dipendenti', id));
    toast.success('Pagamento eliminato');
  };

  const modificaPagamento = (pagamento) => {
    setEditingPagamento(pagamento);
    setFormPagamento({
      dipId: pagamento.dipId,
      importoBase: pagamento.importoBase.toString(),
      percentualeDaPagare: pagamento.percentualePagata,
      bonus: pagamento.bonus.toString(),
      data: format(pagamento.data, "yyyy-MM-dd"),
      note: pagamento.note || "",
    });
    setShowEditPagamentoModal(true);
  };

  const chiudiModalPagamento = () => {
    setShowEditPagamentoModal(false);
    setEditingPagamento(null);
    setFormPagamento({ dipId: "", importoBase: "", percentualeDaPagare: 100, bonus: "", data: format(new Date(), "yyyy-MM-dd"), note: "" });
  };

  const aggiungiFisso = () => {
    setFormDip({
      ...formDip,
      fissi: [...formDip.fissi, { importo: "", data: format(new Date(), "yyyy-MM-dd") }],
    });
  };

  const rimuoviFisso = (i) => {
    setFormDip({
      ...formDip,
      fissi: formDip.fissi.filter((_, index) => index !== i),
    });
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Caricamento...</div>;

  const dipendentiFiltrati = dipendenti.filter(d => showArchived ? d.archived : !d.archived);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Dipendenti & Provvigioni</h1>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 text-sm rounded-lg transition ${showArchived ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {showArchived ? 'Attivi' : 'Archiviati'}
          </button>
        </div>
        
        {/* INCASSO MESE CORRENTE */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-xl p-5 border border-emerald-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-emerald-400 font-medium uppercase mb-1">
                Incasso {format(new Date(), 'MMMM yyyy')}
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {formatCurrency(incassoTotale)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {includeRenewals ? 'Nuovi clienti + Rinnovi' : 'Solo nuovi clienti'}
              </p>
            </div>
            
            {/* Checkbox per includere rinnovi */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={includeRenewals}
                  onChange={(e) => setIncludeRenewals(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-500 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-sm text-slate-300">Includi rinnovi</span>
            </label>
          </div>
          
          {/* Dettaglio nuovi vs rinnovi */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-500/20">
            <div>
              <p className="text-xs text-slate-400">Nuovi clienti</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(incassoNuoviClienti)}</p>
            </div>
            <div className={includeRenewals ? '' : 'opacity-50'}>
              <p className="text-xs text-slate-400">Rinnovi</p>
              <p className="text-lg font-bold text-cyan-400">{formatCurrency(incassoRinnovi)}</p>
            </div>
          </div>
        </div>
        
        {/* FILTRO PAGAMENTI */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Pagamenti del mese:</label>
          <input
            type="month"
            value={meseFiltro}
            onChange={(e) => setMeseFiltro(e.target.value)}
            className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-rose-500 text-sm"
          />
        </div>
      </div>

      {/* STATISTICHE + UTILE NETTO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90 flex items-center gap-1"><TrendingUp size={16} /> Utile Netto</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(utileNetto)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90">Provvigioni</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(provvigioniTotali)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-5 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90">Pagati</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(pagatiTotali)}</p>
        </div>
        <div className={`p-5 rounded-xl text-white shadow-lg ${daPagareTotali > 0 ? 'bg-gradient-to-br from-rose-600 to-rose-800' : 'bg-gradient-to-br from-green-600 to-green-800'}`}>
          <p className="text-sm opacity-90">Da Pagare</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(daPagareTotali)}</p>
        </div>
      </div>

      {/* CALENDARIO PAGAMENTI */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 shadow-xl overflow-hidden">
        <div 
          className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-700/50 transition"
          onClick={() => setCalendarioCollapsed(!calendarioCollapsed)}
        >
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar size={16} /> Calendario Pagamenti
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{format(meseCalendario, "MMMM yyyy")}</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${calendarioCollapsed ? '' : 'rotate-180'}`} />
          </div>
        </div>
        
        <AnimatePresence>
          {!calendarioCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0">
                <div className="flex justify-between items-center mb-2">
                  <button onClick={(e) => { e.stopPropagation(); setMeseCalendario(addMonths(meseCalendario, -1)); }} className="p-1 hover:bg-slate-700 rounded transition">
                    <ChevronLeft size={16} className="text-slate-400" />
                  </button>
                  <span className="text-xs font-medium text-slate-300">{format(meseCalendario, "MMMM yyyy")}</span>
                  <button onClick={(e) => { e.stopPropagation(); setMeseCalendario(addMonths(meseCalendario, 1)); }} className="p-1 hover:bg-slate-700 rounded transition">
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((d, i) => (
                    <div key={`day-${i}`} className="font-bold text-slate-500 py-1">{d}</div>
                  ))}
                  {Array.from({ length: startOfMonth(meseCalendario).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {giorniMese.map(giorno => {
                    const pagamentiGiorno = pagamentiDelGiorno(giorno);
                    return (
                      <div
                        key={giorno.toISOString()}
                        className={`min-h-16 p-1.5 rounded-lg border transition-all cursor-pointer
                          ${pagamentiGiorno.length > 0 
                            ? 'bg-emerald-900/40 border-emerald-600/50 hover:bg-emerald-900/60' 
                            : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50'
                          }`}
                      >
                        <p className="text-xs font-bold text-slate-400 mb-0.5">{format(giorno, "d")}</p>
                        <div className="space-y-1 max-h-14 overflow-y-auto">
                          {pagamentiGiorno.map(p => {
                            const dip = dipendentiMap.get(p.dipId);
                            return (
                              <div
                                key={p.id}
                                className="bg-rose-600/30 px-1.5 py-1 rounded text-[10px] flex justify-between items-center group"
                              >
                                <span className="font-semibold text-rose-300 truncate flex-1">{dip?.nome}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); modificaPagamento(p); }}
                                    className="text-cyan-400 hover:text-cyan-300"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); eliminaPagamento(p.id); }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ELENCO DIPENDENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dipendentiFiltrati.map((dip) => {
          const pagati = pagamenti.filter(p => p.dipId === dip.id && format(p.data, "yyyy-MM") === meseFiltro).reduce((sum, p) => sum + p.importo, 0);
          const provvigionePercentuale = dip.tipo === "percentuale" ? (incassoTotale * dip.percentuale) / 100 : 0;
          const totaleFissi = dip.tipo === "fisso" ? dip.fissi.filter(f => format(new Date(f.data), "yyyy-MM") === meseFiltro).reduce((sum, f) => sum + f.importo, 0) : 0;
          const daPagare = (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi) - pagati;

          return (
            <div key={dip.id} className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border ${dip.archived ? 'border-slate-600 opacity-60' : 'border-slate-700 hover:border-slate-600'} transition-all`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{dip.nome}</h3>
                  {dip.nominativo && <p className="text-xs text-rose-400">{dip.nominativo}</p>}
                  <p className="text-xs text-slate-500">{dip.ruolo}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingDip(dip); setFormDip({ nome: dip.nome, nominativo: dip.nominativo || "", iban: dip.iban || "", tipo: dip.tipo, percentuale: dip.percentuale?.toString() || "", fissi: dip.fissi || [], ruolo: dip.ruolo }); }} className="text-xs text-amber-400 hover:text-amber-300">Modifica</button>
                  {!dip.archived && <button onClick={() => archiviaDipendente(dip)} className="text-xs text-red-400 hover:text-red-300">Archivia</button>}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-400">{dip.tipo === "percentuale" ? `${dip.percentuale}% su incasso` : "Fisso mensile"}</p>
                {dip.iban && <p className="text-xs text-slate-500">IBAN: {dip.iban}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Provvigione</span>
                  <span className="font-medium text-emerald-400">{formatCurrency(dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Pagato</span>
                  <span className="font-medium text-amber-400">{formatCurrency(pagati)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-300">Da pagare</span>
                  <span className={daPagare > 0 ? "text-rose-400" : "text-green-400"}>{formatCurrency(daPagare)}</span>
                </div>
              </div>

              {!dip.archived && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Paga il {formPagamento.dipId === dip.id ? (formPagamento.percentualeDaPagare || 100) : 100}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={formPagamento.dipId === dip.id ? (formPagamento.percentualeDaPagare || 100) : 100}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormPagamento({
                          ...formPagamento,
                          dipId: dip.id,
                          importoBase: ((dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi) * val) / 100,
                          percentualeDaPagare: val,
                        });
                      }}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Importo" 
                      value={formPagamento.dipId === dip.id ? (formPagamento.importoBase || "") : (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi)} 
                      onChange={(e) => setFormPagamento({ ...formPagamento, dipId: dip.id, importoBase: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500" 
                    />
                    <input 
                      type="number" 
                      placeholder="Bonus" 
                      value={formPagamento.dipId === dip.id ? (formPagamento.bonus || "") : ""}
                      className="w-20 px-2 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500" 
                      onChange={(e) => setFormPagamento({ ...formPagamento, dipId: dip.id, importoBase: formPagamento.importoBase || (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi), bonus: e.target.value })} 
                    />
                  </div>

                  <input 
                    type="text" 
                    placeholder="Note" 
                    value={formPagamento.dipId === dip.id ? formPagamento.note : ""} 
                    onChange={(e) => setFormPagamento({ ...formPagamento, dipId: dip.id, importoBase: (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi), note: e.target.value })} 
                    className="w-full px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500" 
                  />

                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={formPagamento.dipId === dip.id ? formPagamento.data : format(new Date(), "yyyy-MM-dd")} 
                      onChange={(e) => setFormPagamento({ ...formPagamento, dipId: dip.id, importoBase: (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi), data: e.target.value })} 
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500" 
                    />
                    <button 
                      onClick={() => {
                        if (!formPagamento.dipId || formPagamento.dipId !== dip.id) {
                          setFormPagamento({
                            dipId: dip.id,
                            importoBase: (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi),
                            percentualeDaPagare: 100,
                            bonus: formPagamento.bonus || "",
                            data: formPagamento.data || format(new Date(), "yyyy-MM-dd"),
                            note: formPagamento.note || "",
                          });
                          setTimeout(() => salvaPagamento(), 100);
                        } else {
                          salvaPagamento();
                        }
                      }} 
                      className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 transition font-medium"
                    >
                      Paga
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL DIPENDENTE */}
      {(formDip.nome || editingDip) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">{editingDip ? "Modifica" : "Nuovo"} Dipendente</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={formDip.nome} onChange={(e) => setFormDip({ ...formDip, nome: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500" />
              <input type="text" placeholder="Nominativo" value={formDip.nominativo} onChange={(e) => setFormDip({ ...formDip, nominativo: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500" />
              <input type="text" placeholder="IBAN" value={formDip.iban} onChange={(e) => setFormDip({ ...formDip, iban: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500" />
              <select value={formDip.ruolo} onChange={(e) => setFormDip({ ...formDip, ruolo: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500">
                {RUOLI_DISPONIBILI.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="radio" name="tipo" value="percentuale" checked={formDip.tipo === "percentuale"} onChange={(e) => setFormDip({ ...formDip, tipo: e.target.value })} />
                  <span className="text-slate-300">Percentuale</span>
                  {formDip.tipo === "percentuale" && (
                    <input type="number" placeholder="%" value={formDip.percentuale} onChange={(e) => setFormDip({ ...formDip, percentuale: e.target.value })} className="w-20 px-2 py-1 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none" />
                  )}
                </label>
                <label className="flex items-center">
                  <input type="radio" name="tipo" value="fisso" checked={formDip.tipo === "fisso"} onChange={(e) => setFormDip({ ...formDip, tipo: e.target.value })} />
                  <span className="text-slate-300">Fisso</span>
                </label>
              </div>
              {formDip.tipo === "fisso" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Fissi mensili</span>
                    <button onClick={aggiungiFisso} className="text-xs text-rose-400 hover:text-rose-300">+ Aggiungi</button>
                  </div>
                  {formDip.fissi.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="number" placeholder="Importo" value={f.importo} onChange={(e) => { const nuovi = [...formDip.fissi]; nuovi[i].importo = e.target.value; setFormDip({ ...formDip, fissi: nuovi }); }} className="flex-1 px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 focus:outline-none" />
                      <input type="date" value={f.data} onChange={(e) => { const nuovi = [...formDip.fissi]; nuovi[i].data = e.target.value; setFormDip({ ...formDip, fissi: nuovi }); }} className="px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 focus:outline-none" />
                      <button onClick={() => rimuoviFisso(i)} className="px-2 text-rose-400 hover:text-rose-300">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvaDipendente} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">Salva</button>
              <button onClick={resetFormDip} className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICA PAGAMENTO */}
      <AnimatePresence>
        {showEditPagamentoModal && editingPagamento && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={chiudiModalPagamento}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-100">Modifica Pagamento</h2>
                <button onClick={chiudiModalPagamento} className="p-1 hover:bg-slate-700 rounded-lg transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Dipendente</label>
                  <p className="text-slate-200 font-medium">
                    {dipendenti.find(d => d.id === formPagamento.dipId)?.nome || 'N/D'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Importo Base (€)</label>
                  <input
                    type="number"
                    value={formPagamento.importoBase}
                    onChange={(e) => setFormPagamento({ ...formPagamento, importoBase: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Percentuale Pagata</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    value={formPagamento.percentualeDaPagare}
                    onChange={(e) => setFormPagamento({ ...formPagamento, percentualeDaPagare: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                  <p className="text-center text-sm text-rose-400 mt-1">{formPagamento.percentualeDaPagare}%</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Bonus (€)</label>
                  <input
                    type="number"
                    value={formPagamento.bonus}
                    onChange={(e) => setFormPagamento({ ...formPagamento, bonus: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={formPagamento.data}
                    onChange={(e) => setFormPagamento({ ...formPagamento, data: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Note</label>
                  <input
                    type="text"
                    value={formPagamento.note}
                    onChange={(e) => setFormPagamento({ ...formPagamento, note: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500"
                    placeholder="Note opzionali"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={chiudiModalPagamento}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={salvaPagamento}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-medium"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PULSANTE NUOVO */}
      <button
        onClick={() => setFormDip({ ...formDip, nome: " " })}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition flex items-center justify-center text-3xl font-bold"
      >
        +
      </button>

      <style>{`
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #f43f5e;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"].slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #f43f5e;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default Dipendenti;