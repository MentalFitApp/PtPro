# Componenti Admin Avanzati

Questa guida documenta i nuovi componenti creati per ottimizzare il workflow operativo del tenant admin.

---

## 📦 Componenti Disponibili

### 1. **QuickActions** - Azioni Rapide
`src/components/admin/QuickActions.jsx`

**Scopo**: Floating Action Button con menu di azioni rapide per operazioni comuni senza navigare tra pagine.

**Utilizzo**:
```jsx
import QuickActions, { BatchActions } from '../components/admin/QuickActions';

// Floating button (posizionato automaticamente)
<QuickActions position="bottom-right" />

// Batch actions per selezione multipla
<BatchActions 
  selectedClients={[...]} 
  onClearSelection={() => setSelected([])} 
/>
```

**Features**:
- 6 azioni predefinite (Nuovo Cliente, Programma Check, Promemoria, etc.)
- Floating button animato con icona Zap
- Menu a griglia con gradient per ogni azione
- Backdrop blur per focus visivo
- Position props: `bottom-right`, `bottom-left`, `top-right`

---

### 2. **SavedFilters** - Filtri Salvabili
`src/components/admin/SavedFilters.jsx`

**Scopo**: Permette di salvare configurazioni di filtri complessi e riutilizzarli velocemente.

**Utilizzo**:
```jsx
import SavedFilters from '../components/admin/SavedFilters';

<SavedFilters 
  currentFilters={{ filter: 'expiring', days: 7 }}
  onApplyFilter={(filters) => applyFilters(filters)}
  storageKey="admin_client_filters" // opzionale
/>
```

**Features**:
- 4 preset predefiniti (Scadenze 7gg, Senza Anamnesi, Alto Valore, Attivi)
- Salvataggio persistente in localStorage
- Sistema di preferiti (stella) per accesso rapido
- Panel laterale slide-in
- Editor inline per creare/modificare filtri
- Badge contatore filtri salvati

**Preset Disponibili**:
- In Scadenza (7gg)
- Senza Anamnesi
- Alto Valore (>500€)
- Attivi

---

### 3. **DashboardWidgets** - Widget Personalizzabili
`src/components/admin/DashboardWidgets.jsx`

**Scopo**: Dashboard modulare con drag & drop, show/hide e riordino widget.

**Utilizzo**:
```jsx
import DashboardWidgets from '../components/admin/DashboardWidgets';

const dashboardData = {
  totalClients: 45,
  activeClients: 38,
  expiringClients: 7,
  monthlyRevenue: 12500,
  activities: [...],
  upcomingChecks: [...],
  pendingAnamnesi: [...],
  goals: [...],
};

<DashboardWidgets 
  data={dashboardData} 
  storageKey="admin_dashboard_v1" 
/>
```

**Widget Disponibili**:
1. **Statistiche Principali** (full-width)
   - Totale Clienti, Attivi, In Scadenza, Incassi Mese
2. **Attività Recenti** (half-width)
3. **Prossimi Check** (half-width)
4. **Anamnesi Mancanti** (half-width)
5. **Andamento Incassi** (full-width) - placeholder grafico
6. **Obiettivi Rapidi** (half-width) - progress bars

**Features**:
- Drag & Drop con Framer Motion Reorder
- Toggle visibilità singoli widget
- Layout salvato in localStorage
- Reset layout one-click
- Modalità personalizzazione con GripVertical icon

---

### 4. **MessageTemplates** - Template Messaggi
`src/components/admin/MessageTemplates.jsx`

**Scopo**: Libreria di template per email/SMS con variabili dinamiche.

**Utilizzo**:
```jsx
import MessageTemplates from '../components/admin/MessageTemplates';

// Mode panel (default)
<MessageTemplates 
  onSelectTemplate={(template) => fillMessage(template)}
  storageKey="tenant_message_templates"
/>

// Mode inline (per form email)
<MessageTemplates 
  mode="inline"
  onSelectTemplate={(template) => setEmailBody(template.body)}
/>
```

