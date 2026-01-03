# 🚀 ROADMAP UPGRADE PTPRO

> Documento di pianificazione per miglioramenti piattaforma
> Ultimo aggiornamento: 03 Gennaio 2026
> Status: IN CORSO

---

## 📋 INDICE

1. [Priorità CRITICA](#-priorità-critica---da-fare-subito)
2. [Priorità ALTA](#-priorità-alta---prossimi-3-mesi)
3. [Priorità MEDIA](#-priorità-media---6-mesi)
4. [Priorità BASSA](#-priorità-bassa---futuro)
5. [Note e Idee](#-note-e-idee-personali)

---

## 🔴 PRIORITÀ CRITICA - Da fare subito

### 1. Sistema Inviti e Onboarding Modernizzato ✅ COMPLETATO

> **Completato il 17 Dicembre 2025**

**Problema attuale:** (RISOLTO)
- ~~Creazione cliente richiede email + password temporanea~~
- ~~Magic link con scadenza 48h~~
- ~~Se scade bisogna rigenerare~~
- ~~Copia/incolla manuale su WhatsApp~~
- ~~Processo lungo e soggetto a errori~~

**Implementato:**
- ✅ Generazione QR code scannerizzabile (react-qr-code)
- ✅ Codice invito breve (es: ABC123) inseribile manualmente
- ✅ Link condivisibile direttamente su WhatsApp/Telegram
- ✅ Self-registration: cliente completa i propri dati (AcceptInvite.jsx)
- ✅ Invito valido 7 giorni (configurabile)
- ✅ Tracking stato invito: pending → completed/expired
- ✅ Template messaggio invito personalizzabile per tenant
- ✅ Soft-delete cliente con archivio dati (email rimossa, dati preservati)
- ✅ Ricollegamento automatico clienti archiviati
- ✅ Multi-tenant: stesso utente può essere cliente in più workspace
- ✅ Workspace selector nel menu profilo (coach/admin con più tenant)
- ⏳ Reminder automatico (richiede sistema notifiche - Fase 2)
- ⏳ Pre-compilazione dati dal lead (richiede integrazione CRM)

**Files creati/modificati:**
- `src/pages/admin/NewClient.jsx` - Creazione inviti con QR, codice, template messaggio
- `src/pages/public/AcceptInvite.jsx` - Self-registration clienti
- `src/components/admin/InvitesManager.jsx` - Widget gestione inviti
- `src/pages/auth/Login.jsx` - Workspace selector, validazione multi-tenant
- `src/components/layout/ProLayout.jsx` - Workspace switcher nel profilo
- `functions/index.js` - Cloud Functions: createInvitation, validateInvitation, completeInvitation, revokeInvitation, listInvitations, cleanupExpiredInvitations, softDeleteClient, checkArchivedClient, reactivateArchivedClient

**Bug Fix (17 Dicembre):**
- ✅ Fix race condition login (flickering dashboard/login)
- ✅ Fix validazione tenantId (campi riservati non più usati come ID)
- ✅ Fix dashboard coach: aggiunta sezione anamnesi recenti in Panoramica

**Impatto:**
- ⏱️ -70% tempo onboarding
- 📈 +30% tasso completamento registrazione
- 😊 Esperienza cliente professionale fin dal primo contatto

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2-3 settimane → **Completato in 2 giorni**

---

### 2. Sistema Notifiche Centralizzato ✅ COMPLETATO

> **Completato il 17 Dicembre 2025**

**Problema attuale:** (RISOLTO)
- ~~Notifiche push sparse e non configurabili~~
- ~~Nessuna cronologia (se perdi la notifica, è persa)~~
- ~~Admin deve mandare reminder manualmente~~

**Implementato:**

**Centro Notifiche In-App:**
- ✅ Icona campanella con badge contatore non lette
- ✅ Dropdown con lista notifiche scrollabile
- ✅ Click su notifica → naviga alla destinazione
- ✅ Mark as read singola o tutte
- ✅ Real-time con Firestore onSnapshot

**Push Notifications (FCM):**
- ✅ Trigger automatico quando viene creata notifica
- ✅ Supporto iOS PWA, Android, Web
- ✅ Gestione token FCM scaduti

**Trigger Automatici:**
| Evento | Notifica | Destinatario |
|--------|----------|--------------|
| Coach visualizza check | "✅ Check-in visualizzato!" | Cliente |
| Nuova scheda assegnata | "💪 Nuova scheda disponibile!" | Cliente |
| Nuovo check ricevuto | "📊 Nuovo check-in ricevuto" | Coach/Admin |
| Nuovo messaggio chat | "💬 Nuovo messaggio" | Destinatario |

**Cloud Functions:**
- `onCheckViewed` - Trigger su viewedByCoach
- `onWorkoutAssigned` - Trigger su creazione workout
- `onCheckCreated` - Trigger su creazione check
- `onChatMessageCreated` - Trigger su nuovo messaggio
- `markNotificationRead` - Callable per mark as read
- `markAllNotificationsRead` - Callable per mark all
- `cleanupOldNotifications` - Scheduled 3:00 ogni notte

**Files creati:**
- `src/hooks/useNotifications.js` - Hook real-time
- `src/components/notifications/NotificationBell.jsx` - UI campanella
- `functions/index.js` - 7 Cloud Functions

**Non incluso (futuro):**
- ⏳ Email digest giornaliero/settimanale
- ⏳ Preferenze granulari per categoria
- ⏳ Orari silenziosi

**Impatto:**
- 📱 +40% engagement (notifiche immediate)
- ⏱️ -50% reminder manuali
- 🎯 Comunicazione real-time coach-cliente

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2-3 settimane → **Completato in poche ore**

---

### 3. Dashboard Analytics Real-time ✅ COMPLETATO

> **Completato il 03 Gennaio 2026**

**Problema attuale:** (RISOLTO)
- ~~Statistiche calcolate al momento (lente su tanti dati)~~
- ~~Solo dati base: numero clienti, scadenze~~
- ~~Nessun trend storico~~
- ~~Nessun confronto temporale~~
- ~~Admin non ha visione d'insieme rapida~~

**Implementato:**

**Dashboard Admin (AnalyticsNew.jsx):**
- ✅ Revenue card: thisMonth, lastMonth, growth%, ARPU
- ✅ Clients card: attivi, totali, nuovi mese, retention rate
- ✅ Engagement card: check settimanali, media per cliente
- ✅ Sparkline charts per trend visivi (7 giorni)
- ✅ Alert panel actionable: scadenze, inattivi, check non letti
- ✅ Click navigazione diretta ai clienti

**Cloud Functions:**
- `aggregateTenantAnalytics` - Scheduled ogni ora
- `refreshTenantAnalytics` - Callable per refresh manuale

**Collection Firestore:**
- `tenants/{tenantId}/analytics/current` - Dati live
- `tenants/{tenantId}/analytics/daily_{date}` - Storico

**Files:**
- `src/pages/admin/AnalyticsNew.jsx` - Pagina principale
- `src/hooks/useAnalyticsData.js` - Hook dati pre-aggregati
- `src/components/analytics/AnalyticsComponents.jsx` - UI components

**Impatto:**
- ⏱️ Caricamento istantaneo (da 5-10s a <1s)
- 📊 Decisioni basate su dati reali
- 🎯 Identificazione immediata problemi

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2 settimane → **Completato**

---

## 🟠 PRIORITÀ ALTA - Prossimi 3 mesi

### 4. Sistema Appuntamenti Avanzato

**Problema attuale:**
- Calendario base solo per admin
- Nessun booking autonomo clienti
- Nessuna gestione disponibilità coach
- Coordinamento manuale via chat/telefono
- Nessun reminder automatico

**Soluzione proposta:**

**Gestione Disponibilità (Coach/Admin):**
- Imposta orari disponibili per giorno settimana
- Eccezioni (ferie, giorni speciali)
- Durata slot configurabile (30/45/60 min)
- Buffer tra appuntamenti
- Tipi appuntamento: check-in, consulenza, videochiamata, allenamento

**Booking Cliente:**
- Vede calendario con slot disponibili
- Seleziona data/ora
- Conferma prenotazione
- Riceve conferma + reminder automatici

**Automazioni:**
- Reminder 24h prima (email)
- Reminder 1h prima (push)
- Link videocall generato automaticamente
- Se no-show → notifica admin

**Impatto:**
- ⏱️ -60% tempo coordinamento
- 📅 +25% prenotazioni (facilità booking)
- 💰 +10% upsell consulenze extra

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 3 settimane

---

### 5. Automazioni e Workflow

**Problema attuale:**
- Tutto manuale
- Admin deve ricordarsi ogni reminder
- Nessun follow-up automatico
- Task ripetitivi ogni giorno
- Clienti "dimenticati" senza follow-up

**Soluzione proposta:**

**Automazioni pre-configurate:**

| Trigger | Azioni Automatiche |
|---------|-------------------|
| Nuovo cliente creato | Email benvenuto → Push "completa profilo" (1h) → Task coach "chiamare" (24h) |
| 7gg senza check | Push reminder → Email (2gg dopo) → Notifica coach (4gg dopo) |
| Scadenza 7gg | Email avviso → Push (3gg prima) → Task "contattare per rinnovo" |
| Compleanno | Email/Push auguri automatici |
| Obiettivo raggiunto | Notifica celebration + Badge |
| Pagamento ricevuto | Email ricevuta + Aggiornamento scadenza |

**Editor Workflow:**
- Interfaccia drag & drop
- Trigger configurabili
- Azioni concatenabili
- Ritardi personalizzabili
- Condizioni (se/allora)

**Impatto:**
- ⏱️ -90% task ripetitivi
- 📱 +50% engagement (follow-up costante)
- 💰 +25% retention (nessun cliente dimenticato)

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 4-5 settimane

---

### 6. Sistema Permessi Granulare (RBAC)

**Problema attuale:**
- Coach vede TUTTI i clienti del tenant
- Admin può fare tutto, nessuna limitazione
- Nessun modo di assegnare clienti specifici
- Nessun audit delle azioni

**Soluzione proposta:**

**Assegnazione Clienti:**
- Admin assegna clienti specifici a ogni coach
- Coach vede solo i "suoi" clienti
- Filtro automatico in tutte le liste

**Ruoli Personalizzabili:**
```
Junior Coach:
✅ Visualizza clienti assegnati
✅ Crea schede allenamento
❌ Modifica schede altri coach
❌ Vede dati pagamenti
❌ Elimina clienti

Senior Coach:
✅ Tutto Junior Coach
✅ Modifica schede altri coach
✅ Vede statistiche team
❌ Gestisce collaboratori

Admin:
✅ Tutto
```

**Audit Log:**
- Chi ha fatto cosa e quando
- "Marco ha modificato scheda di Luigi - 15:30"
- Esportabile per compliance

**Impatto:**
- 🔒 Maggiore sicurezza dati
- 👥 Gestione team scalabile
- 📋 Compliance GDPR migliorata

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 3-4 settimane

---

### 7. Gamification per Clienti

**Problema attuale:**
- Nessun sistema di motivazione
- Cliente carica check e basta
- Nessun incentivo a essere costanti
- Abbandono dopo entusiasmo iniziale

**Soluzione proposta:**

**Sistema Livelli e XP:**
```
Livello 1-5:   Principiante
Livello 6-10:  Intermedio  
Livello 11-15: Avanzato
Livello 16-20: Atleta
Livello 21+:   Leggenda
```

**Come guadagnare XP:**
| Azione | XP |
|--------|-----|
| Carica check settimanale | +50 |
| Completa allenamento | +30 |
| Streak 7 giorni | +100 bonus |
| Raggiunge obiettivo | +200 |
| Post community | +20 |
| Primo check del mese | +50 bonus |

**Badge/Achievement:**
- 🏅 Primo Check
- 🔥 Streak 7 giorni
- 💪 10 Allenamenti
- 📸 Prima foto trasformazione
- 🎯 Obiettivo raggiunto
- 👑 Streak 30 giorni
- 🏆 100 Allenamenti

**Classifiche (opzionali):**
- Settimanale per XP
- Sfide tra clienti (passi, allenamenti)
- Opt-in (privacy rispettata)

**Impatto:**
- 📱 +60% engagement
- 🔄 +20% retention
- 😊 Clienti più motivati

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 3 settimane

---

## 🟡 PRIORITÀ MEDIA - 6 mesi

### 8. White-Label Completo

**Problema attuale:**
- Solo logo e colori base personalizzabili
- Email escono come "FitFlow"
- PWA ha nome generico
- Cliente vede che è una piattaforma condivisa

**Soluzione proposta:**

**Personalizzazione completa:**
- Logo: versione light, dark, icona
- Colori: primary, secondary, accent (con preview live)
- Font: heading e body selezionabili
- Nome PWA: "FitStudio App" invece di "FitFlow"
- Favicon personalizzata
- Email: mittente, firma, template custom
- Footer legale personalizzato
- Dominio custom: app.fitstudio.it

**Risultato:** Cliente non sa che usa FitFlow. Vede solo brand del coach.

**Impatto:**
- 🎨 Branding professionale
- 💼 Percezione valore maggiore
- 💰 Giustifica prezzi premium

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2-3 settimane

---

### 9. Chat Avanzata

**Problema attuale:**
- Chat base testo
- Nessun allegato
- Nessuna anteprima link
- Nessun messaggio vocale
- Nessuna formattazione

**Soluzione proposta:**

**Nuove funzionalità:**
- 📎 Allegati (PDF, immagini)
- 🎤 Messaggi vocali
- 📍 Condivisione posizione
- 🔗 Anteprima link (preview card)
- ✏️ Formattazione testo (grassetto, corsivo)
- ↩️ Rispondi a messaggio specifico
- 📌 Fissa messaggi importanti
- 🔍 Cerca nei messaggi
- ✅ Conferma lettura
- ⌨️ "Sta scrivendo..."

**Messaggi predefiniti (per coach):**
- "Ottimo lavoro questa settimana!"
- "Ricordati di caricare il check"
- "Ho aggiornato la tua scheda"
- Personalizzabili

**Impatto:**
- 💬 Comunicazione più efficace
- ⏱️ -30% tempo risposte (messaggi predefiniti)
- 😊 Esperienza moderna

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 3 settimane

---

### 10. Gestione Multi-Tenant per Utente

**Problema attuale:**
- Un utente = un solo tenant
- Se sei coach in 2 palestre, servono 2 account
- Nessun modo di switchare

**Soluzione proposta:**

**Scenario:** Marco è coach alla Palestra A e cliente alla Palestra B.

**Interfaccia:**
```
Ciao Marco! Stai lavorando in:
┌─────────────────────────────┐
│ 🏋️ Palestra Fitness A      │ ← ATTIVO
│    Ruolo: Coach             │
│    32 clienti               │
└─────────────────────────────┘

Cambia workspace:
┌─────────────────────────────┐
│ 🏃 RunClub B                │
│    Ruolo: Cliente           │
│    Prossimo check: Lunedì   │
└─────────────────────────────┘
```

**Funzionalità:**
- Switch istantaneo senza logout
- Interfaccia adattata al ruolo
- Notifiche separate per tenant
- Un solo login per tutto

**Impatto:**
- 👥 Utenti multi-ruolo supportati
- 🔄 Flessibilità massima
- 📈 Più casi d'uso coperti

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 4 settimane

---

## 🟢 PRIORITÀ BASSA - Futuro

### 11. PWA Offline Enhanced

**Problema attuale:**
- App funziona solo online
- In palestra senza WiFi = app inutilizzabile
- Foto check non caricabili offline

**Soluzione proposta:**

**Funzionalità offline:**
- ✅ Visualizza scheda allenamento
- ✅ Visualizza scheda alimentare
- ✅ Scatta foto (salvate localmente)
- ✅ Scrivi note
- ✅ Vedi ultimi 50 messaggi

**Sincronizzazione:**
- Automatica quando torna online
- Upload foto in background
- Invio messaggi in coda
- Notifica "Tutto sincronizzato!"

**Indicatore:**
- 🟢 Online
- 🟡 Connessione lenta
- 🔴 Offline (dati saranno sincronizzati)

**Impatto:**
- 📱 App usabile ovunque
- 💪 Clienti in palestra soddisfatti
- 🔄 Nessun dato perso

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 4-5 settimane

---

### 12. Integrazione Wearables

**Problema attuale:**
- Dati inseriti manualmente
- Nessuna sincronizzazione con smartwatch
- Nessun tracking automatico

**Soluzione proposta:**

**Integrazioni:**
- Apple Health
- Google Fit
- Fitbit
- Garmin
- Samsung Health

**Dati sincronizzabili:**
- Passi giornalieri
- Calorie bruciate
- Frequenza cardiaca
- Sonno
- Allenamenti completati

**Visualizzazione:**
- Dashboard cliente con dati wearable
- Grafici trend settimanale/mensile
- Correlazione con progressi

**Impatto:**
- 📊 Dati più accurati
- ⏱️ -100% inserimento manuale
- 🎯 Tracking completo

**Complessità:** ⭐⭐⭐⭐⭐ Molto Alta
**Tempo stimato:** 6-8 settimane

---

### 13. Video Coaching / Live Streaming

**Problema attuale:**
- Videochiamate tramite link esterni (Daily.co, Zoom)
- Nessun sistema integrato
- Nessun recording

**Soluzione proposta:**

**Funzionalità:**
- Videochiamate 1:1 integrate
- Live streaming per gruppi
- Recording automatico
- Condivisione schermo
- Lavagna virtuale per spiegazioni
- Chat durante la call

**Casi d'uso:**
- Consulenza nutrizionale
- Correzione esercizi live
- Lezioni di gruppo online
- Q&A con clienti

**Impatto:**
- 🎥 Coaching remoto professionale
- 💰 Nuovo revenue stream (lezioni online)
- 🌍 Clienti worldwide

**Complessità:** ⭐⭐⭐⭐⭐ Molto Alta
**Tempo stimato:** 8-10 settimane

---

### 14. Marketplace Schede/Programmi

**Problema attuale:**
- Ogni coach crea schede da zero
- Nessun modo di condividere/vendere programmi
- Lavoro duplicato

**Soluzione proposta:**

**Marketplace interno:**
- Coach pubblica programma (es: "12 settimane massa")
- Altri coach possono acquistare/usare
- Revenue sharing (70% coach, 30% piattaforma)
- Recensioni e rating

**Contenuti:**
- Schede allenamento complete
- Piani alimentari
- Guide PDF
- Video corsi

**Impatto:**
- 💰 Nuovo revenue stream
- ⏱️ Coach risparmiano tempo
- 📈 Contenuti di qualità

**Complessità:** ⭐⭐⭐⭐⭐ Molto Alta
**Tempo stimato:** 10+ settimane

---

### 15. AI Assistant

**Problema attuale:**
- Tutto manuale
- Nessun suggerimento intelligente
- Analisi dati richiede tempo

**Soluzione proposta:**

**Per Coach:**
- Suggerimenti schede basati su obiettivi cliente
- Analisi automatica progressi
- "Luigi sta rallentando, suggerisco di cambiare approccio"
- Generazione testi (email, messaggi)
- Risposte suggerite in chat

**Per Clienti:**
- Chatbot per domande frequenti
- Suggerimenti pasti basati su macros
- "Hai raggiunto il 80% proteine oggi, ti mancano 30g"
- Motivazione personalizzata

**Impatto:**
- 🤖 Esperienza futuristica
- ⏱️ -40% tempo per coach
- 📈 Risultati clienti migliori

**Complessità:** ⭐⭐⭐⭐⭐ Molto Alta
**Tempo stimato:** 12+ settimane

---

## 🆕 UPGRADE AGGIUNTIVI

### 16. Sistema Referral

**Descrizione:**
- Cliente invita amico
- Se amico si iscrive, entrambi ricevono reward
- Tracking automatico referral
- Dashboard referral per cliente

**Reward configurabili:**
- Sconto sul prossimo mese
- Mese gratis
- Merchandise
- Sessione extra

**Impatto:** 📈 +30% nuovi clienti da referral

---

### 17. Pagamenti Integrati

**Descrizione:**
- Stripe/PayPal integrato
- Abbonamenti ricorrenti automatici
- Fatturazione automatica
- Reminder pagamento
- Storico completo

**Impatto:** 💰 -80% tempo gestione pagamenti

---

### 18. Check-in con AI Body Analysis

**Descrizione:**
- Cliente carica foto
- AI analizza composizione corporea
- Stima % grasso, massa muscolare
- Confronto automatico con check precedenti
- Report visuale progressi

**Impatto:** 📊 Dati oggettivi senza attrezzature

---

### 19. Sistema Obiettivi SMART

**Descrizione:**
- Cliente imposta obiettivi (perdere 5kg, alzare 100kg panca)
- Sistema traccia progressi
- Milestone intermedie
- Celebrazione automatica al raggiungimento
- Suggerimenti se fuori track

**Impatto:** 🎯 +40% obiettivi raggiunti

---

### 20. Template Schede Intelligenti

**Descrizione:**
- Libreria template schede (massa, definizione, forza)
- Personalizzazione rapida
- AI suggerisce template basato su anamnesi
- Versioning (modifica senza perdere originale)

**Impatto:** ⏱️ -60% tempo creazione schede

---

### 21. Report PDF Automatici

**Descrizione:**
- Genera report mensile cliente (PDF branded)
- Include: progressi, grafici, foto confronto
- Inviabile automaticamente via email
- Template personalizzabili

**Impatto:** 📄 Valore percepito altissimo

---

### 22. Sistema Note e Annotazioni

**Descrizione:**
- Note private su ogni cliente
- Tag e categorie
- Ricerca full-text
- Promemoria basati su note
- "Ricordati che Luigi ha mal di schiena"

**Impatto:** 📝 Coaching più personalizzato

---

### 23. Importazione Clienti Bulk

**Descrizione:**
- Upload CSV/Excel
- Mapping campi automatico
- Preview prima di import
- Inviti automatici post-import
- Gestione duplicati

**Impatto:** ⏱️ Migrazione da altri sistemi semplificata

---

### 24. API Pubblica

**Descrizione:**
- API REST documentata
- Webhook per eventi
- Integrazioni custom
- Zapier/Make compatibile

**Casi d'uso:**
- Sync con gestionale esterno
- Automazioni custom
- Integrazioni CRM

**Impatto:** 🔌 Massima flessibilità

---

### 25. Community Avanzata

**Descrizione:**
- Canali tematici (nutrizione, allenamento, motivazione)
- Gruppi privati
- Eventi live (AMA, Q&A)
- Sondaggi e quiz
- Sfide di gruppo

**Impatto:** 👥 +50% engagement community

---

### 26. 📧 Integrazione Email Personalizzata per Tenant

**Problema attuale:**
- Tutte le email escono da noreply@fitflow.it
- Nessuna personalizzazione mittente
- Cliente non riconosce il brand del coach
- Impossibile usare dominio proprio
- Nessun tracking aperture/click

**Soluzione proposta:**

**Opzione 1: SMTP Personalizzato**
```
Impostazioni Email Tenant:
┌─────────────────────────────────────────────┐
│ 📧 CONFIGURAZIONE EMAIL                     │
├─────────────────────────────────────────────┤
│ Metodo invio: [SMTP Personalizzato ▼]       │
│                                             │
│ Server SMTP:    smtp.tuodominio.it          │
│ Porta:          587                         │
│ Utente:         noreply@fitstudio.it        │
│ Password:       ••••••••••••                │
│ Crittografia:   [TLS ▼]                     │
│                                             │
│ Email mittente: noreply@fitstudio.it        │
│ Nome mittente:  FitStudio Team              │
│ Reply-To:       info@fitstudio.it           │
│                                             │
│ [Test Connessione] [Salva]                  │
└─────────────────────────────────────────────┘
```

**Opzione 2: Provider Supportati (Integrazione Diretta)**
- ✅ Gmail / Google Workspace (OAuth)
- ✅ Outlook / Microsoft 365 (OAuth)
- ✅ SendGrid (API Key)
- ✅ Mailgun (API Key)
- ✅ Amazon SES (API Key)
- ✅ Mailchimp Transactional (Mandrill)
- ✅ Postmark
- ✅ SMTP generico (qualsiasi provider)

**Opzione 3: Email Piattaforma (Default)**
- Usa infrastruttura FitFlow
- Mittente: noreply@fitflow.it
- Gratuito ma non brandizzato

**Funzionalità Avanzate:**

**Template Email Personalizzabili:**
```
Template disponibili:
├── 👋 Benvenuto nuovo cliente
├── 🔑 Reset password
├── 📅 Reminder appuntamento
├── ⚠️ Scadenza abbonamento
├── 💰 Conferma pagamento
├── 📸 Nuovo check ricevuto
├── 📋 Nuova scheda disponibile
├── 🎂 Auguri compleanno
├── 📊 Report mensile
└── ✨ Custom (crea il tuo)

Editor template:
┌─────────────────────────────────────────────┐
│ Oggetto: Benvenuto in {{tenant_name}}!      │
├─────────────────────────────────────────────┤
│ [Logo tenant]                               │
│                                             │
│ Ciao {{client_name}},                       │
│                                             │
│ Benvenuto nel team di {{tenant_name}}!      │
│ Siamo felici di averti con noi.             │
│                                             │
│ I tuoi dati di accesso:                     │
│ Email: {{client_email}}                     │
│ Link: {{login_url}}                         │
│                                             │
│ {{coach_signature}}                         │
│                                             │
│ [Footer personalizzato]                     │
└─────────────────────────────────────────────┘

Variabili disponibili:
{{client_name}}, {{client_email}}, {{tenant_name}},
{{coach_name}}, {{login_url}}, {{expiry_date}},
{{appointment_date}}, {{appointment_time}}, ...
```

**Tracking & Analytics:**
- 📬 Tasso di consegna
- 👁️ Tasso di apertura
- 🖱️ Tasso di click
- ❌ Bounce rate
- 📊 Dashboard email analytics

**Firma Email Dinamica:**
```
--
{{coach_name}}
{{tenant_name}}
📞 {{phone}}
📧 {{email}}
🌐 {{website}}

[Logo] [Social Icons]
```

**Configurazione per tipo notifica:**
| Notifica | Email | Push | In-App | SMS |
|----------|:-----:|:----:|:------:|:---:|
| Benvenuto | ✅ | ❌ | ❌ | ❌ |
| Nuovo check | ❌ | ✅ | ✅ | ❌ |
| Scadenza | ✅ | ✅ | ✅ | ⚙️ |
| Appuntamento | ✅ | ✅ | ✅ | ⚙️ |
| Pagamento | ✅ | ❌ | ✅ | ❌ |

**Impatto:**
- 🎨 Branding professionale completo
- 📧 Email arrivano nella inbox (no spam)
- 📊 Visibilità su engagement email
- 💼 Percezione premium

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 3-4 settimane

---

### 27. 📱 Integrazione SMS/WhatsApp per Tenant

**Descrizione:**
Ogni tenant può configurare il proprio account per inviare SMS o messaggi WhatsApp ai clienti.

**Provider supportati:**
- ✅ Twilio (SMS + WhatsApp)
- ✅ MessageBird
- ✅ Vonage (Nexmo)
- ✅ WhatsApp Business API
- ✅ Spoki (Italia)

**Configurazione:**
```
Impostazioni SMS/WhatsApp:
┌─────────────────────────────────────────────┐
│ Provider: [Twilio ▼]                        │
│ Account SID: AC123456789                    │
│ Auth Token: ••••••••••••                    │
│ Numero mittente: +39 123 456 7890           │
│                                             │
│ ☑️ Abilita SMS                              │
│ ☑️ Abilita WhatsApp                         │
│                                             │
│ [Test SMS] [Test WhatsApp] [Salva]          │
└─────────────────────────────────────────────┘
```

**Casi d'uso:**
- Reminder appuntamento (1h prima)
- Scadenza abbonamento urgente
- Link accesso rapido
- Conferma pagamento
- Messaggi personalizzati

**Costi:** A carico del tenant (pay-per-use dal provider)

**Impatto:** 📱 Reach rate 98% (vs 20% email)

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2-3 settimane

---

### 28. 🔗 Integrazione CRM Esterni

**Descrizione:**
Sincronizzazione bidirezionale con CRM popolari.

**Integrazioni:**
- ✅ HubSpot
- ✅ Salesforce
- ✅ Pipedrive
- ✅ Zoho CRM
- ✅ ActiveCampaign
- ✅ Keap (Infusionsoft)

**Funzionalità:**
- Sync automatico lead → CRM
- Sync clienti ← → CRM
- Trigger automazioni CRM su eventi
- Mapping campi personalizzabile

**Impatto:** 🔄 Workflow unificato con strumenti esistenti

---

### 29. 📆 Integrazione Calendari Esterni

**Descrizione:**
Sincronizzazione appuntamenti con calendari esterni.

**Integrazioni:**
- ✅ Google Calendar (bidirezionale)
- ✅ Outlook/Microsoft 365 (bidirezionale)
- ✅ Apple Calendar (iCal export)
- ✅ Calendly (import disponibilità)

**Funzionalità:**
- Appuntamento creato in app → appare su Google Calendar
- Slot occupati su Google Calendar → non disponibili in app
- Colori diversi per tipo appuntamento
- Reminder sincronizzati

**Impatto:** 📅 Zero doppi booking, tutto in un posto

**Complessità:** ⭐⭐⭐ Media
**Tempo stimato:** 2 settimane

---

### 30. 💳 Gateway Pagamenti Multi-Provider

**Descrizione:**
Ogni tenant sceglie il proprio gateway di pagamento.

**Provider supportati:**
- ✅ Stripe (consigliato)
- ✅ PayPal
- ✅ Satispay
- ✅ SumUp
- ✅ Square
- ✅ Nexi (Italia)
- ✅ Bonifico bancario (manuale con tracking)

**Funzionalità:**
```
Impostazioni Pagamenti:
┌─────────────────────────────────────────────┐
│ Gateway principale: [Stripe ▼]              │
│ Stripe Secret Key: sk_live_•••••••••        │
│ Stripe Publishable: pk_live_•••••••••       │
│                                             │
│ ☑️ Pagamenti ricorrenti automatici          │
│ ☑️ Fatturazione automatica                  │
│ ☑️ Reminder pagamento scaduto               │
│                                             │
│ Gateway secondario: [PayPal ▼]              │
│ (per clienti che preferiscono PayPal)       │
└─────────────────────────────────────────────┘
```

**Checkout cliente:**
- Pagina pagamento brandizzata
- Abbonamenti ricorrenti
- Link pagamento condivisibile
- QR code per pagamento

**Impatto:** 💰 Incasso automatico, zero solleciti manuali

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 4-5 settimane

---

### 31. 📊 Integrazione Google Analytics / Meta Pixel

**Descrizione:**
Ogni tenant può tracciare le conversioni delle proprie landing page.

**Configurazione:**
```
Tracking & Analytics:
┌─────────────────────────────────────────────┐
│ Google Analytics 4                          │
│ Measurement ID: G-XXXXXXXXXX                │
│                                             │
│ Meta Pixel (Facebook/Instagram)             │
│ Pixel ID: 123456789012345                   │
│                                             │
│ Google Tag Manager                          │
│ Container ID: GTM-XXXXXXX                   │
│                                             │
│ TikTok Pixel                                │
│ Pixel ID: XXXXXXXXXX                        │
└─────────────────────────────────────────────┘
```

**Eventi tracciati automaticamente:**
- Visita landing page
- Compilazione form lead
- Inizio checkout
- Pagamento completato
- Registrazione cliente

**Impatto:** 📈 ROI campagne pubblicitarie misurabile

---

### 32. 🤖 Integrazione ManyChat / Chatbot

**Descrizione:**
Collegamento con chatbot per acquisizione lead automatica.

**Integrazioni:**
- ✅ ManyChat
- ✅ Chatfuel
- ✅ MobileMonkey
- ✅ Tidio

**Flusso:**
1. Lead interagisce con bot Instagram/Messenger
2. Bot raccoglie dati (nome, email, obiettivo)
3. Lead creato automaticamente in PtPro
4. Notifica al collaboratore/admin
5. Automazione di follow-up parte

**Impatto:** 🤖 Lead generation 24/7 automatizzata

---

### 33. 📋 Integrazione Typeform / Google Forms

**Descrizione:**
Import automatico risposte questionari.

**Funzionalità:**
- Collega form Typeform/Google Forms
- Risposta → crea lead automaticamente
- Mapping campi personalizzabile
- Trigger automazioni

**Casi d'uso:**
- Questionario pre-consulenza
- Form anamnesi esterno
- Survey soddisfazione

**Impatto:** 📝 Centralizzazione dati da form esterni

---

### 34. 🏦 Integrazione Fatturazione Elettronica (Italia)

**Descrizione:**
Generazione e invio fatture elettroniche allo SDI.

**Provider supportati:**
- ✅ Fatture in Cloud
- ✅ Aruba
- ✅ Register.it
- ✅ Legalinvoice

**Funzionalità:**
- Genera fattura da pagamento
- Invio automatico allo SDI
- Conservazione digitale
- Numerazione automatica
- Gestione note di credito

**Impatto:** 📄 Compliance fiscale automatizzata

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 3-4 settimane

---

### 35. 📱 App Mobile Nativa (iOS/Android)

**Descrizione:**
App dedicata pubblicabile su App Store e Google Play.

**Vantaggi vs PWA:**
- Notifiche push più affidabili
- Accesso da store (visibilità)
- Integrazione nativa device (camera, sensori)
- Widget home screen

**White-label:**
- Ogni tenant può avere app col proprio brand
- Nome: "FitStudio App"
- Icona personalizzata
- Colori tema

**Impatto:** 📱 Esperienza premium, retention +30%

**Complessità:** ⭐⭐⭐⭐⭐ Molto Alta
**Tempo stimato:** 12+ settimane

---

### 36. 🔐 Single Sign-On (SSO) Enterprise

**Descrizione:**
Per tenant enterprise, login tramite identity provider aziendale.

**Provider supportati:**
- ✅ Google Workspace
- ✅ Microsoft Azure AD
- ✅ Okta
- ✅ Auth0
- ✅ SAML generico

**Casi d'uso:**
- Palestre aziendali (dipendenti usano email aziendale)
- Franchise (gestione centralizzata accessi)

**Impatto:** 🔐 Enterprise-ready

---

### 37. 📦 Backup & Export Dati

**Descrizione:**
Export completo dati del tenant.

**Funzionalità:**
- Export JSON/CSV tutti i dati
- Backup schedulato automatico
- Download singole collection
- Export clienti per migrazione
- Export per richieste GDPR

**Formati:**
- JSON (completo)
- CSV (tabellare)
- PDF (report leggibili)

**Impatto:** 🔒 Compliance GDPR, portabilità dati

---

### 38. 🌍 Multi-lingua

**Descrizione:**
Interfaccia e comunicazioni in più lingue.

**Lingue supportate:**
- 🇮🇹 Italiano (default)
- 🇬🇧 English
- 🇪🇸 Español
- 🇫🇷 Français
- 🇩🇪 Deutsch
- 🇵🇹 Português

**Configurazione:**
- Lingua default tenant
- Lingua preferita per utente
- Template email multilingua
- Interfaccia auto-detect browser

**Impatto:** 🌍 Mercato internazionale

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 4-5 settimane

---

### 39. 📈 Integrazione Advertising

**Descrizione:**
Collegamento per remarketing e lookalike audience.

**Integrazioni:**
- Facebook/Instagram Custom Audiences
- Google Ads Customer Match
- TikTok Custom Audiences

**Funzionalità:**
- Sync automatico lista clienti → audience
- Segmentazione (attivi, scaduti, lead)
- Esclusione clienti attivi da ads acquisizione

**Impatto:** 📈 Ads più efficaci, meno sprechi

---

### 40. 🎓 Learning Management System (LMS)

**Descrizione:**
Sistema corsi integrato per ogni tenant.

**Funzionalità:**
- Crea corsi con moduli e lezioni
- Video hosting integrato
- Quiz e certificati
- Tracking progressi
- Vendita corsi (monetizzazione)

**Casi d'uso:**
- Corso "Nutrizione base"
- Video tutorial esercizi
- Programma 12 settimane

**Impatto:** 💰 Nuovo revenue stream, scalabilità

**Complessità:** ⭐⭐⭐⭐ Alta
**Tempo stimato:** 6-8 settimane

---

## ✏️ NOTE E IDEE PERSONALI

> Spazio per le tue annotazioni e idee aggiuntive

### Idee da valutare:
- [ ] ...
- [ ] ...
- [ ] ...

### Feedback clienti raccolti:
- ...
- ...

### Priorità personali:
1. ...
2. ...
3. ...

### Budget/Risorse disponibili:
- ...

### Timeline desiderata:
- Q1 2026: ...
- Q2 2026: ...
- Q3 2026: ...
- Q4 2026: ...

---

## 📊 RIEPILOGO PRIORITÀ

| # | Upgrade | Priorità | Complessità | Tempo | Impatto | Status |
|---|---------|----------|-------------|-------|---------|--------|
| 1 | Sistema Inviti | 🔴 CRITICA | ⭐⭐⭐ | 2-3 sett | ⭐⭐⭐⭐⭐ | ✅ FATTO |
| 2 | Notifiche Centralizzate | 🔴 CRITICA | ⭐⭐⭐ | 2-3 sett | ⭐⭐⭐⭐⭐ | ✅ FATTO |
| 3 | Dashboard Analytics V2 | 🔴 CRITICA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ✅ FATTO |
| 4 | Sistema Appuntamenti | 🟠 ALTA | ⭐⭐⭐ | 3 sett | ⭐⭐⭐⭐ | ⏳ |
| 5 | Automazioni Workflow | 🟠 ALTA | ⭐⭐⭐⭐ | 4-5 sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 6 | RBAC Permessi | 🟠 ALTA | ⭐⭐⭐⭐ | 3-4 sett | ⭐⭐⭐⭐ | ⏳ |
| 7 | Gamification | 🟠 ALTA | ⭐⭐⭐ | 3 sett | ⭐⭐⭐⭐ | ⏳ |
| 8 | White-Label | 🟡 MEDIA | ⭐⭐⭐ | 2-3 sett | ⭐⭐⭐ | ⏳ |
| 9 | Chat Avanzata | 🟡 MEDIA | ⭐⭐⭐ | 3 sett | ⭐⭐⭐ | ⏳ |
| 10 | Multi-Tenant Utente | 🟡 MEDIA | ⭐⭐⭐⭐ | 4 sett | ⭐⭐⭐ | ⏳ |
| 11 | PWA Offline | 🟢 BASSA | ⭐⭐⭐⭐ | 4-5 sett | ⭐⭐⭐ | ⏳ |
| 12 | Wearables | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 6-8 sett | ⭐⭐⭐ | ⏳ |
| 13 | Video Coaching | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 8-10 sett | ⭐⭐⭐⭐ | ⏳ |
| 14 | Marketplace | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 10+ sett | ⭐⭐⭐⭐ | ⏳ |
| 15 | AI Assistant | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 12+ sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 16 | Sistema Referral | 🟡 MEDIA | ⭐⭐ | 1-2 sett | ⭐⭐⭐⭐ | ⏳ |
| 17 | Pagamenti Integrati | 🟠 ALTA | ⭐⭐⭐⭐ | 4 sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 18 | AI Body Analysis | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 8+ sett | ⭐⭐⭐⭐ | ⏳ |
| 19 | Obiettivi SMART | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 20 | Template Schede | 🟠 ALTA | ⭐⭐⭐ | 2-3 sett | ⭐⭐⭐⭐ | ⏳ |
| 21 | Report PDF | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 22 | Sistema Note | 🟡 MEDIA | ⭐⭐ | 1 sett | ⭐⭐⭐ | ⏳ |
| 23 | Import Bulk | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐ | ⏳ |
| 24 | API Pubblica | 🟢 BASSA | ⭐⭐⭐⭐ | 6 sett | ⭐⭐⭐ | ⏳ |
| 25 | Community Avanzata | 🟡 MEDIA | ⭐⭐⭐ | 3 sett | ⭐⭐⭐⭐ | ⏳ |
| 26 | Email Personalizzata Tenant | 🟠 ALTA | ⭐⭐⭐⭐ | 3-4 sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 27 | SMS/WhatsApp Integration | 🟠 ALTA | ⭐⭐⭐ | 2-3 sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 28 | CRM Esterni | 🟡 MEDIA | ⭐⭐⭐ | 3 sett | ⭐⭐⭐ | ⏳ |
| 29 | Calendari Esterni | 🟠 ALTA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 30 | Gateway Pagamenti Multi | 🟠 ALTA | ⭐⭐⭐⭐ | 4-5 sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 31 | Google Analytics/Pixel | 🟡 MEDIA | ⭐⭐ | 1 sett | ⭐⭐⭐⭐ | ⏳ |
| 32 | ManyChat/Chatbot | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 33 | Typeform/Google Forms | 🟢 BASSA | ⭐⭐ | 1 sett | ⭐⭐⭐ | ⏳ |
| 34 | Fatturazione Elettronica | 🟠 ALTA | ⭐⭐⭐⭐ | 3-4 sett | ⭐⭐⭐⭐ | ⏳ |
| 35 | App Mobile Nativa | 🟢 BASSA | ⭐⭐⭐⭐⭐ | 12+ sett | ⭐⭐⭐⭐⭐ | ⏳ |
| 36 | SSO Enterprise | 🟢 BASSA | ⭐⭐⭐⭐ | 3 sett | ⭐⭐⭐ | ⏳ |
| 37 | Backup & Export | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 38 | Multi-lingua | 🟢 BASSA | ⭐⭐⭐⭐ | 4-5 sett | ⭐⭐⭐⭐ | ⏳ |
| 39 | Integrazione Advertising | 🟡 MEDIA | ⭐⭐⭐ | 2 sett | ⭐⭐⭐⭐ | ⏳ |
| 40 | LMS (Corsi) | 🟡 MEDIA | ⭐⭐⭐⭐ | 6-8 sett | ⭐⭐⭐⭐ | ⏳ |
| 41 | **Security Audit (XSS, Rules)** | 🔴 CRITICA | ⭐⭐ | 1 sett | ⭐⭐⭐⭐⭐ | ✅ FATTO |
| 42 | **Rate Limiting Persistente** | 🔴 CRITICA | ⭐⭐ | 3 giorni | ⭐⭐⭐⭐ | ✅ FATTO |

---

## 📝 CHANGELOG IMPLEMENTAZIONI

### 03 Gennaio 2026
- ✅ **Dashboard Analytics V2** - COMPLETATO
  - `AnalyticsNew.jsx` con UI moderna e alerts actionable
  - `useAnalyticsData.js` hook per dati pre-aggregati (real-time)
  - `AnalyticsComponents.jsx` UI components riutilizzabili
  - Cloud Function `aggregateTenantAnalytics` (scheduled ogni ora)
  - Cloud Function `refreshTenantAnalytics` (callable manuale)
  - Sparkline charts per trend revenue/checks
  - Alert panel: clienti scadenza, inattivi, check non letti
- ✅ **Security Audit completo**
  - Fix Firestore rules: rimosso `allow create: if true`, catch-all, limitato tenants read
  - Implementato DOMPurify per tutti i `dangerouslySetInnerHTML`
  - Sanitizzazione HTML in Chat, Landing Pages, Courses, PageBuilder
  - Creato `src/utils/sanitize.js` utility riutilizzabile
- ✅ **Rate Limiting persistente**
  - Aggiunto rate limiting con Firestore per funzioni critiche
  - In-memory per funzioni standard (fast path)
  - Scheduled cleanup `cleanupExpiredRateLimits`
- ✅ **Aggiornamenti configurazione**
  - ESLint: `ecmaVersion: 'latest'`
  - Vite: CSS minification attivata
  - firebase-admin allineato v13 (root e functions)
- ✅ **Rimosso workaround hardcoded**
  - `isGlobalExerciseEditor('biondo-fitness-coach')` rimosso

### 17 Dicembre 2025
- ✅ **Sistema Inviti MVP** completato
  - NewClient.jsx con QR code e codici invito
  - AcceptInvite.jsx per self-registration
  - InvitesManager.jsx widget gestione
  - 6 Cloud Functions per backend
- ✅ **Refactoring Clients page**
  - Componenti estratti in /components
  - Hook useClientsState per stato centralizzato
  - Paginazione (20 clienti per pagina)
  - Layout margini unificati
  - Header desktop riorganizzato
- ✅ **Nuovi modali ClientDetail**
  - RenewalModal, EditClientModal, ExtendExpiryModal
  - EditPaymentModal, NewCheckModal, PhotoZoomModal
- ✅ **ThemePreview** pagina personalizzazione tema
- ✅ **Sistema Notifiche** completato (FCM + in-app)

---

> 📝 **Questo documento è un punto di partenza. Aggiorna le priorità in base a:**
> - Feedback reali dei clienti
> - Risorse disponibili
> - Opportunità di mercato
> - Revenue potenziale

