// src/pages/admin/landingPages/LandingPagesList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { getTenantCollection, getTenantDoc } from '../../../config/tenant';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, Copy, Globe, Sparkles,
  LayoutGrid, Calendar, User, ExternalLink, MoreVertical
} from 'lucide-react';

export default function LandingPagesList() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const pagesRef = getTenantCollection(db, 'landingPages');
    
    // Prova prima con orderBy, se fallisce usa query senza ordinamento
    const q = query(pagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const pagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('📊 Landing pages caricate:', pagesData.length);
        console.log('   Path collection:', pagesRef.path);
        if (pagesData.length > 0) {
          console.log('   Pagine trovate:', pagesData.map(p => ({ id: p.id, title: p.title, status: p.status })));
        } else {
          console.log('   ⚠️ Nessuna pagina trovata. Prova il bottone 🧪 per testare il salvataggio.');
        }
        setPages(pagesData);
        setLoading(false);
      },
      (error) => {
        // Se orderBy fallisce (indice mancante), carica senza ordinamento
        console.warn('⚠️ orderBy fallito, carico senza ordinamento:', error.message);
        
        const fallbackUnsubscribe = onSnapshot(pagesRef, (snapshot) => {
          const pagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Ordina manualmente in memoria
          pagesData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
          });
          console.log('📊 Landing pages caricate (fallback):', pagesData.length);
          setPages(pagesData);
          setLoading(false);
        });
        
        return fallbackUnsubscribe;
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (pageId) => {
    try {
      await deleteDoc(getTenantDoc(db, 'landingPages', pageId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore durante l\'eliminazione della landing page');
    }
  };

  const handleDuplicate = async (page) => {
    if (!confirm(`Duplicare "${page.title}"?`)) return;

    try {
      const tenantId = localStorage.getItem('tenantId');
      const newSlug = `${page.slug}-copia-${Date.now()}`;
      
      await addDoc(getTenantCollection(tenantId, 'landingPages'), {
        ...page,
        title: `${page.title} (Copia)`,
        slug: newSlug,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        updatedBy: auth.currentUser.uid
      });

      alert('Pagina duplicata con successo!');
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Errore duplicazione: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-400';
      case 'archived': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Pubblicata';
      case 'draft': return 'Bozza';
      case 'archived': return 'Archiviata';
      default: return 'Sconosciuto';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="w-full max-w-[100vw] py-2 sm:py-4 space-y-2 sm:space-y-4 mobile-safe-bottom overflow-x-hidden">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-3 sm:p-5 shadow-glow mx-2 sm:mx-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <LayoutGrid className="text-blue-400" size={28} />
                Landing Pages
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Crea e gestisci le landing pages del tuo sito {pages.length > 0 && `(${pages.length})`}
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              {/* Debug: Test salvataggio */}
              {import.meta.env.DEV && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      const { addDoc, serverTimestamp } = await import('firebase/firestore');
                      console.log('🧪 Test salvataggio landing page...');
                      const docRef = await addDoc(
                        getTenantCollection(db, 'landingPages'),
                        {
                          title: 'TEST - Pagina di Debug ' + new Date().toLocaleTimeString(),
                          slug: 'test-debug-' + Date.now(),
                          status: 'draft',
                          sections: [{
                            type: 'hero',
                            props: { title: 'Test', subtitle: 'Debug', ctaText: 'Click', ctaLink: '#' }
                          }],
                          seo: { metaTitle: 'Test', metaDescription: 'Test', ogImage: '' },
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp(),
                          createdBy: auth.currentUser.uid
                        }
                      );
                      console.log('✅ Test salvato:', docRef.id, docRef.path);
                      alert('Test salvato! ID: ' + docRef.id + '\nRicarica la pagina per vederlo.');
                    } catch (e) {
                      console.error('❌ Errore test:', e);
                      alert('Errore: ' + e.message);
                    }
                  }}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs"
                  title="Test debug salvataggio"
                >
                  🧪
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/landing-pages/new')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium shadow-lg text-sm"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">Crea Landing Page</span>
                <span className="sm:inline md:hidden">Crea</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Lista Landing Pages */}
        <div className="mx-2 sm:mx-4">
          {pages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-8 sm:p-12 text-center shadow-glow"
            >
              <LayoutGrid className="mx-auto text-slate-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nessuna Landing Page
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Inizia creando la tua prima landing page con l'AI
              </p>
              <button
                onClick={() => navigate('/landing-pages/new')}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium shadow-lg mx-auto"
              >
                <Sparkles size={20} />
                Crea Landing Page
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pages.map((page) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all shadow-glow group"
                >
                {/* Preview Image */}
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe className="text-slate-600" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <button
                        onClick={() => window.open(`/site/${page.slug}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        onClick={() => navigate(`/landing-pages/${page.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg"
                      >
                        <Edit2 size={16} />
                        Modifica
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate mb-1">
                        {page.title}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        /{page.slug}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(page.status)}`}>
                      {getStatusLabel(page.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {page.createdAt?.toDate().toLocaleDateString('it-IT')}
                    </div>
                    {page.aiGenerated && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Sparkles size={12} />
                        AI
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDuplicate(page)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                      title="Duplica"
                    >
                      <Copy size={14} />
                      Duplica
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(page.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-glow"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Conferma Eliminazione
            </h3>
            <p className="text-slate-400 mb-6">
              Sei sicuro di voler eliminare questa landing page? L'azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Elimina
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