**Variabili Disponibili**:
- `{nome}` - Nome Cliente
- `{cognome}` - Cognome
- `{email}` - Email
- `{telefono}` - Telefono
- `{scadenza}` - Data Scadenza
- `{giorni_rimanenti}` - Giorni alla Scadenza
- `{importo}` - Importo
- `{tenant_name}` - Nome Palestra/Studio
- `{data_oggi}` - Data Odierna

**Template Predefiniti**:
1. Promemoria Scadenza
2. Benvenuto Nuovo Cliente
3. Promemoria Check Programmato
4. Promemoria Pagamento
5. Promemoria Anamnesi

**Features**:
- Editor WYSIWYG con inserimento variabili
- Categorie: Benvenuto, Promemoria, Pagamenti, Personalizzati
- Duplica template per personalizzazione
- Oggetto + Corpo messaggio
- Anteprima variabili con esempi
- Panel laterale slide-in o inline mode

---

### 5. **BulkOperations** - Operazioni Bulk
`src/components/admin/BulkOperations.jsx`

**Scopo**: Toolbar floating per operazioni massive su clienti selezionati.

**Utilizzo**:
```jsx
import BulkOperations, { CompactBulkActions } from '../components/admin/BulkOperations';

// Full version (floating toolbar)
<BulkOperations 
  selectedClients={selectedClients}
  onClearSelection={() => setSelected([])}
  onOperationComplete={() => refetchClients()}
/>

// Compact version (per tabelle)
<CompactBulkActions 
  selectedCount={selected.length}
  onAction={(actionId) => handleAction(actionId)}
  onClear={() => setSelected([])}
/>
```

**Operazioni Disponibili**:
1. **Invia Email** - con conferma
2. **Promemoria Scadenza** - con conferma
3. **Programma Check** - senza conferma
4. **Aggiungi Tag** - senza conferma
5. **Esporta CSV** - senza conferma
6. **Archivia** - con conferma
7. **Aggiorna Stato** - senza conferma
8. **Elimina** - con conferma + danger styling

**Features**:
- Toolbar floating centrato in basso
- Dialog di conferma per operazioni pericolose
- Anteprima clienti (max 5) nel dialog
- Loading state durante operazione
- Toast notifications integrate
- Grid 4 colonne responsive
- Styling danger per operazioni irreversibili

---

### 6. **AdminKPI** - Dashboard KPI
`src/components/admin/AdminKPI.jsx`

**Scopo**: Dashboard analitica con metriche chiave e confronto temporale.

**Utilizzo**:
```jsx
import AdminKPI, { MiniKPI } from '../components/admin/AdminKPI';

// Full KPI Dashboard
const kpiData = {
  revenue: { current: 12500, previous: 10800 },
  clients: { current: 8, previous: 6 },
  activeClients: { current: 45, previous: 42 },
  retention: { current: 85.5, previous: 82.0 },
  conversion: { current: 35.2, previous: 31.5 },
  avgValue: { current: 520, previous: 480 },
  expiringClients: { current: 7, previous: 5 },
  pendingAnamnesi: { current: 3, previous: 5 },
};

<AdminKPI 
  data={kpiData}
  period="30days"
  onPeriodChange={(period) => setPeriod(period)}
  showComparison={true}
/>

// Mini KPI (per widget)
<MiniKPI 
  label="Fatturato Mese"
  value={12500}
  format="currency"
  trend={15.7}
  icon={<DollarSign size={16} />}
  color="green"
/>
```

