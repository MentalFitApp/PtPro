import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Globe,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getLandingPages,
  deleteLandingPage,
  duplicateLandingPage,
  LANDING_TEMPLATES_LIGHT,
} from '../../services/landingPageService';

/**
 * LandingPagesList - Lista e gestione delle landing pages
 */
const LandingPagesList = () => {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const result = await getLandingPages(tenantId);
      setPages(result);
    } catch (error) {
      console.error('Errore caricamento landing pages:', error);
      toast.error('Errore nel caricamento delle landing pages');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDelete = async (pageId) => {
    if (!tenantId) return;

    setDeleting(true);
    try {
      await deleteLandingPage(tenantId, pageId);
      setPages(prev => prev.filter(p => p.id !== pageId));
      toast.success('Landing page eliminata');
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast.error('Errore nell\'eliminazione');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (page) => {
    if (!tenantId) return;

    try {
      const newPageId = await duplicateLandingPage(tenantId, page.id);
      await fetchPages();
      toast.success('Landing page duplicata');
      navigate(`/admin/landing-pages/${newPageId}/edit`);
    } catch (error) {
      console.error('Errore duplicazione:', error);
      toast.error('Errore nella duplicazione');
    }
  };

  const createFromTemplate = (templateKey) => {
    navigate(`/admin/landing-pages/new?template=${templateKey}`);
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'published' && page.isPublished) ||
      (filterStatus === 'draft' && !page.isPublished);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-700 rounded w-1/3" />
            <div className="h-12 bg-slate-700 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Landing Pages</h1>
            <p className="text-slate-400 mt-1">
              Crea e gestisci le tue landing pages per acquisire nuovi clienti
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/landing-pages/leads"
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25"
            >
              <Users className="w-5 h-5" />
              Vedi Leads
            </Link>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all shadow-lg shadow-sky-500/25"
            >
              <Plus className="w-5 h-5" />
              Nuova Landing Page
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca landing pages..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Tutte</option>
              <option value="published">Pubblicate</option>
              <option value="draft">Bozze</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <Globe className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pages.length}</p>
                <p className="text-sm text-slate-400">Totale pagine</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pages.filter(p => p.isPublished).length}</p>
                <p className="text-sm text-slate-400">Pubblicate</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {pages.reduce((acc, p) => acc + (p.analytics?.views || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-400">Visite totali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pages Grid */}
        {filteredPages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || filterStatus !== 'all' 
                ? 'Nessuna landing page trovata' 
                : 'Nessuna landing page creata'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Crea la tua prima landing page per iniziare ad acquisire nuovi clienti'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Crea Landing Page
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPages.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-sky-500/50 transition-all"
                >
                  {/* Preview Image */}
                  <div className="relative h-40 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 overflow-hidden">
                    {page.seo?.ogImage ? (
                      <img
                        src={page.seo.ogImage}
                        alt={page.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        page.isPublished
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {page.isPublished ? 'Pubblicata' : 'Bozza'}
                      </span>
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link
                        to={`/admin/landing-pages/${page.id}/edit`}
                        className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(page)}
                        className="p-3 bg-slate-600 text-white rounded-full hover:bg-slate-500 transition-colors"
                        title="Duplica"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      {page.isPublished && (
                        <a
                          href={`/p/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          title="Visualizza"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => setShowDeleteModal(page.id)}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white truncate">
                        {page.title}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        /p/{page.slug}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Eye className="w-4 h-4" />
                          <span>{page.analytics?.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <BarChart3 className="w-4 h-4" />
                          <span>
                            {page.analytics?.views > 0
                              ? ((page.analytics?.conversions || 0) / page.analytics.views * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(page.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">
                  Scegli un Template
                </h2>
                <p className="text-slate-400 mt-1">
                  Inizia con un template pre-costruito o crea da zero
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(LANDING_TEMPLATES_LIGHT).map(([key, template]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowTemplateModal(false);
                        createFromTemplate(key);
                      }}
                      className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-left hover:border-sky-500 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{template.preview}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-sky-400 transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.blockTypes.slice(0, 4).map((blockType, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-slate-600 rounded text-slate-300"
                              >
                                {blockType}
                              </span>
                            ))}
                            {template.blockTypes.length > 4 && (
                              <span className="text-xs px-2 py-0.5 bg-slate-600 rounded text-slate-300">
                                +{template.blockTypes.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Elimina Landing Page
                </h3>
                <p className="text-slate-400 mb-6">
                  Sei sicuro di voler eliminare questa landing page? L&apos;azione non può essere annullata.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    disabled={deleting}
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    disabled={deleting}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Eliminazione...' : 'Elimina'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPagesList;
