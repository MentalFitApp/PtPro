import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { formatCurrency } from "../utils/formatters";

const Pagamenti = () => {
  const [provvigioni, setProvvigioni] = useState([]);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form collaboratore
  const [formCollab, setFormCollab] = useState({
    nome: "",
    iban: "",
    tipo: "percentuale",
    percentuale: "",
    fissi: [],
  });
  const [editingCollab, setEditingCollab] = useState(null);

  // Form pagamento
  const [formPagamento, setFormPagamento] = useState({
    collabId: "",
    importo: "",
    data: "",
    note: "",
  });

  // Filtro mese
  const [meseFiltro, setMeseFiltro] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    const unsubProv = onSnapshot(collection(db, "provvigioni"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        percentuale: doc.data().percentuale || 0,
        fissi: doc.data().fissi || [],
      }));
      setProvvigioni(list);
      setLoading(false);
    });

    const unsubPag = onSnapshot(collection(db, "pagamenti"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPagamenti(list);
    });

    return () => {
      unsubProv();
      unsubPag();
    };
  }, []);

  const resetFormCollab = () => {
    setFormCollab({
      nome: "",
      iban: "",
      tipo: "percentuale",
      percentuale: "",
      fissi: [],
    });
    setEditingCollab(null);
  };

  const salvaCollaboratore = async () => {
    if (!formCollab.nome.trim()) return;

    const ref = editingCollab
      ? doc(db, "provvigioni", editingCollab.id)
      : doc(collection(db, "provvigioni"));

    const data = {
      nome: formCollab.nome.trim(),
      iban: formCollab.iban.trim(),
      tipo: formCollab.tipo,
      percentuale:
        formCollab.tipo === "percentuale"
          ? parseFloat(formCollab.percentuale) || 0
          : 0,
      fissi:
        formCollab.tipo === "fisso"
          ? formCollab.fissi
              .map((f) => ({
                importo: parseFloat(f.importo) || 0,
                data: f.data,
              }))
              .filter((f) => f.importo > 0 && f.data)
          : [],
      updatedAt: serverTimestamp(),
    };

    if (!editingCollab) data.createdAt = serverTimestamp();

    await setDoc(ref, data, { merge: true });
    resetFormCollab();
  };

  const salvaPagamento = async () => {
    if (!formPagamento.collabId || !formPagamento.importo || !formPagamento.data)
      return;

    const ref = doc(collection(db, "pagamenti"));
    await setDoc(ref, {
      collabId: formPagamento.collabId,
      importo: parseFloat(formPagamento.importo),
      data: new Date(formPagamento.data),
      note: formPagamento.note.trim(),
      createdAt: serverTimestamp(),
    });

    setFormPagamento({ collabId: "", importo: "", data: "", note: "" });
  };

  const aggiungiFisso = () => {
    setFormCollab({
      ...formCollab,
      fissi: [...formCollab.fissi, { importo: "", data: "" }],
    });
  };

  const rimuoviFisso = (i) => {
    setFormCollab({
      ...formCollab,
      fissi: formCollab.fissi.filter((_, index) => index !== i),
    });
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Pagamenti Collaboratori</h1>
        <input
          type="month"
          value={meseFiltro}
          onChange={(e) => setMeseFiltro(e.target.value)}
          className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* ELENCO COLLABORATORI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provvigioni.map((collab) => {
          const pagati = pagamenti
            .filter((p) => p.collabId === collab.id)
            .reduce((sum, p) => sum + p.importo, 0, 0);

          const fissiMese = collab.fissi.filter((f) => {
            const data = new Date(f.data);
            return format(data, "yyyy-MM") === meseFiltro;
          });

          const totaleFissi = fissiMese.reduce((sum, f) => sum + f.importo, 0);
          const daPagare = totaleFissi - pagati;

          return (
            <div
              key={collab.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-slate-100">{collab.nome}</h3>
                <button
                  onClick={() => {
                    setEditingCollab(collab);
                    setFormCollab({
                      nome: collab.nome,
                      iban: collab.iban || "",
                      tipo: collab.tipo,
                      percentuale: collab.percentuale || "",
                      fissi: collab.fissi || [],
                    });
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Modifica
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  {collab.tipo === "percentuale"
                    ? `${collab.percentuale}% provvigione`
                    : "Fisso mensile"}
                </p>
                {collab.iban && (
                  <p className="text-xs text-slate-500">IBAN: {collab.iban}</p>
                )}
              </div>

              {/* Fissi del mese */}
              <div className="mt-4 space-y-2">
                {fissiMese.map((f, i) => {
                  const pagato = pagamenti.some(
                    (p) =>
                      p.collabId === collab.id &&
                      new Date(p.data).toDateString() === new Date(f.data).toDateString()
                  );
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-2 rounded text-xs ${
                        pagato
                          ? "bg-green-900/30 text-green-300"
                          : "bg-amber-900/30 text-amber-300"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(f.importo)}</p>
                        <p className="text-slate-400">
                          {format(new Date(f.data), "dd MMM yyyy")}
                        </p>
                      </div>
                      <span>{pagato ? "Pagato" : "In sospeso"}</span>
                    </div>
                  );
                })}
                {fissiMese.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Nessun fisso questo mese</p>
                )}
              </div>

              {/* Totale da pagare */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Da pagare:</span>
                  <span
                    className={`font-semibold ${
                      daPagare > 0 ? "text-amber-300" : "text-green-400"
                    }`}
                  >
                    {formatCurrency(daPagare)}
                  </span>
                </div>
              </div>

              {/* Registra pagamento */}
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  placeholder="Importo"
                  className="flex-1 px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                  onChange={(e) =>
                    setFormPagamento({
                      ...formPagamento,
                      collabId: collab.id,
                      importo: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                  onChange={(e) =>
                    setFormPagamento({
                      ...formPagamento,
                      data: e.target.value,
                    })
                  }
                />
                <button
                  onClick={salvaPagamento}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Paga
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NUOVO/MODIFICA COLLABORATORE */}
      {(formCollab.nome || editingCollab) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {editingCollab ? "Modifica" : "Nuovo"} Collaboratore
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                value={formCollab.nome}
                onChange={(e) =>
                  setFormCollab({ ...formCollab, nome: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="IBAN"
                value={formCollab.iban}
                onChange={(e) =>
                  setFormCollab({ ...formCollab, iban: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              />

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="percentuale"
                    checked={formCollab.tipo === "percentuale"}
                    onChange={(e) => setFormCollab({ ...formCollab, tipo: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Percentuale</span>
                  {formCollab.tipo === "percentuale" && (
                    <input
                      type="number"
                      placeholder="%"
                      value={formCollab.percentuale}
                      onChange={(e) => setFormCollab({ ...formCollab, percentuale: e.target.value })}
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none"
                    />
                  )}
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo"
                    value="fisso"
                    checked={formCollab.tipo === "fisso"}
                    onChange={(e) => setFormCollab({ ...formCollab, tipo: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Fisso</span>
                </label>
              </div>

              {formCollab.tipo === "fisso" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Fissi mensili</span>
                    <button
                      onClick={aggiungiFisso}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Aggiungi
                    </button>
                  </div>
                  {formCollab.fissi.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Importo"
                        value={f.importo}
                        onChange={(e) => {
                          const nuovi = [...formCollab.fissi];
                          nuovi[i].importo = e.target.value;
                          setFormCollab({ ...formCollab, fissi: nuovi });
                        }}
                        className="flex-1 px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={f.data}
                        onChange={(e) => {
                          const nuovi = [...formCollab.fissi];
                          nuovi[i].data = e.target.value;
                          setFormCollab({ ...formCollab, fissi: nuovi });
                        }}
                        className="px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={() => rimuoviFisso(i)}
                        className="px-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvaCollaboratore}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Salva
              </button>
              <button
                onClick={resetFormCollab}
                className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PULSANTE NUOVO COLLABORATORE */}
      <button
        onClick={() => setFormCollab({ ...formCollab, nome: " " })}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center text-2xl"
      >
        +
      </button>
    </div>
  );
};

export default Pagamenti;