**KPI Disponibili**:
1. **Fatturato** (€)
2. **Nuovi Clienti** (#)
3. **Clienti Attivi** (#)
4. **Retention Rate** (%)
5. **Tasso Conversione** (%)
6. **Valore Medio Cliente** (€)
7. **In Scadenza** (#)
8. **Anamnesi Mancanti** (#)

**Features**:
- Confronto con periodo precedente
- Trend indicators (↑/↓) con percentuale
- Selettore periodo: 7/30/90/365 giorni
- Personalizzazione KPI visibili
- Gradient backgrounds per categoria
- Hover description per ogni KPI
- Summary stats ribbon
- Export report (placeholder)
- Auto-refresh button

**Formati Supportati**:
- `currency` - €12.500
- `percentage` - 85.5%
- `number` - 1.234

---

## 🎨 Styling Comune

Tutti i componenti utilizzano:
- **Framer Motion** per animazioni fluide
- **Tailwind CSS** con palette slate + accent colors
- **Backdrop blur** per effetti glassmorphism
- **Gradient backgrounds** per differenziazione visiva
- **Responsive design** mobile-first
- **Dark theme** ottimizzato

### Colori Predefiniti
```js
const colorSchemes = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  purple: 'from-purple-500 to-pink-500',
  orange: 'from-orange-500 to-red-500',
  indigo: 'from-indigo-500 to-purple-500',
};
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px - layout stacked, menu hamburger
- **Tablet**: 640-1024px - grid 2 colonne
- **Desktop**: > 1024px - grid 3-4 colonne

---

## 💾 LocalStorage Keys

| Componente | Key Default | Contenuto |
|-----------|-------------|-----------|
| SavedFilters | `admin_saved_filters` | Array di oggetti filtro |
| DashboardWidgets | `admin_dashboard_layout` | `{ order: [], hidden: [] }` |
| MessageTemplates | `admin_message_templates` | Array di template custom |
| AdminKPI | (inline state) | Nessuno (usa props) |

---

## 🔧 Integrazione nelle Pagine Esistenti

### Esempio: Pagina Clients.jsx

```jsx
import QuickActions from '../../components/admin/QuickActions';
import SavedFilters from '../../components/admin/SavedFilters';
import BulkOperations from '../../components/admin/BulkOperations';

export default function Clients() {
  const [selectedClients, setSelectedClients] = useState([]);
  const [filters, setFilters] = useState({});

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <SavedFilters 
          currentFilters={filters}
          onApplyFilter={setFilters}
        />
        {/* Altri controlli... */}
      </div>

      {/* Tabella clienti con selezione */}
      <ClientTable 
        onSelect={setSelectedClients}
        filters={filters}
      />

      {/* Floating Actions */}
      <QuickActions position="bottom-right" />
      <BulkOperations 
        selectedClients={selectedClients}
        onClearSelection={() => setSelectedClients([])}
      />
    </div>
  );
}
```

### Esempio: Dashboard.jsx

```jsx
import DashboardWidgets from '../../components/admin/DashboardWidgets';
import AdminKPI from '../../components/admin/AdminKPI';

export default function Dashboard() {
  const [kpiPeriod, setKpiPeriod] = useState('30days');
  
  // Carica dati KPI
  const kpiData = useKPIData(kpiPeriod);
  const widgetData = useDashboardData();

  return (
    <div className="space-y-8">
      <AdminKPI 
        data={kpiData}
        period={kpiPeriod}
        onPeriodChange={setKpiPeriod}
      />
      
      <DashboardWidgets data={widgetData} />
    </div>
  );
}
```

---

## 🚀 Performance Tips

1. **Lazy Loading**: Importa componenti pesanti solo quando servono
```jsx
const MessageTemplates = lazy(() => import('./MessageTemplates'));
```

2. **Memoization**: Usa useMemo per calcoli complessi
```jsx
const filteredClients = useMemo(() => 
  applyFilters(clients, filters), 
  [clients, filters]
);
```

3. **Debounce**: Per ricerche e filtri real-time
```jsx
const debouncedSearch = useMemo(
  () => debounce((query) => setSearch(query), 300),
  []
);
```

---

## 🎯 Prossimi Miglioramenti

### Funzionalità Pianificate
- [ ] Export PDF per KPI report
- [ ] Grafici interattivi (Chart.js/Recharts)
- [ ] Notifiche push per scadenze
- [ ] Automazioni workflow (trigger-based)
- [ ] Template email con editor WYSIWYG avanzato
- [ ] Analytics predittivi (ML)
- [ ] Multi-lingua per template
- [ ] Sincronizzazione calendario (Google/Outlook)

### Ottimizzazioni Tecniche
- [ ] Virtual scrolling per liste lunghe
- [ ] Service Worker per cache intelligente
- [ ] Progressive Web App (PWA)
- [ ] Real-time updates con WebSocket

---

## 📞 Supporto

Per problemi o richieste di feature, contatta il team di sviluppo o apri una issue nel repository.

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Novembre 2025  
**Compatibilità**: React 18+, Framer Motion 10+, Tailwind CSS 3+
