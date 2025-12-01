// src/pages/dipendenti.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from "../../config/tenant";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import { formatCurrency } from "../../utils/formatters";
import { Edit2, Trash2, Calendar, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RUOLI_DISPONIBILI = ["Setter", "Coach", "Admin", "Manager", "Altro"];

const Dipendenti = () => {
  const [dipendenti, setDipendenti] = useState([]);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incassoMensile, setIncassoMensile] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [periodoRiferimento, setPeriodoRiferimento] = useState({ tipo: 'anno', anno: new Date().getFullYear(), mese: null });

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

  // === INCASSO PERIODO ===
  useEffect(() => {
    const loadIncassoMensile = async () => {
      try {
        let periodStart, periodEnd;
        
        if (periodoRiferimento.tipo === 'anno') {
          periodStart = new Date(periodoRiferimento.anno, 0, 1); // 1 gennaio
          periodEnd = new Date(periodoRiferimento.anno, 11, 31, 23, 59, 59); // 31 dicembre
        } else if (periodoRiferimento.tipo === 'mese') {
          periodStart = new Date(periodoRiferimento.anno, periodoRiferimento.mese, 1);
          periodEnd = new Date(periodoRiferimento.anno, periodoRiferimento.mese + 1, 0, 23, 59, 59);
        } else if (periodoRiferimento.tipo === 'range') {
          const [startYear, startMonth] = periodoRiferimento.meseInizio.split('-').map(Number);
          const [endYear, endMonth] = periodoRiferimento.meseFine.split('-').map(Number);
          periodStart = new Date(startYear, startMonth - 1, 1);
          periodEnd = new Date(endYear, endMonth, 0, 23, 59, 59);
        }
        
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        let income = 0;
        
        for (const clientDoc of clientsSnap.docs) {
          const clientData = clientDoc.data();
          if (!clientData.isOldClient) {
            const paymentsSnap = await getDocs(
              query(getTenantSubcollection(db, 'clients', clientDoc.id, 'payments'), orderBy('paymentDate', 'desc'))
            );
            
            paymentsSnap.docs.forEach(paymentDoc => {
              const paymentData = paymentDoc.data();
              const paymentDate = paymentData.paymentDate?.toDate();
              if (paymentDate && paymentDate >= periodStart && paymentDate <= periodEnd && !paymentData.isPast) {
                income += paymentData.amount || 0;
              }
            });
          }
        }
        
        setIncassoMensile(income);
      } catch (err) {
        console.error('Errore caricamento incasso periodo:', err);
      }
    };
    loadIncassoMensile();
  }, [periodoRiferimento]);

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
  const { provvigioniTotali, pagatiTotali, daPagareTotali, utileNetto } = useMemo(() => {
    let provv = 0;
    let pagati = 0;

    dipendenti.filter(d => !d.archived).forEach(dip => {
      if (dip.tipo === "percentuale") {
        provv += (incassoMensile * dip.percentuale) / 100;
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

    const utile = incassoMensile - pagati;
    return { provvigioniTotali: provv, pagatiTotali: pagati, daPagareTotali: provv - pagati, utileNetto: utile };
  }, [dipendenti, incassoMensile, pagamenti, meseFiltro]);

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
  };

  const eliminaPagamento = async (id) => {
    if (!confirm("Eliminare pagamento?")) return;
    await deleteDoc(getTenantDoc(db, 'pagamenti_dipendenti', id));
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
        
        {/* SELETTORE PERIODO INCASSO */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodoRiferimento({ tipo: 'anno', anno: new Date().getFullYear(), mese: null })}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  periodoRiferimento.tipo === 'anno' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Anno
              </button>
              <button
                onClick={() => setPeriodoRiferimento({ tipo: 'mese', anno: new Date().getFullYear(), mese: new Date().getMonth() })}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  periodoRiferimento.tipo === 'mese' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => setPeriodoRiferimento({ tipo: 'range', meseInizio: format(new Date(), 'yyyy-MM'), meseFine: format(new Date(), 'yyyy-MM') })}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  periodoRiferimento.tipo === 'range' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Periodo
              </button>
            </div>
            
            {periodoRiferimento.tipo === 'anno' && (
              <select
                value={periodoRiferimento.anno}
                onChange={(e) => setPeriodoRiferimento({ ...periodoRiferimento, anno: parseInt(e.target.value) })}
                className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            
            {periodoRiferimento.tipo === 'mese' && (
              <div className="flex gap-2">
                <select
                  value={periodoRiferimento.mese}
                  onChange={(e) => setPeriodoRiferimento({ ...periodoRiferimento, mese: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                >
                  {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={periodoRiferimento.anno}
                  onChange={(e) => setPeriodoRiferimento({ ...periodoRiferimento, anno: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {periodoRiferimento.tipo === 'range' && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="month"
                  value={periodoRiferimento.meseInizio || format(new Date(), 'yyyy-MM')}
                  onChange={(e) => setPeriodoRiferimento({ ...periodoRiferimento, meseInizio: e.target.value })}
                  className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
                <span className="text-slate-400 text-sm">→</span>
                <input
                  type="month"
                  value={periodoRiferimento.meseFine || format(new Date(), 'yyyy-MM')}
                  onChange={(e) => setPeriodoRiferimento({ ...periodoRiferimento, meseFine: e.target.value })}
                  className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90 flex items-center gap-1">
            <DollarSign size={16} /> 
            {periodoRiferimento.tipo === 'anno' && `Fatturato ${periodoRiferimento.anno}`}
            {periodoRiferimento.tipo === 'mese' && `Fatturato ${['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'][periodoRiferimento.mese]} ${periodoRiferimento.anno}`}
            {periodoRiferimento.tipo === 'range' && `Fatturato ${periodoRiferimento.meseInizio} / ${periodoRiferimento.meseFine}`}
          </p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(incassoMensile)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90 flex items-center gap-1"><TrendingUp size={16} /> Utile Netto</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(utileNetto)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90">Provvigioni</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(provvigioniTotali)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-sm opacity-90">Pagati</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(pagatiTotali)}</p>
        </div>
        <div className={`p-6 rounded-xl text-white shadow-lg ${daPagareTotali > 0 ? 'bg-gradient-to-br from-rose-600 to-rose-800' : 'bg-gradient-to-br from-green-600 to-green-800'}`}>
          <p className="text-sm opacity-90">Da Pagare</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(daPagareTotali)}</p>
        </div>
      </div>

      {/* CALENDARIO PAGAMENTI */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <button onClick={() => setMeseCalendario(addMonths(meseCalendario, -1))} className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition">
            <ChevronLeft size={16} className="text-slate-400 sm:hidden" /><ChevronLeft size={20} className="text-slate-400 hidden sm:block" />
          </button>
          <h3 className="text-sm sm:text-lg font-bold text-slate-100 flex items-center gap-1 sm:gap-2">
            <Calendar size={16} className="sm:hidden" /><Calendar size={20} className="hidden sm:block" /> {format(meseCalendario, "MMMM yyyy")}
          </h3>
          <button onClick={() => setMeseCalendario(addMonths(meseCalendario, 1))} className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition">
            <ChevronRight size={16} className="text-slate-400 sm:hidden" /><ChevronRight size={20} className="text-slate-400 hidden sm:block" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-3 text-center text-[10px] sm:text-sm">
          {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((d, i) => (
            <div key={`day-${i}`} className="font-bold text-slate-400 py-1 sm:py-2">
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline">{['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][i]}</span>
            </div>
          ))}
          {Array.from({ length: startOfMonth(meseCalendario).getDay() }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {giorniMese.map(giorno => {
            const pagamentiGiorno = pagamentiDelGiorno(giorno);
            return (
              <div
                key={giorno.toISOString()}
                className={`min-h-16 sm:min-h-28 p-1.5 sm:p-3 rounded-lg sm:rounded-xl border sm:border-2 transition-all cursor-pointer
                  ${pagamentiGiorno.length > 0 
                    ? 'bg-emerald-900/40 border-emerald-600 hover:bg-emerald-900/60' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70'
                  }`}
              >
                <p className="text-xs sm:text-sm font-bold text-slate-300 mb-0.5 sm:mb-1">{format(giorno, "d")}</p>
                <div className="space-y-1 sm:space-y-1.5 max-h-12 sm:max-h-20 overflow-y-auto">
                  {pagamentiGiorno.map(p => {
                    const dip = dipendentiMap.get(p.dipId);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-rose-600/30 to-purple-600/30 p-1 sm:p-2 rounded-md sm:rounded-lg text-[9px] sm:text-xs flex justify-between items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-rose-300 truncate">{dip?.nome}</p>
                          <p className="text-cyan-300 hidden sm:block">{formatCurrency(p.importo)}</p>
                        </div>
                        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0 ml-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); modificaPagamento(p); }}
                            className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          >
                            <Edit2 size={10} className="sm:hidden" /><Edit2 size={14} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); eliminaPagamento(p.id); }}
                            className="text-red-400 hover:text-red-300 p-0.5"
                          >
                            <Trash2 size={10} className="sm:hidden" /><Trash2 size={14} className="hidden sm:block" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {pagamentiGiorno.length === 0 && (
                  <p className="hidden sm:block text-xs text-slate-500 italic mt-2">Nessun pagamento</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ELENCO DIPENDENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dipendentiFiltrati.map((dip) => {
          const pagati = pagamenti.filter(p => p.dipId === dip.id && format(p.data, "yyyy-MM") === meseFiltro).reduce((sum, p) => sum + p.importo, 0);
          const provvigionePercentuale = dip.tipo === "percentuale" ? (incassoMensile * dip.percentuale) / 100 : 0;
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
                      readOnly 
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600" 
                    />
                    <input 
                      type="number" 
                      placeholder="Bonus" 
                      value={formPagamento.dipId === dip.id ? (formPagamento.bonus || "") : ""}
                      className="w-20 px-2 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500" 
                      onChange={(e) => setFormPagamento({ ...formPagamento, dipId: dip.id, importoBase: (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi), bonus: e.target.value })} 
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