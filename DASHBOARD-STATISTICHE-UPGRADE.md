# Dashboard Statistiche - Upgrade Personalizzabile

## 🎯 Funzionalità Implementate

### 1. **Dashboard Personalizzabile con Drag & Drop**
**File**: `src/pages/admin/StatisticheDashboard.jsx`

#### Caratteristiche:
- ✅ **Griglia personalizzabile** con drag & drop (react-grid-layout)
- ✅ **7 Widget disponibili**:
  1. **Lead Totali** - Mostra totale lead e breakdown per status dinamici
  2. **Vendita** - Statistiche chiamate fissate, fatte, show-up rate, close rate
  3. **Setting** - Statistiche dialed, risposte, follow-ups, prenotate
  4. **DMS Tracker** - Outreach, follow-ups, risposte, call per setter
  5. **Lead per Setter** - Distribuzione lead e conversioni per ogni setter
  6. **Grafico Vendita** - Visualizzazione grafica con Chart.js
  7. **Performance Setter** - Ranking setter per lead e conversion rate

#### Modalità Modifica:
- Pulsante **"Modifica Layout"** per attivare drag & drop
- **Ridimensiona widget** dagli angoli
- **Rimuovi widget** con il pulsante X
- **Aggiungi widget** dalla barra superiore
- **Salva layout** personalizzato per utente
- **Reset layout** per tornare al default

#### Storage:
- Layout salvato in: `tenants/{tenantId}/settings/dashboardLayout_{userId}`
- Ogni utente admin ha il proprio layout personalizzato

---

### 2. **Sistema Status Lead Dinamico**
**File**: `src/components/dashboard/LeadStatusConfig.jsx`

#### Caratteristiche:
- ✅ **Checkmarks personalizzabili** - Aggiungi/rimuovi status custom
- ✅ **Colori customizzabili** - 8 colori disponibili (blu, verde, rosso, giallo, viola, arancione, teal, rosa)
- ✅ **Riordino status** - Sposta status su/giù
- ✅ **Attiva/Disattiva** - Toggle per nascondere status temporaneamente
- ✅ **Status predefiniti** protetti (Show Up, Chiuso) - Non possono essere eliminati

#### Status Predefiniti:
1. `showUp` - Show Up (verde)
2. `chiuso` - Chiuso (rosso)

#### Status Personalizzabili:
- Interessato
- Riprenotato  
- Caldo
- Freddo
- Follow-up necessario
- In attesa
- ...qualsiasi altro status custom

#### Storage:
- Configurazione salvata in: `tenants/{tenantId}/settings/leadStatuses`
- Struttura:
```json
{
  "statuses": [
    {
      "id": "showUp",
      "label": "Show Up",
      "color": "green",
      "enabled": true,
      "custom": false
    },
    {
      "id": "interessato",
      "label": "Interessato",
      "color": "yellow",
      "enabled": true,
      "custom": true
    }
  ]
}
```

---

### 3. **Tabella Lead Migliorata**
**File**: `src/components/leads/LeadsTable.jsx`

#### Caratteristiche:
- ✅ **Visualizzazione status dinamici** - Mostra tutti gli status configurati
- ✅ **Modalità modifica** - Clicca "Modifica" per attivare editing
- ✅ **Toggle status** - Clicca sui checkbox per modificare status lead
- ✅ **Indicatori visivi** - Colori e icone per ogni status
- ✅ **Configurazione rapida** - Pulsante "Config Status" nell'header

#### Integrazione:
- Usata in: `src/pages/admin/Collaboratori.jsx`
- Sostituisce la vecchia tabella statica
- Sincronizzazione automatica con dashboard statistiche

---

### 4. **Integrazione Calendario**
**File**: `src/pages/shared/CalendarPage.jsx`

#### Aggiornamenti:
- ✅ **Carica status dinamici** da Firestore
- ✅ **Checkboxes dinamici** nel form lead
- ✅ **Salvataggio automatico** di tutti gli status
- ✅ **Sezione dedicata** "Status Lead" con indicatori colorati

---

## 🔄 Flusso di Lavoro

### Scenario 1: Configurare Nuovi Status
1. Admin va su **Dashboard Statistiche** o **Collaboratori**
2. Clicca **"Config Status"**
3. Aggiunge nuovo status (es. "Interessato", colore giallo)
4. Salva configurazione
5. **Risultato**: Nuovo checkbox appare automaticamente in:
   - Tabella lead (Collaboratori)
   - Form lead (Calendario)
   - Widget statistiche (Dashboard)

### Scenario 2: Personalizzare Dashboard
1. Admin va su **Dashboard Statistiche** (`/statistiche`)
2. Clicca **"Modifica Layout"**
3. Trascina widget per riorganizzare
4. Ridimensiona widget dagli angoli
5. Rimuove widget non necessari (X)
6. Aggiunge widget nascosti (barra superiore)
7. Clicca **"Salva"**
8. **Risultato**: Layout salvato e ripristinato al prossimo accesso

