import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  query,
  collectionGroup,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { formatCurrency } from "../utils/formatters";

const RUOLI_DISPONIBILI = ["Setter", "Coach", "Admin", "Manager", "Altro"];

const Dipendenti = () => {
  const [dipendenti, setDipendenti] = useState([]);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incassoMensile, setIncassoMensile] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [giornoSelezionato, setGiornoSelezionato] = useState(null);

  // Form
  const [formDip, setFormDip] = useState({
    nome: "",
    nominativo: "",
    iban: "",
    tipo: "percentuale",
    percentuale: "",
    fissi: [],
    ruolo: "Setter",
  });
  const [editingDip, setEditingDip] = useState(null);
  const [selectedDip, setSelectedDip] = useState(null);

  // Pagamento
  const [formPagamento, setFormPagamento] = useState({
    dipId: "",
    importoBase: "",
    percentualeDaPagare: 100,
    bonus: "",
    data: format(new Date(), "yyyy-MM-dd"),
    note: "",
  });

  // Filtro
  const [meseFiltro, setMeseFiltro] = useState(format(new Date(), "yyyy-MM"));

  // === INCASSO MENSILE ===
  useEffect(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc'));

    const unsub = onSnapshot(paymentsQuery, async (snap) => {
      let income = 0;
      for (const docSnap of snap.docs) {
        const paymentDate = docSnap.data().paymentDate?.toDate();
        if (paymentDate && paymentDate >= currentMonthStart) {
          const clientDocRef = docSnap.ref.parent.parent;
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            const clientData = clientDocSnap.data();
            if (!clientData.isOldClient && !docSnap.data().isPast) {
              income += docSnap.data().amount || 0;
            }
          }
        }
      }
      setIncassoMensile(income);
    });

    return () => unsub();
  }, [meseFiltro]);

  // === DIPENDENTI & PAGAMENTI ===
  useEffect(() => {
    const unsubDip = onSnapshot(collection(db, "dipendenti_provvigioni"), (snap) => {
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

    const unsubPag = onSnapshot(collection(db, "pagamenti_dipendenti"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate(),
      }));
      setPagamenti(list);
    });

    return () => {
      unsubDip();
      unsubPag();
    };
  }, []);

  // === MAPPA PER LOOKUP RAPIDO DIPENDENTE ===
  const dipendentiMap = useMemo(() => {
    const map = new Map();
    dipendenti.forEach(dip => map.set(dip.id, dip));
    return map;
  }, [dipendenti]);

  // === PROVVIGIONI TOTALI ===
  const { provvigioniTotali, pagatiTotali, daPagareTotali } = useMemo(() => {
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

    return { provvigioniTotali: provv, pagatiTotali: pagati, daPagareTotali: provv - pagati };
  }, [dipendenti, incassoMensile, pagamenti, meseFiltro]);

  // === CALENDARIO ===
  const start = startOfMonth(meseCalendario);
  const end = endOfMonth(meseCalendario);
  const days = eachDayOfInterval({ start, end });

  const pagamentiDelMese = useMemo(() => {
    return pagamenti.filter(p => 
      format(p.data, "yyyy-MM") === format(meseCalendario, "yyyy-MM")
    );
  }, [pagamenti, meseCalendario]);

  const pagamentiDelGiorno = useMemo(() => {
    return giornoSelezionato
      ? pagamentiDelMese.filter(p => isSameDay(p.data, giornoSelezionato))
      : [];
  }, [giornoSelezionato, pagamentiDelMese]);

  // === FUNZIONI ===
  const resetFormDip = () => {
    setFormDip({
      nome: "", nominativo: "", iban: "", tipo: "percentuale",
      percentuale: "", fissi: [], ruolo: "Setter",
    });
    setEditingDip(null);
  };

  const salvaDipendente = async () => {
    if (!formDip.nome.trim()) return;

    const ref = editingDip
      ? doc(db, "dipendenti_provvigioni", editingDip.id)
      : doc(collection(db, "dipendenti_provvigioni"));

    const data = {
      nome: formDip.nome.trim(),
      nominativo: formDip.nominativo.trim(),
      iban: formDip.iban.trim(),
      tipo: formDip.tipo,
      percentuale: formDip.tipo === "percentuale" ? parseFloat(formDip.percentuale) || 0 : 0,
      fissi: formDip.tipo === "fisso"
        ? formDip.fissi
            .map((f) => ({ importo: parseFloat(f.importo) || 0, data: f.data }))
            .filter((f) => f.importo > 0 && f.data)
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
    await setDoc(doc(db, "dipendenti_provvigioni", dip.id), { archived: true }, { merge: true });
  };

  const salvaPagamento = async () => {
    if (!formPagamento.dipId || !formPagamento.importoBase || !formPagamento.data) return;

    const importoTotale = parseFloat(formPagamento.importoBase) + (parseFloat(formPagamento.bonus) || 0);

    const ref = doc(collection(db, "pagamenti_dipendenti"));
    await setDoc(ref, {
      dipId: formPagamento.dipId,
      importo: importoTotale,
      importoBase: parseFloat(formPagamento.importoBase),
      percentualePagata: formPagamento.percentualeDaPagare,
      bonus: parseFloat(formPagamento.bonus) || 0,
      data: new Date(formPagamento.data),
      note: formPagamento.note.trim(),
      createdAt: serverTimestamp(),
    });

    setFormPagamento({ ...formPagamento, importoBase: "", percentualeDaPagare: 100, bonus: "", note: "" });
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Dipendenti & Provvigioni</h1>
        <div className="flex gap-2">
          <input
            type="month"
            value={meseFiltro}
            onChange={(e) => setMeseFiltro(e.target.value)}
            className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-rose-500 text-sm"
          />
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${showArchived ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {showArchived ? 'Attivi' : 'Archiviati'}
          </button>
        </div>
      </div>

      {/* STATISTICHE + CALENDARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-xl text-white">
            <p className="text-sm opacity-90">Incasso Mese</p>
            <p className="text-2xl font-bold">{formatCurrency(incassoMensile)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-xl text-white">
            <p className="text-sm opacity-90">Provvigioni Totali</p>
            <p className="text-2xl font-bold">{formatCurrency(provvigioniTotali)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-5 rounded-xl text-white">
            <p className="text-sm opacity-90">Pagati</p>
            <p className="text-2xl font-bold">{formatCurrency(pagatiTotali)}</p>
          </div>
          <div className={`p-5 rounded-xl text-white ${daPagareTotali > 0 ? 'bg-gradient-to-br from-rose-600 to-rose-800' : 'bg-gradient-to-br from-green-600 to-green-800'}`}>
            <p className="text-sm opacity-90">Da Pagare</p>
            <p className="text-2xl font-bold">{formatCurrency(daPagareTotali)}</p>
          </div>
        </div>

        {/* MINI CALENDARIO */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setMeseCalendario(new Date(meseCalendario.getFullYear(), meseCalendario.getMonth() - 1))} className="text-slate-400 hover:text-slate-200">←</button>
            <h3 className="text-sm font-semibold text-slate-200">{format(meseCalendario, "MMMM yyyy")}</h3>
            <button onClick={() => setMeseCalendario(new Date(meseCalendario.getFullYear(), meseCalendario.getMonth() + 1))} className="text-slate-400 hover:text-slate-200">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map(d => <div key={d} className="text-slate-500 font-medium">{d}</div>)}
            {Array.from({ length: start.getDay() }, (_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const hasPayment = pagamentiDelMese.some(p => isSameDay(p.data, day));
              const isSelected = giornoSelezionato && isSameDay(giornoSelezionato, day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setGiornoSelezionato(day)}
                  className={`p-2 rounded-lg transition text-xs font-medium ${
                    hasPayment
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-rose-600 text-white'
                      : isToday
                      ? 'bg-slate-700 text-rose-400'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {giornoSelezionato && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">{format(giornoSelezionato, "d MMMM yyyy")}</p>
              {pagamentiDelGiorno.length > 0 ? (
                <div className="space-y-1">
                  {pagamentiDelGiorno.map(p => {
                    const dip = dipendentiMap.get(p.dipId);
                    return (
                      <div key={p.id} className="text-xs bg-slate-700/50 p-2 rounded">
                        <p className="font-medium text-emerald-400">
                          {dip?.nome}: {formatCurrency(p.importo)}
                        </p>
                        {p.note && <p className="text-slate-400 italic">{p.note}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Nessun pagamento</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ELENCO DIPENDENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dipendentiFiltrati.map((dip) => {
          const pagati = pagamenti
            .filter((p) => p.dipId === dip.id && format(p.data, "yyyy-MM") === meseFiltro)
            .reduce((sum, p) => sum + p.importo, 0);

          const provvigionePercentuale = dip.tipo === "percentuale" ? (incassoMensile * dip.percentuale) / 100 : 0;
          const totaleFissi = dip.tipo === "fisso"
            ? dip.fissi.filter((f) => format(new Date(f.data), "yyyy-MM") === meseFiltro)
                .reduce((sum, f) => sum + f.importo, 0)
            : 0;
          const daPagare = (dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi) - pagati;

          return (
            <div
              key={dip.id}
              className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border ${dip.archived ? 'border-slate-600 opacity-60' : 'border-slate-700 hover:border-slate-600'} transition-all`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{dip.nome}</h3>
                  {dip.nominativo && <p className="text-xs text-rose-400">{dip.nominativo}</p>}
                  <p className="text-xs text-slate-500">{dip.ruolo}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedDip(dip)} className="text-xs text-blue-400 hover:text-blue-300">Storico</button>
                  <button
                    onClick={() => {
                      setEditingDip(dip);
                      setFormDip({
                        nome: dip.nome,
                        nominativo: dip.nominativo || "",
                        iban: dip.iban || "",
                        tipo: dip.tipo,
                        percentuale: dip.percentuale?.toString() || "",
                        fissi: dip.fissi || [],
                        ruolo: dip.ruolo,
                      });
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Modifica
                  </button>
                  {!dip.archived && (
                    <button onClick={() => archiviaDipendente(dip)} className="text-xs text-red-400 hover:text-red-300">Archivia</button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  {dip.tipo === "percentuale" ? `${dip.percentuale}% su incasso` : "Fisso mensile"}
                </p>
                {dip.iban && <p className="text-xs text-slate-500">IBAN: {dip.iban}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Provvigione</span>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(dip.tipo === "percentuale" ? provvigionePercentuale : totaleFissi)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Pagato</span>
                  <span className="font-medium text-amber-400">{formatCurrency(pagati)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-300">Da pagare</span>
                  <span className={daPagare > 0 ? "text-rose-400" : "text-green-400"}>
                    {formatCurrency(daPagare)}
                  </span>
                </div>
              </div>

              {!dip.archived && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Paga il {formPagamento.percentualeDaPagare || 100}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={formPagamento.percentualeDaPagare || 100}
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
                      value={formPagamento.importoBase || ""}
                      readOnly
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600"
                    />
                    <input
                      type="number"
                      placeholder="Bonus"
                      className="w-20 px-2 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500"
                      onChange={(e) => setFormPagamento({ ...formPagamento, bonus: e.target.value })}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Note (es. Bonifico, Contanti)"
                    value={formPagamento.note}
                    onChange={(e) => setFormPagamento({ ...formPagamento, note: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500"
                  />

                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formPagamento.data}
                      onChange={(e) => setFormPagamento({ ...formPagamento, data: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={salvaPagamento}
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
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {editingDip ? "Modifica" : "Nuovo"} Dipendente
            </h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={formDip.nome} onChange={(e) => setFormDip({ ...formDip, nome: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500" />
              <input type="text" placeholder="Nominativo (es. Luca - Setter)" value={formDip.nominativo} onChange={(e) => setFormDip({ ...formDip, nominativo: e.target.value })} className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-rose-500" />
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

      <style jsx>{`
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