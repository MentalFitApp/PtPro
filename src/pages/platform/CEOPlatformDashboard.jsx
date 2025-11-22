// src/pages/platform/CEOPlatformDashboard.jsx - VERSIONE COMPLETA
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, getDocs, where, doc, getDoc, orderBy, limit,
  updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { 
  BarChart3, Users, DollarSign, Building2, TrendingUp, 
  Activity, Shield, AlertCircle, CheckCircle, Crown,
  Zap, Package, CreditCard, UserPlus, Eye, LogOut,
  Settings, Database, RefreshCw, ChevronLeft, ChevronRight,
  Home, Search, Filter, Download, Upload, Trash2, Edit3,
  Bell, Moon, Sun, Menu, X, Server, Globe, Lock, Unlock,
  Star, Award, Target, Sparkles, MessageSquare, FileText,
  Calendar, ShieldCheck, Clock, ArrowUp, ArrowDown, Plus,
  MessageCircle, Webhook, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, ArcElement, Filler 
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

// === TRANSLATIONS ===
const translations = {
  en: {
    overview: 'Platform Overview',
    tenants: 'Tenants Management',
    subscriptions: 'Subscription Plans',
    billing: 'Billing & Invoices',
    addons: 'Add-ons & Extensions',
    features: 'Features Manager',
    analytics: 'Platform Analytics',
    users: 'All Platform Users',
    revenue: 'Revenue Dashboard',
    database: 'Database Management',
    activity: 'Activity Log',
    notifications: 'Platform Notifications',
    settings: 'Platform Settings',
    support: 'Support Tickets',
    webhooks: 'Webhooks & Integrations',
    totalTenants: 'Total Tenants',
    activeTenants: 'Active Tenants',
    totalUsers: 'Total Users',
    monthlyRevenue: 'Monthly Revenue',
    healthScore: 'Health Score',
    plan: 'Plan',
    status: 'Status',
    actions: 'Actions',
    createTenant: 'Create New Tenant',
    impersonate: 'Login as Tenant',
    exitImpersonation: 'Exit Impersonation',
    impersonationActive: 'Impersonation Mode Active',
    viewingAs: 'You are viewing as',
    addTenant: 'Add Tenant',
    search: 'Search tenants...',
    allPlans: 'All Plans',
    // Support Tickets
    newTicket: 'New Ticket',
    ticketSubject: 'Subject',
    ticketMessage: 'Message',
    ticketPriority: 'Priority',
    ticketStatus: 'Status',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    reply: 'Reply',
    close: 'Close',
    logout: 'Logout',
    // Subscriptions
    subscriptionPlans: 'Subscription Plans',
    month: 'month',
    tenantsCount: 'tenants',
    managePlanFor: 'Manage Plan for',
    // Billing
    billingInvoices: 'Billing & Invoices',
    manageBillingDesc: 'Manage billing, invoices, and payment status',
    generateInvoice: 'Generate Invoice',
    pendingPayments: 'Pending Payments',
    failedPayments: 'Failed Payments',
    totalInvoiced: 'Total Invoiced',
    successRate: 'Success Rate',
    recentInvoices: 'Recent Invoices',
    invoiceNumber: 'Invoice #',
    tenant: 'Tenant',
    amount: 'Amount',
    dueDate: 'Due Date',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    viewDetails: 'View Details',
    // Add-ons
    addonsExtensions: 'Add-ons & Extensions',
    manageAddonsDesc: 'Manage additional features and extensions for tenants',
    availableAddons: 'Available Add-ons',
    active: 'Active',
    inactive: 'Inactive',
    addToTenant: 'Add to Tenant',
    // Features
    featuresManager: 'Features Manager',
    controlFeaturesDesc: 'Control feature flags and rollout across the platform',
    featureFlags: 'Feature Flags',
    enabled: 'Enabled',
    disabled: 'Disabled',
    rolloutPercentage: 'Rollout',
    toggle: 'Toggle',
    // Revenue
    revenueDashboard: 'Revenue Dashboard',
    revenueMetrics: 'Revenue Metrics and Financial Overview',
    totalRevenue: 'Total Revenue',
    mrr: 'MRR (Monthly Recurring)',
    arr: 'ARR (Annual Recurring)',
    churnRate: 'Churn Rate',
    revenueGrowth: 'Revenue Growth',
    revenueByPlan: 'Revenue by Plan',
    // Users
    allUsers: 'All Platform Users',
    userManagementDesc: 'Manage users across all tenants',
    totalUsersCount: 'Total Users',
    activeUsers: 'Active Users',
    newUsersThisMonth: 'New Users This Month',
    avgUsersPerTenant: 'Avg Users per Tenant',
    userList: 'User List',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    lastActive: 'Last Active',
    // Database
    databaseManagement: 'Database Management',
    monitorPerformanceDesc: 'Monitor database performance and run maintenance tasks',
    collections: 'Collections',
    documents: 'Documents',
    storageUsed: 'Storage Used',
    queriesPerDay: 'Queries/Day',
    databaseCollections: 'Database Collections',
    collection: 'Collection',
    documentCount: 'Document Count',
    avgSize: 'Avg Size',
    lastModified: 'Last Modified',
    viewCollection: 'View Collection',
    // Notifications
    platformNotifications: 'Platform Notifications',
    systemAlertsDesc: 'System alerts and platform-wide notifications',
    sendNotification: 'Send Notification',
    systemAlerts: 'System Alerts',
    timestamp: 'Timestamp',
    message: 'Message',
    severity: 'Severity',
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
    critical: 'Critical',
    // Settings
    platformSettings: 'Platform Settings',
    configureSystemDesc: 'Configure system-wide settings and preferences',
    generalSettings: 'General Settings',
    platformName: 'Platform Name',
    maintenanceMode: 'Maintenance Mode',
    allowNewRegistrations: 'Allow New Registrations',
    maxTenantsPerPlan: 'Max Tenants per Plan',
    emailSettings: 'Email Settings',
    smtpServer: 'SMTP Server',
    smtpPort: 'SMTP Port',
    smtpUser: 'SMTP User',
    smtpPassword: 'SMTP Password',
    securitySettings: 'Security Settings',
    enforceSSL: 'Enforce SSL',
    twoFactorAuth: 'Two-Factor Authentication',
    sessionTimeout: 'Session Timeout (minutes)',
    maxLoginAttempts: 'Max Login Attempts',
    saveChanges: 'Save Changes',
    // Support
    supportTickets: 'Support Tickets',
    manageSupportDesc: 'Manage customer support tickets and inquiries',
    allTickets: 'All Tickets',
    subject: 'Subject',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    createdAt: 'Created',
    // Webhooks
    webhooksIntegrations: 'Webhooks & Integrations',
    manageWebhooksDesc: 'Manage webhooks and third-party integrations',
    addWebhook: 'Add Webhook',
    activeWebhooks: 'Active Webhooks',
    event: 'Event',
    url: 'URL',
    lastTriggered: 'Last Triggered',
    // Common
    welcome: 'Welcome back',
    hereIsWhatsHappening: "Here's what's happening with your platform",
    revenueGrowthChart: 'Revenue Growth',
    recentTenants: 'Recent Tenants',
    suspended: 'Suspended',
    trial: 'Trial',
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    manage: 'Manage',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    noDataAvailable: 'No data available',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
  },
  it: {
    overview: 'Panoramica Piattaforma',
    tenants: 'Gestione Tenant',
    subscriptions: 'Piani Abbonamento',
    billing: 'Fatturazione',
    addons: 'Componenti Aggiuntivi',
    features: 'Gestione Funzionalità',
    analytics: 'Analytics Piattaforma',
    users: 'Tutti gli Utenti',
    revenue: 'Dashboard Ricavi',
    database: 'Gestione Database',
    activity: 'Registro Attività',
    notifications: 'Notifiche Piattaforma',
    settings: 'Impostazioni Piattaforma',
    support: 'Ticket Supporto',
    webhooks: 'Webhooks e Integrazioni',
    totalTenants: 'Tenant Totali',
    activeTenants: 'Tenant Attivi',
    totalUsers: 'Utenti Totali',
    monthlyRevenue: 'Ricavi Mensili',
    healthScore: 'Punteggio Salute',
    plan: 'Piano',
    status: 'Stato',
    actions: 'Azioni',
    createTenant: 'Crea Nuovo Tenant',
    impersonate: 'Accedi come Tenant',
    exitImpersonation: 'Esci da Impersonazione',
    impersonationActive: 'Modalità Impersonazione Attiva',
    viewingAs: 'Stai visualizzando come',
    addTenant: 'Aggiungi Tenant',
    search: 'Cerca tenant...',
    allPlans: 'Tutti i Piani',
    // Support Tickets
    newTicket: 'Nuovo Ticket',
    ticketSubject: 'Oggetto',
    ticketMessage: 'Messaggio',
    ticketPriority: 'Priorità',
    ticketStatus: 'Stato',
    low: 'Bassa',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
    open: 'Aperto',
    inProgress: 'In Corso',
    resolved: 'Risolto',
    closed: 'Chiuso',
    reply: 'Rispondi',
    close: 'Chiudi',
    logout: 'Esci',
    // Subscriptions
    subscriptionPlans: 'Piani Abbonamento',
    month: 'mese',
    tenantsCount: 'tenant',
    managePlanFor: 'Gestisci Piano per',
    // Billing
    billingInvoices: 'Fatturazione e Fatture',
    manageBillingDesc: 'Gestisci fatturazione, fatture e stato pagamenti',
    generateInvoice: 'Genera Fattura',
    pendingPayments: 'Pagamenti in Sospeso',
    failedPayments: 'Pagamenti Falliti',
    totalInvoiced: 'Totale Fatturato',
    successRate: 'Tasso di Successo',
    recentInvoices: 'Fatture Recenti',
    invoiceNumber: 'Fattura #',
    tenant: 'Tenant',
    amount: 'Importo',
    dueDate: 'Scadenza',
    paid: 'Pagato',
    pending: 'In Sospeso',
    overdue: 'Scaduto',
    viewDetails: 'Vedi Dettagli',
    // Add-ons
    addonsExtensions: 'Componenti Aggiuntivi ed Estensioni',
    manageAddonsDesc: 'Gestisci funzionalità aggiuntive ed estensioni per i tenant',
    availableAddons: 'Componenti Disponibili',
    active: 'Attivo',
    inactive: 'Inattivo',
    addToTenant: 'Aggiungi a Tenant',
    // Features
    featuresManager: 'Gestione Funzionalità',
    controlFeaturesDesc: 'Controlla flag funzionalità e distribuzione sulla piattaforma',
    featureFlags: 'Flag Funzionalità',
    enabled: 'Abilitato',
    disabled: 'Disabilitato',
    rolloutPercentage: 'Distribuzione',
    toggle: 'Attiva/Disattiva',
    // Revenue
    revenueDashboard: 'Dashboard Ricavi',
    revenueMetrics: 'Metriche Ricavi e Panoramica Finanziaria',
    totalRevenue: 'Ricavi Totali',
    mrr: 'MRR (Ricorrente Mensile)',
    arr: 'ARR (Ricorrente Annuale)',
    churnRate: 'Tasso di Abbandono',
    revenueGrowth: 'Crescita Ricavi',
    revenueByPlan: 'Ricavi per Piano',
    // Users
    allUsers: 'Tutti gli Utenti Piattaforma',
    userManagementDesc: 'Gestisci utenti su tutti i tenant',
    totalUsersCount: 'Utenti Totali',
    activeUsers: 'Utenti Attivi',
    newUsersThisMonth: 'Nuovi Utenti Questo Mese',
    avgUsersPerTenant: 'Media Utenti per Tenant',
    userList: 'Lista Utenti',
    name: 'Nome',
    email: 'Email',
    role: 'Ruolo',
    lastActive: 'Ultima Attività',
    // Database
    databaseManagement: 'Gestione Database',
    monitorPerformanceDesc: 'Monitora prestazioni database ed esegui task di manutenzione',
    collections: 'Collezioni',
    documents: 'Documenti',
    storageUsed: 'Storage Utilizzato',
    queriesPerDay: 'Query/Giorno',
    databaseCollections: 'Collezioni Database',
    collection: 'Collezione',
    documentCount: 'Numero Documenti',
    avgSize: 'Dimensione Media',
    lastModified: 'Ultima Modifica',
    viewCollection: 'Vedi Collezione',
    // Notifications
    platformNotifications: 'Notifiche Piattaforma',
    systemAlertsDesc: 'Avvisi di sistema e notifiche globali',
    sendNotification: 'Invia Notifica',
    systemAlerts: 'Avvisi di Sistema',
    timestamp: 'Data/Ora',
    message: 'Messaggio',
    severity: 'Gravità',
    info: 'Info',
    warning: 'Avviso',
    error: 'Errore',
    critical: 'Critico',
    // Settings
    platformSettings: 'Impostazioni Piattaforma',
    configureSystemDesc: 'Configura impostazioni di sistema e preferenze',
    generalSettings: 'Impostazioni Generali',
    platformName: 'Nome Piattaforma',
    maintenanceMode: 'Modalità Manutenzione',
    allowNewRegistrations: 'Consenti Nuove Registrazioni',
    maxTenantsPerPlan: 'Max Tenant per Piano',
    emailSettings: 'Impostazioni Email',
    smtpServer: 'Server SMTP',
    smtpPort: 'Porta SMTP',
    smtpUser: 'Utente SMTP',
    smtpPassword: 'Password SMTP',
    securitySettings: 'Impostazioni Sicurezza',
    enforceSSL: 'Forza SSL',
    twoFactorAuth: 'Autenticazione a Due Fattori',
    sessionTimeout: 'Timeout Sessione (minuti)',
    maxLoginAttempts: 'Max Tentativi Login',
    saveChanges: 'Salva Modifiche',
    // Support
    supportTickets: 'Ticket Supporto',
    manageSupportDesc: 'Gestisci ticket supporto clienti e richieste',
    allTickets: 'Tutti i Ticket',
    subject: 'Oggetto',
    priority: 'Priorità',
    assignedTo: 'Assegnato a',
    createdAt: 'Creato il',
    // Webhooks
    webhooksIntegrations: 'Webhook e Integrazioni',
    manageWebhooksDesc: 'Gestisci webhook e integrazioni di terze parti',
    addWebhook: 'Aggiungi Webhook',
    activeWebhooks: 'Webhook Attivi',
    event: 'Evento',
    url: 'URL',
    lastTriggered: 'Ultimo Trigger',
    // Common
    welcome: 'Bentornato',
    hereIsWhatsHappening: 'Ecco cosa sta succedendo sulla tua piattaforma',
    revenueGrowthChart: 'Crescita Ricavi',
    recentTenants: 'Tenant Recenti',
    suspended: 'Sospeso',
    trial: 'Prova',
    free: 'Gratuito',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    manage: 'Gestisci',
    view: 'Visualizza',
    edit: 'Modifica',
    delete: 'Elimina',
    cancel: 'Annulla',
    confirm: 'Conferma',
    loading: 'Caricamento...',
    noDataAvailable: 'Nessun dato disponibile',
    search: 'Cerca',
    filter: 'Filtra',
    export: 'Esporta',
    import: 'Importa',
    refresh: 'Aggiorna',
  }
};

// === ANIMATED STARS BACKGROUND ===
const AnimatedStars = () => {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    color: Math.random() > 0.5 ? 'bg-yellow-400' : 'bg-blue-400'
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className={`absolute rounded-full ${star.color}`}
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
            y: [0, -20, 0]
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// === SIDEBAR COMPONENT ===
const Sidebar = ({ currentPage, setCurrentPage, onLogout, collapsed, setCollapsed, t }) => {
  const menuItems = [
    { id: 'overview', icon: <Home size={20} />, labelKey: 'overview' },
    { id: 'tenants', icon: <Building2 size={20} />, labelKey: 'tenants' },
    { id: 'subscriptions', icon: <CreditCard size={20} />, labelKey: 'subscriptions' },
    { id: 'billing', icon: <FileText size={20} />, labelKey: 'billing' },
    { id: 'addons', icon: <Package size={20} />, labelKey: 'addons' },
    { id: 'features', icon: <Zap size={20} />, labelKey: 'features' },
    { id: 'analytics', icon: <BarChart3 size={20} />, labelKey: 'analytics' },
    { id: 'users', icon: <Users size={20} />, labelKey: 'users' },
    { id: 'revenue', icon: <DollarSign size={20} />, labelKey: 'revenue' },
    { id: 'database', icon: <Database size={20} />, labelKey: 'database' },
    { id: 'activity', icon: <Activity size={20} />, labelKey: 'activity' },
    { id: 'support', icon: <MessageCircle size={20} />, labelKey: 'support' },
    { id: 'webhooks', icon: <Webhook size={20} />, labelKey: 'webhooks' },
    { id: 'notifications', icon: <Bell size={20} />, labelKey: 'notifications' },
    { id: 'settings', icon: <Settings size={20} />, labelKey: 'settings' },
  ];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0, width: collapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-yellow-500/20 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-400" size={32} />
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                FitFlow
              </h1>
              <p className="text-xs text-slate-400">Platform CEO</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} className="text-slate-400" /> : <ChevronLeft size={20} className="text-slate-400" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {item.icon}
            {!collapsed && <span className="font-medium">{t(item.labelKey)}</span>}
            {!collapsed && currentPage === item.id && (
              <ChevronRight size={16} className="ml-auto" />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-yellow-500/20">
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all border border-red-500/30"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">{t('logout')}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
};

// === STAT CARD COMPONENT ===
const StatCard = ({ title, value, change, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="font-semibold">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm text-slate-400 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
};

// === PLAN CONFIGURATION ===
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 clients', 'Basic dashboard', '1 coach'],
    color: 'slate'
  },
  starter: {
    name: 'Starter',
    price: 29,
    features: ['50 clients', 'Full dashboard', '3 coaches', 'Analytics'],
    color: 'blue'
  },
  professional: {
    name: 'Professional',
    price: 79,
    features: ['Unlimited clients', 'Advanced analytics', '10 coaches', 'Priority support'],
    color: 'purple'
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['Everything', 'Custom branding', 'API access', 'Dedicated support'],
    color: 'yellow'
  }
};

const ADDONS = [
  { id: 'white-label', name: 'White Label', price: 49, description: 'Custom branding & domain' },
  { id: 'api-access', name: 'API Access', price: 29, description: 'Full API integration' },
  { id: 'advanced-analytics', name: 'Advanced Analytics', price: 39, description: 'Deep insights & reports' },
  { id: 'priority-support', name: 'Priority Support', price: 19, description: '24/7 dedicated support' },
  { id: 'custom-integrations', name: 'Custom Integrations', price: 99, description: 'Zapier, webhooks, custom' },
];

// === MAIN COMPONENT ===
export default function CEOPlatformDashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    id: '',
    name: '',
    email: '',
    subscription: 'free'
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [impersonatedTenant, setImpersonatedTenant] = useState(null);
  const [showImpersonationBanner, setShowImpersonationBanner] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [language, setLanguage] = useState(localStorage.getItem('ceo_language') || 'en');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [webhooks, setWebhooks] = useState([]);

  // Translation helper
  const t = (key) => translations[language][key] || key;
  
  // Handle language change
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('ceo_language', newLang);
  };

  // Stats
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    churnRate: 0,
  });

  // Load tenants with REALTIME updates
  useEffect(() => {
    const loadData = async () => {
      try {
        // Realtime listener for tenants
        const unsubscribe = onSnapshot(
          collection(db, 'tenants'), 
          async (tenantsSnap) => {
            const tenantsData = await Promise.all(
              tenantsSnap.docs.map(async (tenantDoc) => {
                const tenantData = tenantDoc.data();
                
                // Load users count with error handling
                let usersCount = 0;
                let coachesCount = 0;
                let revenue = 0;

                try {
                  const usersSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/clients`));
                  usersCount = usersSnap.size;
                } catch (err) {
                  console.log(`No clients collection for tenant ${tenantDoc.id}`);
                }

                try {
                  const coachesSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/collaboratori`));
                  coachesCount = coachesSnap.size;
                } catch (err) {
                  console.log(`No collaboratori collection for tenant ${tenantDoc.id}`);
                }

                // Load revenue from payments
                try {
                  const clientsSnap = await getDocs(collection(db, `tenants/${tenantDoc.id}/clients`));
                  for (const clientDoc of clientsSnap.docs) {
                    try {
                      const clientPayments = await getDocs(collection(db, `tenants/${tenantDoc.id}/clients/${clientDoc.id}/payments`));
                      revenue += clientPayments.docs.reduce((sum, paymentDoc) => sum + (paymentDoc.data().amount || 0), 0);
                    } catch (err) {
                      // Client might not have payments collection yet
                    }
                  }
                } catch (err) {
                  console.log(`No payments data for tenant ${tenantDoc.id}`);
                }

                return {
                  id: tenantDoc.id,
                  ...tenantData,
                  usersCount,
                  coachesCount,
                  revenue,
                  subscription: tenantData.subscription || 'free',
                  addons: tenantData.addons || [],
                  status: tenantData.status || 'active',
                  createdAt: tenantData.createdAt || null,
                  lastActive: tenantData.lastActive || null,
                };
              })
            );

          setTenants(tenantsData);

          // Calculate stats
          const activeTenants = tenantsData.filter(t => t.status === 'active').length;
          const totalUsers = tenantsData.reduce((sum, t) => sum + t.usersCount, 0);
          const monthlyRevenue = tenantsData.reduce((sum, t) => {
            const plan = SUBSCRIPTION_PLANS[t.subscription] || SUBSCRIPTION_PLANS.free;
            const addonsPrice = (t.addons || []).reduce((addonSum, addonId) => {
              const addon = ADDONS.find(a => a.id === addonId);
              return addonSum + (addon?.price || 0);
            }, 0);
            return sum + plan.price + addonsPrice;
          }, 0);

          const totalRevenue = tenantsData.reduce((sum, t) => sum + (t.revenue || 0), 0);

          setStats({
            totalTenants: tenantsData.length,
            activeTenants,
            totalUsers,
            monthlyRevenue,
            totalRevenue,
            churnRate: tenantsData.length > 0 ? ((tenantsData.filter(t => t.status !== 'active').length / tenantsData.length) * 100).toFixed(1) : 0,
          });

          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading platform data:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadData();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === 'all' || tenant.subscription === filterPlan;
      return matchesSearch && matchesPlan;
    });
  }, [tenants, searchTerm, filterPlan]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/platform-login');
  };

  const handleUpdateTenantPlan = async (tenantId, newPlan) => {
    try {
      const tenant = tenants.find(t => t.id === tenantId);
      const oldPlan = tenant.subscription;
      
      await updateDoc(doc(db, 'tenants', tenantId), {
        subscription: newPlan,
        updatedAt: serverTimestamp()
      });
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, subscription: newPlan } : t));
      
      await logActivity('update_plan', `Changed plan for ${tenant.name} from ${oldPlan} to ${newPlan}`, { 
        tenantId, 
        oldPlan, 
        newPlan 
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleToggleAddon = async (tenantId, addonId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const currentAddons = tenant.addons || [];
    const newAddons = currentAddons.includes(addonId)
      ? currentAddons.filter(id => id !== addonId)
      : [...currentAddons, addonId];
    const action = currentAddons.includes(addonId) ? 'removed' : 'added';

    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        addons: newAddons,
        updatedAt: serverTimestamp()
      });
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, addons: newAddons } : t));
      
      const addon = ADDONS.find(a => a.id === addonId);
      await logActivity('toggle_addon', `${action} add-on "${addon.name}" for ${tenant.name}`, { 
        tenantId, 
        addonId, 
        action 
      });
    } catch (error) {
      console.error('Error updating addons:', error);
    }
  };

  const handleToggleTenantStatus = async (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';

    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t));
      
      await logActivity('suspend_tenant', `${newStatus === 'suspended' ? 'Suspended' : 'Reactivated'} tenant: ${tenant.name}`, { 
        tenantId, 
        newStatus 
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantData.id || !newTenantData.name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create tenant document
      await setDoc(doc(db, 'tenants', newTenantData.id), {
        name: newTenantData.name,
        email: newTenantData.email,
        subscription: newTenantData.subscription,
        status: 'active',
        addons: [],
        healthScore: 100,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      // Create roles subcollection
      await setDoc(doc(db, `tenants/${newTenantData.id}/roles/superadmins`), {
        uids: []
      });
      await setDoc(doc(db, `tenants/${newTenantData.id}/roles/admins`), {
        uids: []
      });
      await setDoc(doc(db, `tenants/${newTenantData.id}/roles/coaches`), {
        uids: []
      });

      // Log activity
      await logActivity('create_tenant', `Created tenant: ${newTenantData.name}`, { tenantId: newTenantData.id });

      setShowNewTenantModal(false);
      setNewTenantData({ id: '', name: '', email: '', subscription: 'free' });
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('Error creating tenant: ' + error.message);
    }
  };

  // Activity Logger
  const logActivity = async (action, description, metadata = {}) => {
    try {
      await setDoc(doc(collection(db, 'platform_activity_logs')), {
        action,
        description,
        metadata,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        ipAddress: 'N/A', // In production, get from server
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Tenant Impersonation
  const handleImpersonateTenant = async (tenant) => {
    setImpersonatedTenant(tenant);
    setShowImpersonationBanner(true);
    await logActivity('impersonate_tenant', `Started impersonating tenant: ${tenant.name}`, { tenantId: tenant.id });
    
    // Redirect to tenant's dashboard
    window.open(`/dashboard?impersonate=${tenant.id}`, '_blank');
  };

  const handleExitImpersonation = async () => {
    if (impersonatedTenant) {
      await logActivity('exit_impersonation', `Exited impersonation of tenant: ${impersonatedTenant.name}`, { tenantId: impersonatedTenant.id });
    }
    setImpersonatedTenant(null);
    setShowImpersonationBanner(false);
  };

  // Calculate Health Score
  const calculateHealthScore = (tenant) => {
    let score = 100;
    
    // Payment status (-30 if suspended)
    if (tenant.status === 'suspended') score -= 30;
    
    // User activity (-20 if no users)
    if (tenant.usersCount === 0) score -= 20;
    
    // Last active (-15 if > 7 days)
    if (tenant.lastActive) {
      const daysSinceActive = (Date.now() - tenant.lastActive.toDate?.().getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActive > 7) score -= 15;
    }
    
    // Revenue contribution (-10 if free plan)
    if (tenant.subscription === 'free') score -= 10;
    
    // User growth (-10 if < 5 users)
    if (tenant.usersCount < 5) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  // Load Activity Logs
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        query(collection(db, 'platform_activity_logs'), orderBy('timestamp', 'desc'), limit(50)),
        (snapshot) => {
          const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setActivityLogs(logs);
        },
        (error) => {
          console.log('Activity logs not available yet:', error.message);
          setActivityLogs([]);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.log('Could not load activity logs:', error.message);
      return () => {};
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Crown className="animate-spin text-yellow-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Loading Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <AnimatedStars />
      
      {/* IMPERSONATION BANNER */}
      <AnimatePresence>
        {showImpersonationBanner && impersonatedTenant && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-purple-800 border-b-4 border-purple-400 shadow-lg"
          >
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-white" size={24} />
                <div>
                  <p className="text-white font-bold">
                    🎭 {t('impersonationActive')}
                  </p>
                  <p className="text-purple-200 text-sm">
                    {t('viewingAs')}: <span className="font-semibold">{impersonatedTenant.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleExitImpersonation}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
              >
                <X size={18} />
                {t('exitImpersonation')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        t={t}
      />

      <main className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'} ${showImpersonationBanner ? 'mt-20' : ''} p-8 relative z-10`}>
        
        {/* Language Toggle Button */}
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                language === 'en' 
                  ? 'bg-yellow-500 text-slate-900' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇬🇧 EN
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLanguageChange('it')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                language === 'it' 
                  ? 'bg-yellow-500 text-slate-900' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇹 IT
            </motion.button>
          </div>
        </div>
        
        {/* OVERVIEW PAGE */}
        {currentPage === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                {t('overview')}
              </h1>
              <p className="text-slate-400">{t('welcome')}, Alex. {t('hereIsWhatsHappening')}.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t('totalTenants')}
                value={stats.totalTenants}
                change={12}
                icon={<Building2 size={24} />}
                trend
                color="blue"
              />
              <StatCard
                title={t('activeTenants')}
                value={stats.activeTenants}
                change={8}
                icon={<CheckCircle size={24} />}
                trend
                color="green"
              />
              <StatCard
                title={t('totalUsers')}
                value={stats.totalUsers}
                change={15}
                icon={<Users size={24} />}
                trend
                color="purple"
              />
              <StatCard
                title={t('monthlyRevenue')}
                value={`€${stats.monthlyRevenue.toLocaleString()}`}
                change={23}
                icon={<DollarSign size={24} />}
                trend
                color="yellow"
              />
            </div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-yellow-400" size={24} />
                {t('revenueGrowthChart')}
              </h2>
              <div className="h-64">
                <Line
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                      label: 'Revenue (€)',
                      data: [2400, 3200, 2800, 4100, 3900, stats.monthlyRevenue],
                      borderColor: 'rgb(250, 204, 21)',
                      backgroundColor: 'rgba(250, 204, 21, 0.1)',
                      fill: true,
                      tension: 0.4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                      },
                      x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>

            {/* Recent Tenants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4">{t('recentTenants')}</h2>
              <div className="space-y-3">
                {tenants.slice(0, 5).map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                        {tenant.name?.[0] || 'T'}
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name || tenant.id}</p>
                        <p className="text-sm text-slate-400">{tenant.usersCount} users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tenant.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setCurrentPage('tenants');
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye size={18} className="text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* TENANTS PAGE */}
        {currentPage === 'tenants' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {t('tenants')}
                </h1>
                <p className="text-slate-400">{filteredTenants.length} tenants found</p>
              </div>
              <button 
                onClick={() => setShowNewTenantModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
              >
                <Plus size={20} />
                {t('addTenant')}
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{t('allPlans')}</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map((tenant) => {
                const plan = SUBSCRIPTION_PLANS[tenant.subscription] || SUBSCRIPTION_PLANS.free;
                const healthScore = calculateHealthScore(tenant);
                const healthColor = healthScore >= 80 ? 'green' : healthScore >= 50 ? 'yellow' : 'red';
                
                return (
                  <motion.div
                    key={tenant.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
                          {tenant.name?.[0] || 'T'}
                        </div>
                        <div>
                          <h3 className="font-bold">{tenant.name || tenant.id}</h3>
                          <p className="text-xs text-slate-400">{tenant.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleTenantStatus(tenant.id)}
                        className={`p-2 rounded-lg ${
                          tenant.status === 'active'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {tenant.status === 'active' ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>
                    </div>

                    {/* Health Score Badge */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Health Score</span>
                        <span className={`text-sm font-bold text-${healthColor}-400`}>{healthScore}/100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${healthScore}%` }}
                          className={`h-full bg-gradient-to-r from-${healthColor}-400 to-${healthColor}-600`}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Plan</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${plan.color}-500/20 text-${plan.color}-400`}>
                          {plan.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Users</span>
                        <span className="font-medium">{tenant.usersCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Revenue</span>
                        <span className="font-medium text-yellow-400">€{plan.price}/mo</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Add-ons</span>
                        <span className="font-medium">{tenant.addons?.length || 0}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleImpersonateTenant(tenant)}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-xs"
                        title={t('impersonate')}
                      >
                        <UserPlus size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setCurrentPage('subscriptions');
                        }}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-xs"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS PAGE */}
        {currentPage === 'subscriptions' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('subscriptionPlans')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                <motion.div
                  key={key}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`bg-gradient-to-br from-${plan.color}-500/10 to-${plan.color}-600/10 backdrop-blur-sm rounded-2xl p-6 border border-${plan.color}-500/30`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">€{plan.price}</span>
                      <span className="text-slate-400">/{t('month')}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className={`text-${plan.color}-400`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-center text-sm text-slate-400">
                    {tenants.filter(t => t.subscription === key).length} {t('tenantsCount')}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Plan Management for Selected Tenant */}
            {selectedTenant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">
                  {t('managePlanFor')} {selectedTenant.name}
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdateTenantPlan(selectedTenant.id, key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedTenant.subscription === key
                          ? 'border-yellow-500 bg-yellow-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold mb-1">{plan.name}</div>
                      <div className="text-2xl font-bold text-yellow-400">€{plan.price}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* BILLING & INVOICES PAGE */}
        {currentPage === 'billing' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {t('billingInvoices')}
                </h1>
                <p className="text-slate-400">{t('manageBillingDesc')}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
                <Plus size={20} />
                {t('generateInvoice')}
              </button>
            </div>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title={t('pendingPayments')}
                value={tenants.filter(t => t.subscription !== 'free').length}
                icon={<Clock size={24} />}
                color="yellow"
              />
              <StatCard
                title={t('failedPayments')}
                value="3"
                icon={<AlertCircle size={24} />}
                color="red"
              />
              <StatCard
                title={t('totalInvoiced')}
                value={`€${(stats.monthlyRevenue * 12).toLocaleString()}`}
                icon={<FileText size={24} />}
                color="green"
              />
              <StatCard
                title={t('successRate')}
                value="€1,234"
                icon={<DollarSign size={24} />}
                color="purple"
              />
            </div>

            {/* Recent Invoices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold">Recent Invoices</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Invoice #</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Tenant</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Period</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tenants.slice(0, 10).map((tenant, index) => {
                      const plan = SUBSCRIPTION_PLANS[tenant.subscription] || SUBSCRIPTION_PLANS.free;
                      const amount = plan.price + (tenant.addons?.reduce((sum, id) => {
                        const addon = ADDONS.find(a => a.id === id);
                        return sum + (addon?.price || 0);
                      }, 0) || 0);
                      
                      const statuses = ['paid', 'pending', 'failed'];
                      const status = statuses[index % 3];
                      const statusColors = {
                        paid: 'green',
                        pending: 'yellow',
                        failed: 'red'
                      };

                      return (
                        <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <code className="text-slate-300">INV-{2025}{(index + 1).toString().padStart(4, '0')}</code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xs font-bold">
                                {tenant.name?.[0] || 'T'}
                              </div>
                              <span className="text-sm font-medium">{tenant.name || tenant.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-yellow-400">
                            €{amount}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            Nov 2025
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusColors[status]}-500/20 text-${statusColors[status]}-400`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Download PDF">
                                <Download size={16} className="text-slate-400" />
                              </button>
                              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Send Email">
                                <Bell size={16} className="text-slate-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/20">
                        <CreditCard className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Stripe</div>
                        <div className="text-sm text-slate-400">Primary payment gateway</div>
                      </div>
                    </div>
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-purple-500/20">
                        <CreditCard className="text-purple-400" size={20} />
                      </div>
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-slate-400">Alternative payment method</div>
                      </div>
                    </div>
                    <Lock className="text-slate-500" size={20} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">Billing Settings</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <div className="font-medium">Auto-billing</div>
                      <div className="text-sm text-slate-400">Automatic invoice generation</div>
                    </div>
                    <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <div className="font-medium">Payment Reminders</div>
                      <div className="text-sm text-slate-400">Email reminders for unpaid invoices</div>
                    </div>
                    <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <div className="font-medium">Grace Period</div>
                      <div className="text-sm text-slate-400">7 days after invoice due date</div>
                    </div>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all">
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* ADD-ONS PAGE */}
        {currentPage === 'addons' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('addonsExtensions')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ADDONS.map((addon) => (
                <motion.div
                  key={addon.id}
                  whileHover={{ y: -5 }}
                  className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                      <Package className="text-purple-400" size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">€{addon.price}</div>
                      <div className="text-xs text-slate-400">/{t('month')}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{addon.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{addon.description}</p>

                  <div className="text-sm text-slate-400">
                    {tenants.filter(t => t.addons?.includes(addon.id)).length} {t('tenantsCount')}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add-on Management for Selected Tenant */}
            {selectedTenant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">
                  Manage Add-ons for {selectedTenant.name}
                </h2>
                <div className="space-y-3">
                  {ADDONS.map((addon) => {
                    const isActive = selectedTenant.addons?.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <Package className={isActive ? 'text-green-400' : 'text-slate-400'} size={20} />
                          <div>
                            <div className="font-medium">{addon.name}</div>
                            <div className="text-sm text-slate-400">€{addon.price}/mo</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleAddon(selectedTenant.id, addon.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {isActive ? 'Active' : 'Enable'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* FEATURES MANAGER PAGE */}
        {currentPage === 'features' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('featuresManager')}
            </h1>
            <p className="text-slate-400">{t('controlFeaturesDesc')}</p>

            {selectedTenant && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold mb-4">{t('features')} - {selectedTenant.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'dashboard', name: 'Dashboard', icon: <Home size={20} /> },
                    { id: 'clients', name: 'Client Management', icon: <Users size={20} /> },
                    { id: 'calendar', name: 'Calendar', icon: <Calendar size={20} /> },
                    { id: 'chat', name: 'Chat System', icon: <MessageSquare size={20} /> },
                    { id: 'payments', name: 'Payments', icon: <CreditCard size={20} /> },
                    { id: 'analytics', name: 'Analytics', icon: <BarChart3 size={20} /> },
                    { id: 'community', name: 'Community', icon: <Users size={20} /> },
                    { id: 'courses', name: 'Courses', icon: <FileText size={20} /> },
                  ].map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-yellow-400">{feature.icon}</div>
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                        {t('enabled')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS PAGE */}
        {currentPage === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              Platform Analytics
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tenants by Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">Tenants by Plan</h2>
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
                      datasets: [{
                        data: [
                          tenants.filter(t => t.subscription === 'free').length,
                          tenants.filter(t => t.subscription === 'starter').length,
                          tenants.filter(t => t.subscription === 'professional').length,
                          tenants.filter(t => t.subscription === 'enterprise').length,
                        ],
                        backgroundColor: [
                          'rgba(100, 116, 139, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(168, 85, 247, 0.8)',
                          'rgba(250, 204, 21, 0.8)',
                        ],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* Users Growth */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">User Growth</h2>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [{
                        label: 'New Users',
                        data: [150, 230, 180, 290, 250, stats.totalUsers],
                        backgroundColor: 'rgba(250, 204, 21, 0.5)',
                        borderColor: 'rgb(250, 204, 21)',
                        borderWidth: 2,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          ticks: { color: '#94a3b8' },
                          grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: { 
                          ticks: { color: '#94a3b8' },
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Avg Revenue per Tenant"
                value={`€${Math.round(stats.monthlyRevenue / (stats.totalTenants || 1))}`}
                icon={<Target size={24} />}
                color="green"
              />
              <StatCard
                title="Churn Rate"
                value={`${stats.churnRate}%`}
                icon={<Activity size={24} />}
                color="red"
              />
              <StatCard
                title="Customer LTV"
                value="€2,450"
                icon={<Award size={24} />}
                color="purple"
              />
            </div>
          </div>
        )}

        {/* REVENUE PAGE */}
        {currentPage === 'revenue' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('revenueDashboard')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title={t('monthlyRevenue')}
                value={`€${stats.monthlyRevenue.toLocaleString()}`}
                change={23}
                icon={<DollarSign size={24} />}
                trend
                color="yellow"
              />
              <StatCard
                title={t('totalRevenue')}
                value={`€${stats.totalRevenue.toLocaleString()}`}
                change={18}
                icon={<TrendingUp size={24} />}
                trend
                color="green"
              />
              <StatCard
                title={t('avgUsersPerTenant')}
                value={`€${Math.round(stats.monthlyRevenue / (stats.totalTenants || 1))}`}
                icon={<Target size={24} />}
                color="blue"
              />
              <StatCard
                title="Add-ons Revenue"
                value={`€${Math.round(stats.monthlyRevenue * 0.3).toLocaleString()}`}
                icon={<Package size={24} />}
                color="purple"
              />
            </div>

            {/* Revenue by Tenant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4">{t('revenueByPlan')}</h2>
              <div className="space-y-3">
                {tenants
                  .sort((a, b) => {
                    const aRevenue = (SUBSCRIPTION_PLANS[a.subscription]?.price || 0) + 
                                   (a.addons?.reduce((sum, id) => sum + (ADDONS.find(ad => ad.id === id)?.price || 0), 0) || 0);
                    const bRevenue = (SUBSCRIPTION_PLANS[b.subscription]?.price || 0) + 
                                   (b.addons?.reduce((sum, id) => sum + (ADDONS.find(ad => ad.id === id)?.price || 0), 0) || 0);
                    return bRevenue - aRevenue;
                  })
                  .slice(0, 10)
                  .map((tenant) => {
                    const plan = SUBSCRIPTION_PLANS[tenant.subscription] || SUBSCRIPTION_PLANS.free;
                    const addonsRevenue = (tenant.addons || []).reduce((sum, id) => {
                      const addon = ADDONS.find(a => a.id === id);
                      return sum + (addon?.price || 0);
                    }, 0);
                    const totalRevenue = plan.price + addonsRevenue;

                    return (
                      <div key={tenant.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                            {tenant.name?.[0] || 'T'}
                          </div>
                          <div>
                            <div className="font-medium">{tenant.name || tenant.id}</div>
                            <div className="text-sm text-slate-400">{plan.name} Plan</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-yellow-400">€{totalRevenue}</div>
                          <div className="text-xs text-slate-400">
                            {addonsRevenue > 0 && `+€${addonsRevenue} add-ons`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}

        {/* ALL USERS PAGE */}
        {currentPage === 'users' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('allUsers')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title={t('totalUsersCount')}
                value={stats.totalUsers}
                icon={<Users size={24} />}
                color="blue"
              />
              <StatCard
                title={t('activeUsers')}
                value={Math.round(stats.totalUsers * 0.35)}
                icon={<Activity size={24} />}
                color="green"
              />
              <StatCard
                title={t('newUsersThisMonth')}
                value={Math.round(stats.totalUsers * 0.12)}
                icon={<UserPlus size={24} />}
                color="purple"
              />
            </div>

            {/* Users by Tenant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4">Users Distribution</h2>
              <div className="space-y-3">
                {tenants
                  .sort((a, b) => b.usersCount - a.usersCount)
                  .map((tenant) => (
                    <div key={tenant.id} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {tenant.name?.[0] || 'T'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{tenant.name || tenant.id}</div>
                        <div className="text-sm text-slate-400">
                          {tenant.usersCount} users • {tenant.coachesCount} coaches
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{tenant.usersCount}</div>
                        <div className="text-xs text-slate-400">users</div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* NOTIFICATIONS PAGE */}
        {currentPage === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {t('platformNotifications')}
                </h1>
                <p className="text-slate-400">{t('systemAlertsDesc')}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
                <Plus size={20} />
                {t('sendNotification')}
              </button>
            </div>

            {/* Recent Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
              <div className="space-y-3">
                {[
                  { title: 'System Maintenance', message: 'Scheduled for tomorrow 2AM-4AM', type: 'warning', date: '2 hours ago' },
                  { title: 'New Feature Release', message: 'Advanced analytics now available', type: 'success', date: '1 day ago' },
                  { title: 'Payment Issue', message: '3 tenants have failed payments', type: 'error', date: '2 days ago' },
                  { title: 'Welcome Message', message: 'Sent to 5 new tenants', type: 'info', date: '3 days ago' },
                ].map((notif, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className={`p-3 rounded-xl ${
                      notif.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      notif.type === 'success' ? 'bg-green-500/20 text-green-400' :
                      notif.type === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      <Bell size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">{notif.title}</div>
                      <div className="text-sm text-slate-400">{notif.message}</div>
                    </div>
                    <div className="text-xs text-slate-500">{notif.date}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* DATABASE PAGE */}
        {currentPage === 'database' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('databaseManagement')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title={t('collections')}
                value={tenants.length * 25}
                icon={<Database size={24} />}
                color="blue"
              />
              <StatCard
                title="Total Documents"
                value={`${(stats.totalUsers * 150).toLocaleString()}`}
                icon={<FileText size={24} />}
                color="purple"
              />
              <StatCard
                title="Storage Used"
                value="2.4 GB"
                icon={<Server size={24} />}
                color="green"
              />
            </div>

            {/* Database Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">Backup & Restore</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <Download className="text-green-400" size={20} />
                      <span>Full Database Backup</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <Upload className="text-blue-400" size={20} />
                      <span>Restore from Backup</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="text-yellow-400" size={20} />
                      <span>Sync All Tenants</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-bold mb-4">Recent Backups</h2>
                <div className="space-y-3">
                  {[
                    { date: '2025-11-22 03:00', size: '1.2 GB', status: 'success' },
                    { date: '2025-11-21 03:00', size: '1.1 GB', status: 'success' },
                    { date: '2025-11-20 03:00', size: '1.0 GB', status: 'success' },
                  ].map((backup, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{backup.date}</div>
                        <div className="text-xs text-slate-400">{backup.size}</div>
                      </div>
                      <CheckCircle className="text-green-400" size={18} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* ACTIVITY LOG PAGE */}
        {currentPage === 'activity' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  Activity Log
                </h1>
                <p className="text-slate-400">Complete audit trail of all platform actions</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                  <Filter size={18} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activityLogs.map((log, index) => {
                      const actionColors = {
                        create_tenant: 'green',
                        update_plan: 'blue',
                        toggle_addon: 'purple',
                        suspend_tenant: 'red',
                        impersonate_tenant: 'yellow',
                        exit_impersonation: 'yellow',
                      };
                      const color = actionColors[log.action] || 'slate';
                      
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {log.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Crown size={14} className="text-yellow-400" />
                              <span className="text-slate-300">{log.userEmail || 'System'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-500/20 text-${color}-400`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {log.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {log.metadata?.tenantId && (
                              <code className="text-xs bg-slate-800 px-2 py-1 rounded">
                                {log.metadata.tenantId}
                              </code>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {activityLogs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No activity logs yet
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {currentPage === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              {t('platformSettings')}
            </h1>

            {/* Platform Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h2 className="text-xl font-bold mb-4">Platform Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="font-medium">{t('maintenanceMode')}</div>
                    <div className="text-sm text-slate-400">Disable access for all tenants</div>
                  </div>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all">
                    {t('disabled')}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="font-medium">Auto Backups</div>
                    <div className="text-sm text-slate-400">Daily at 3:00 AM</div>
                  </div>
                  <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                    Enabled
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="font-medium">New Tenant Approval</div>
                    <div className="text-sm text-slate-400">Require manual approval for new tenants</div>
                  </div>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all">
                    Off
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-slate-400">Receive platform alerts via email</div>
                  </div>
                  <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                    Enabled
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30"
            >
              <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-red-500/20 rounded-xl transition-all text-red-400">
                  <span>Reset All Tenant Data</span>
                  <Trash2 size={18} />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-red-500/20 rounded-xl transition-all text-red-400">
                  <span>Delete Platform Database</span>
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* SUPPORT TICKETS PAGE */}
        {currentPage === 'support' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {t('support')}
                </h1>
                <p className="text-slate-400">{supportTickets.length} tickets</p>
              </div>
              <button 
                onClick={() => setShowTicketModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
              >
                <Plus size={20} />
                {t('newTicket')}
              </button>
            </div>

            {/* Tickets List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('ticketSubject')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Tenant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('ticketPriority')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('ticketStatus')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {supportTickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        No support tickets yet
                      </td>
                    </tr>
                  ) : (
                    supportTickets.map((ticket, index) => {
                      const priorityColors = {
                        low: 'bg-blue-500/20 text-blue-400',
                        medium: 'bg-yellow-500/20 text-yellow-400',
                        high: 'bg-orange-500/20 text-orange-400',
                        urgent: 'bg-red-500/20 text-red-400'
                      };
                      const statusColors = {
                        open: 'bg-green-500/20 text-green-400',
                        'in-progress': 'bg-blue-500/20 text-blue-400',
                        resolved: 'bg-slate-500/20 text-slate-400',
                        closed: 'bg-slate-600/20 text-slate-500'
                      };

                      return (
                        <motion.tr
                          key={ticket.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-slate-300">#{ticket.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">{ticket.subject}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{ticket.message}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{ticket.tenantName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                              {t(ticket.priority)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                              {t(ticket.status.replace('-', ''))}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                title={t('reply')}
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">{t('open')}</div>
                  <MessageCircle size={20} className="text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {supportTickets.filter(t => t.status === 'open').length}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">{t('inProgress')}</div>
                  <Clock size={20} className="text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {supportTickets.filter(t => t.status === 'in-progress').length}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">{t('resolved')}</div>
                  <CheckCircle size={20} className="text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400">
                  {supportTickets.filter(t => t.status === 'resolved').length}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">{t('urgent')}</div>
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400">
                  {supportTickets.filter(t => t.priority === 'urgent').length}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* WEBHOOKS & INTEGRATIONS PAGE */}
        {currentPage === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  {t('webhooks')}
                </h1>
                <p className="text-slate-400">{webhooks.length} active webhooks</p>
              </div>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
              >
                <Plus size={20} />
                {t('addWebhook')}
              </button>
            </div>

            {/* Webhooks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {webhooks.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400">
                  No webhooks configured yet
                </div>
              ) : (
                webhooks.map((webhook, index) => (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Webhook size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="font-bold">{webhook.name}</div>
                          <div className="text-xs text-slate-400">{webhook.url}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        webhook.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {webhook.active ? t('active') : t('inactive')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {webhook.events.map(event => (
                        <span key={event} className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-300">
                          {event}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm">
                        Test
                      </button>
                      <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                        Edit
                      </button>
                      <button className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Integration Cards */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Popular Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Slack', icon: '💬', description: 'Get notifications in Slack' },
                  { name: 'Discord', icon: '🎮', description: 'Send alerts to Discord' },
                  { name: 'Zapier', icon: '⚡', description: 'Connect to 5000+ apps' }
                ].map((integration, index) => (
                  <motion.div
                    key={integration.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-yellow-500/50 transition-all cursor-pointer"
                  >
                    <div className="text-4xl mb-3">{integration.icon}</div>
                    <div className="font-bold mb-2">{integration.name}</div>
                    <div className="text-sm text-slate-400 mb-4">{integration.description}</div>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg font-medium hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
                      Connect
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* NEW TENANT MODAL */}
      <AnimatePresence>
        {showNewTenantModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewTenantModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  Create New Tenant
                </h2>
                <button
                  onClick={() => setShowNewTenantModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Tenant ID *
                  </label>
                  <input
                    type="text"
                    value={newTenantData.id}
                    onChange={(e) => setNewTenantData({ ...newTenantData, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    placeholder="tenant-id"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Lowercase, no spaces (use hyphens)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={newTenantData.name}
                    onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                    placeholder="My Fitness Business"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newTenantData.email}
                    onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                    placeholder="contact@business.com"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Initial Plan
                  </label>
                  <select
                    value={newTenantData.subscription}
                    onChange={(e) => setNewTenantData({ ...newTenantData, subscription: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  >
                    {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                      <option key={key} value={key}>
                        {plan.name} - €{plan.price}/mo
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewTenantModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTenant}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-lg hover:shadow-yellow-500/50 rounded-xl font-medium transition-all"
                >
                  Create Tenant
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