### Scenario 3: Modificare Status Lead
1. Admin va su **Collaboratori** (`/collaboratori`)
2. Trova lead nella tabella
3. Clicca **"Modifica"** sulla riga lead
4. Clicca sui checkbox colorati per modificare status
5. Clicca **"Salva"**
6. **Risultato**: Status aggiornati e visibili in statistiche

---

## 📊 Dashboard Statistiche - Widget Details

### Widget: Lead Totali
```jsx
- Totale Lead: 245
- Show Up: 180 (73.5%)
- Chiuso: 95 (38.8%)
- Interessato: 120 (49.0%)
- [altri status custom...]
```

### Widget: Lead per Setter
```jsx
Setter: Mario Rossi
- Total: 45 lead
- Show Up: 32 (71%) 
- Chiuso: 18 (40%)
- Interessato: 25 (56%)
- Conv. Rate: 40%
```

---

## 🎨 Personalizzazione Colori Status

Colori disponibili:
- 🔵 **Blu** - Neutro, informativo
- 🟢 **Verde** - Positivo, completato
- 🔴 **Rosso** - Negativo, chiuso
- 🟡 **Giallo** - Attenzione, in sospeso
- 🟣 **Viola** - Priorità, VIP
- 🟠 **Arancione** - Urgente
- 🔷 **Teal** - Follow-up
- 🌸 **Rosa** - Custom

---

## 📁 File Creati/Modificati

### Nuovi File:
1. `/src/pages/admin/StatisticheDashboard.jsx` - Dashboard principale personalizzabile
2. `/src/components/dashboard/DashboardWidget.jsx` - Componente wrapper widget
3. `/src/components/dashboard/LeadStatusConfig.jsx` - Configuratore status
4. `/src/components/leads/LeadsTable.jsx` - Tabella lead migliorata

### File Modificati:
1. `/src/App.jsx` - Aggiunta route `/statistiche`
2. `/src/pages/admin/Collaboratori.jsx` - Integrata LeadsTable
3. `/src/pages/shared/CalendarPage.jsx` - Supporto status dinamici
4. `/src/index.css` - Stili react-grid-layout
5. `/package.json` - Aggiunta react-grid-layout

---

## 🔧 Dipendenze Aggiunte

```json
{
  "react-grid-layout": "^1.5.2"
}
```

Peer dependencies incluse:
- `react-draggable`
- `react-resizable`

---

## 🚀 Come Usare

### Per Admin:
1. **Accedi a Dashboard Statistiche**: Menu → Statistiche
2. **Personalizza Layout**: Clicca "Modifica Layout", riorganizza, salva
3. **Configura Status**: Clicca "Config Status", aggiungi/modifica, salva
4. **Modifica Lead**: Vai a Collaboratori, clicca "Modifica" su lead, modifica status

### Per Collaboratori:
- I collaboratori vedono automaticamente tutti gli status configurati
- Possono modificare status lead nelle loro dashboard
- I dati si sincronizzano automaticamente con le statistiche admin

---

## 🔮 Prossimi Sviluppi Possibili

1. **Export Dashboard** - Esporta layout per condividerlo con altri admin
2. **Widget Personalizzati** - Crea widget custom con SQL queries
3. **Filtri Avanzati** - Filtra widget per data, setter, fonte
4. **Notifiche** - Alert quando status lead cambia
5. **Report Automatici** - Email giornaliera con statistiche
6. **Mobile Optimization** - Layout responsive per mobile
7. **Multi-tenant Presets** - Template dashboard per diversi business

---

## 📱 Responsive Design

La dashboard si adatta automaticamente a:
- **Desktop** (lg): 3 colonne, layout completo
- **Tablet** (md): 2 colonne, layout compatto
- **Mobile** (sm): 1 colonna, stack verticale

---

## ⚠️ Note Importanti

1. **Storage Firestore**: Ogni modifica viene salvata in tempo reale
2. **Performance**: Widget caricano dati in modo asincrono
3. **Permessi**: Solo admin possono modificare configurazioni
4. **Backup**: La vecchia tabella è commentata in Collaboratori.jsx (backup)
5. **Compatibilità**: Status esistenti (showUp, chiuso) sempre supportati

---

## 🐛 Troubleshooting

### Problema: Widget non si carica
**Soluzione**: Verifica connessione Firestore, controlla console browser

### Problema: Layout non si salva
**Soluzione**: Verifica permessi utente, controlla che sia admin

### Problema: Status non appare
**Soluzione**: 
1. Vai a Config Status
2. Verifica che status sia "Attivo"
3. Ricarica pagina

### Problema: Drag & drop non funziona
**Soluzione**: 
1. Attiva "Modalità Modifica"
2. Trascina usando l'icona grip (☰)
3. Verifica che non sia in modalità mobile

---

## 📞 Supporto

Per problemi o suggerimenti, contatta il team di sviluppo.
