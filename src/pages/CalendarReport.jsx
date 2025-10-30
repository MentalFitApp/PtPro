import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Users, Settings, FileText, Phone, Calendar, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarReport() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const checkAdminRole = async () => {
      try {
        const adminDocRef = doc(db, 'roles', 'admins');
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists() || !adminDoc.data().uids.includes(auth.currentUser.uid)) {
          navigate('/collaboratori');
          return;
        }
      } catch (err) {
        console.error('Errore verifica ruolo admin:', err);
        navigate('/collaboratori');
      }
    };

    checkAdminRole();

    const collabQuery = query(collection(db, 'collaboratori'));
    const unsubCollab = onSnapshot(collabQuery, (snap) => {
      const collabData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaboratori(collabData);
      setLoading(false);
    }, (err) => {
      console.error('Errore snapshot collaboratori:', err);
      setError('Errore nel recupero dei collaboratori: ' + err.message);
      setLoading(false);
    });

    return () => unsubCollab();
  }, [navigate, date]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      <p>{error}</p>
    </div>
  );

  const formattedDate = new Date(date).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const dailyReports = collaboratori
    .map(collab => {
      const report = collab.dailyReports?.find(r => r.date === date);
      return { 
        name: collab.name || collab.email.split('@')[0], 
        role: collab.role, 
        report 
      };
    })
    .filter(s => s.report)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6"
    >
      <motion.header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2">
          <Calendar size={28} /> Report del {formattedDate}
        </h1>
        <button
          onClick={() => navigate('/collaboratori')}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
        >
          Torna Indietro
        </button>
      </motion.header>

      <motion.div className="space-y-8">
        {dailyReports.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/60 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            <AlertCircle size={64} className="mx-auto text-yellow-500 mb-6" />
            <p className="text-slate-400 text-xl font-medium">
              {date < todayStr 
                ? 'Nessun report inviato per questa data (passata).' 
                : 'Nessun report inviato per questa data.'
              }
            </p>
            {date < todayStr && (
              <p className="text-red-500 mt-4 text-lg font-semibold">
                Questo giorno è passato senza report.
              </p>
            )}
          </div>
        ) : (
          dailyReports.map((s, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl font-bold text-slate-200">
                  {s.name} <span className="text-lg font-normal text-slate-400">({s.role})</span>
                </h2>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  s.report.eodReport && s.report.tracker 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {s.report.eodReport && s.report.tracker ? 'COMPLETO' : 'PARZIALE'}
                </span>
              </div>

              {/* EOD REPORT - COMPLETO */}
              {s.report.eodReport && (
                <div className="mb-8 p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-xl border border-cyan-500/20">
                  <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-3 mb-5">
                    <Settings size={22} /> EOD Report (Fine Giornata)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <span className="font-medium text-slate-300">Focus (1-5):</span>
                        <span className="text-cyan-300 font-bold text-lg">{s.report.eodReport.focus || '—'}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <span className="font-medium text-slate-300">Skills (1-5):</span>
                        <span className="text-cyan-300 font-bold text-lg">{s.report.eodReport.skills || '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <p className="font-medium text-green-400 mb-1">Dove hai fatto bene?</p>
                        <p className="text-green-300 text-sm">{s.report.eodReport.successi || 'Nessun dato'}</p>
                      </div>
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <p className="font-medium text-yellow-400 mb-1">Difficoltà incontrate</p>
                        <p className="text-yellow-300 text-sm">{s.report.eodReport.difficolta || 'Nessun dato'}</p>
                      </div>
                      <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded-lg">
                        <p className="font-medium text-rose-400 mb-1">Soluzioni applicate</p>
                        <p className="text-rose-300 text-sm">{s.report.eodReport.soluzioni || 'Nessun dato'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRACKER DMS - COMPLETO */}
              {s.report.tracker && (
                <div className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-xl border border-purple-500/20">
                  <h3 className="text-xl font-semibold text-purple-400 flex items-center gap-3 mb-5">
                    {s.role === 'Marketing' && <FileText size={22} />}
                    {s.role === 'Vendita' && <Phone size={22} />}
                    {s.role === 'Setter' && <TrendingUp size={22} />}
                    Tracker DMS ({s.role})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* SETTER */}
                    {s.role === 'Setter' && (
                      <>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-cyan-500/20">
                          <p className="text-cyan-400 font-medium">Outreach IG</p>
                          <p className="text-2xl font-bold text-cyan-300">{s.report.tracker.outreachIG || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-cyan-500/20">
                          <p className="text-cyan-400 font-medium">Follow-Ups IG</p>
                          <p className="text-2xl font-bold text-cyan-300">{s.report.tracker.followUpsIG || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-green-500/20">
                          <p className="text-green-400 font-medium">Risposte Avute</p>
                          <p className="text-2xl font-bold text-green-300">{s.report.tracker.risposteAvute || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-green-500/20">
                          <p className="text-green-400 font-medium">Convo Fatte</p>
                          <p className="text-2xl font-bold text-green-300">{s.report.tracker.convoFatte || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-yellow-500/20">
                          <p className="text-yellow-400 font-medium">Call Proposte</p>
                          <p className="text-2xl font-bold text-yellow-300">{s.report.tracker.callProposte || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-rose-500/20">
                          <p className="text-rose-400 font-medium">Call Prenotate</p>
                          <p className="text-2xl font-bold text-rose-300">{s.report.tracker.callPrenotate || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-purple-500/20">
                          <p className="text-purple-400 font-medium">Call Fissate</p>
                          <p className="text-2xl font-bold text-purple-300">{s.report.tracker.callFissate || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo Outreach</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoOutreach || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo Follow-Ups</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoFollowUps || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo Convo</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoConvo || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo WA</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoWA || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo FB</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoFB || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo TT</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoTT || '—'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/20 col-span-2 md:col-span-1">
                          <p className="text-indigo-400 font-medium">Tempo Riordine</p>
                          <p className="text-lg font-bold text-indigo-300">{s.report.tracker.tempoRiordine || '—'}</p>
                        </div>
                      </>
                    )}

                    {/* MARKETING */}
                    {s.role === 'Marketing' && (
                      <>
                        <div className="p-4 bg-rose-900/20 border border-rose-500/30 rounded-lg col-span-2">
                          <p className="text-rose-400 font-medium text-lg">Views 24h</p>
                          <p className="text-3xl font-bold text-rose-300">{s.report.tracker.volumeViews24h || 0}</p>
                        </div>
                        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg col-span-2">
                          <p className="text-green-400 font-medium text-lg">Leads 24h</p>
                          <p className="text-3xl font-bold text-green-300">{s.report.tracker.volumeLeads24h || 0}</p>
                        </div>
                      </>
                    )}

                    {/* VENDITA */}
                    {s.role === 'Vendita' && (
                      <>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-cyan-500/20">
                          <p className="text-cyan-400 font-medium">Chiamate Fatte</p>
                          <p className="text-2xl font-bold text-cyan-300">{s.report.tracker.callFatte || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-green-500/20">
                          <p className="text-green-400 font-medium">Chiusi</p>
                          <p className="text-2xl font-bold text-green-300">{s.report.tracker.callChiuse || 0}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-rose-500/20">
                          <p className="text-rose-400 font-medium">Fatturato</p>
                          <p className="text-2xl font-bold text-rose-300">€{s.report.tracker.fatturatoTotale || 0}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}