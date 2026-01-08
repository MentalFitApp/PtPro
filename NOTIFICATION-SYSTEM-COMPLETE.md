# 🔔 Sistema Notifiche Completo - Documentazione

## 📋 Panoramica

Sistema completo di notifiche push per FitFlows che include:
- ✅ Centro Notifiche Admin/Coach per invio bulk
- ✅ Reminder automatici check-in scaduti
- ✅ Notifiche automatiche su workout/nutrition
- ✅ Notifiche chat messages
- ✅ Template predefiniti
- ✅ Storico notifiche
- ✅ Filtri clienti avanzati

## 🎯 Funzionalità Principali

### 1. Centro Notifiche (Admin/Coach)
**Percorso:** `/admin/notifiche` o `/coach/notifiche`

Interfaccia completa per gestire le notifiche:

#### Template Rapidi
- 💪 **Workout Reminder**: Promemoria allenamento
- 📊 **Check Reminder**: Sollecito caricamento check-in
- 🍎 **Nutrition Reminder**: Promemoria piano alimentare
- 🔥 **Motivation**: Messaggio motivazionale
- 📝 **Custom**: Notifica personalizzata

#### Filtri Destinatari
- **Tutti i Clienti**: Invio broadcast completo
- **Clienti Attivi**: Solo abbonamenti validi
- **Abbonamenti Scaduti**: Target clienti da riattivare
- **Nessun Check da 7+ giorni**: Clienti che non caricano check
- **Nessun Check da 14+ giorni**: Clienti inattivi
- **Selezione Manuale**: Scelta custom con ricerca

#### Storico Notifiche
- Visualizza ultimi 30 giorni
- Dettaglio invii (titolo, corpo, destinatari)
- Timestamp e stato invio

### 2. Notifiche Automatiche

#### Check-in Reminder (Scheduled)
**Cloud Function:** `dailyCheckReminders`
**Schedule:** Ogni giorno alle 10:00 AM

**Logica:**
```javascript
- Se cliente NON ha mai fatto check:
  → Invia reminder dopo 7 giorni dalla registrazione
  
- Se cliente ha fatto check in passato:
  → Se sono passati 7+ giorni dall'ultimo check
  → Invia reminder ogni 7 giorni (non quotidiano)
  
- Solo per clienti con abbonamento attivo
```

**Messaggio:**
- Primo check: "📊 È ora del tuo primo check-in!"
- Check successivi: "📊 È ora del check-in! Sono passati X giorni dall'ultimo check."

#### Workout/Nutrition Updates
**Trigger:** Salvataggio scheda allenamento/alimentazione

**Logica:**
```javascript
// SchedaAllenamento.jsx - handleSave()
const isNewWorkout = !schedaExists;
if (isNewWorkout) {
  await notifyNewWorkout(clientId, clientName, schedaData);
} else {
  await notifyWorkoutUpdated(clientId, clientName, schedaData);
}

// SchedaAlimentazione.jsx - handleSendToClient()
const isNewPlan = !schedaExists;
if (isNewPlan) {
  await notifyNewNutrition(clientId, clientName, pianoData);
} else {
  await notifyNutritionUpdated(clientId, clientName, pianoData);
}
```

**Messaggi:**
- Nuova scheda: "💪 Nuova Scheda Allenamento! La tua nuova scheda 'obiettivo' è disponibile!"
- Aggiornamento: "🔄 Scheda Allenamento Aggiornata! La tua scheda 'obiettivo' è stata modificata"

#### Chat Messages
**Trigger:** Cloud Function `onChatMessageCreated`
**Percorso:** `tenants/{tenantId}/chats/{chatId}/messages/{messageId}`

**Logica:**
```javascript
- Quando nuovo messaggio viene creato
- Identifica destinatario (participants - senderId)
- Determina se destinatario è coach o client
- Invia notifica con preview messaggio (max 50 caratteri)
```

## 🛠️ File Modificati/Creati

### Nuovi File
1. **`/src/pages/admin/CentroNotifiche.jsx`**
   - Interfaccia completa Centro Notifiche
   - Template, filtri, invio bulk, storico
   - 700+ righe di codice

### File Modificati

1. **`/src/services/notificationService.js`**
   - Aggiunto `sendBulkNotification()` - invio multiplo
   - Aggiunto `getNotificationHistory()` - storico 30 giorni
   - Aggiunto `notifyCheckReminder()` - reminder check-in
   - Export completo di tutte le funzioni

2. **`/functions/index.js`**
   - Aggiunta Cloud Function `dailyCheckReminders`
   - Schedule: `'0 10 * * *'` (ogni giorno ore 10:00)
   - Logica reminder intelligente (7 giorni, no spam)

3. **`/src/components/layout/NebulaSidebar.jsx`**
   - Admin: Aggiunto "Notifiche" nella sezione "Contenuti"
   - Coach: Aggiunto "Notifiche" nella sezione "Gestione"
   - Icon: `BellRing`, Color: `purple`

4. **`/src/App.jsx`**
   - Import `CentroNotifiche` component
   - Route `/admin/notifiche`
   - Route `/coach/notifiche`

## 📊 Tipi di Notifica

```javascript
NOTIFICATION_TYPES = {
  NEW_LEAD: 'new_lead',
  NEW_EVENT: 'new_event',
  NEW_ANAMNESI: 'new_anamnesi',
  NEW_CHECK: 'new_check',
  CALL_REQUEST: 'call_request',
  NEW_CLIENT: 'new_client',
  PAYMENT: 'payment',
  EXPIRING: 'expiring',
  MESSAGE: 'message',
  NEW_WORKOUT: 'new_workout',           // ✅ NUOVO
  NEW_NUTRITION: 'new_nutrition',       // ✅ NUOVO
  WORKOUT_UPDATED: 'workout_updated',   // ✅ NUOVO
  NUTRITION_UPDATED: 'nutrition_updated', // ✅ NUOVO
  CHAT_MESSAGE: 'chat_message',         // ✅ NUOVO
  CUSTOM: 'custom'                      // ✅ NUOVO (per bulk)
}
```

## 🚀 Come Usare

### Per Admin/Coach - Invio Manuale

1. **Accedi al Centro Notifiche**
   - Sidebar → Notifiche
   - Oppure `/admin/notifiche` o `/coach/notifiche`

2. **Seleziona Template**
   - Click su template rapido (Workout, Check, Nutrition, etc.)
   - Oppure crea custom

3. **Personalizza Messaggio**
   - Titolo (max 50 caratteri)
   - Corpo (max 200 caratteri)
   - Emoji supportate! 💪📊🍎🔥

4. **Scegli Destinatari**
   - Click su filtro (Tutti, Attivi, Scaduti, etc.)
   - Oppure "Selezione Manuale" per scelta custom

5. **Invia**
   - Conferma numero destinatari
   - Click "Invia a X clienti"
   - ✅ Notifica inviata!

### Per Sistema - Notifiche Automatiche

#### Check-in Reminder
**Setup:** Già configurato! ✅

La Cloud Function `dailyCheckReminders` si attiva automaticamente:
- Ogni giorno alle 10:00 AM
- Controlla tutti i clienti attivi
- Invia reminder se check scaduto (7+ giorni)

**Deploy Cloud Function:**
```bash
cd functions
firebase deploy --only functions:dailyCheckReminders
```

#### Workout/Nutrition
**Setup:** Già integrato! ✅

Quando coach salva scheda in:
- `/scheda-allenamento/:clientId`
- `/scheda-alimentazione/:clientId`

Il sistema invia automaticamente notifica al cliente.

#### Chat Messages
**Setup:** Già integrato! ✅

La Cloud Function `onChatMessageCreated` si attiva automaticamente quando:
- Nuovo messaggio creato in `/chats/{chatId}/messages`
- Identifica destinatario
- Invia notifica push

## 🔧 Configurazione

### Firebase Cloud Messaging (FCM)
**VAPID Key configurato:** ✅
```javascript
// public/firebase-messaging-sw.js
const vapidKey = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';
```

### Permessi Browser
Il sistema richiede permessi notifiche al primo accesso:
```javascript
// notificationService.js
requestNotificationPermissionOnFirstLogin()
```

### Android App
**Setup:** ✅ Configurato con `google-services.json`

Notifiche push funzionano anche su Android app (AAB v1.1).

## 📱 Flusso Notifiche

```
1. Evento Trigger
   ↓
2. createNotification in Firestore
   (tenants/{tenantId}/notifications)
   ↓
3. Cloud Function sendPushNotification
   (functions/index.js onDocumentCreated)
   ↓
4. FCM invia push a dispositivo
   ↓
5. Service Worker mostra notifica
   (firebase-messaging-sw.js)
```

## 🎨 UI/UX Features

- **Design Nebula 2.0**: Glass effect, glow, animazioni
- **Responsive**: Mobile-friendly
- **Real-time**: Conteggio destinatari live
- **Search**: Ricerca clienti in selezione manuale
- **Preview**: Anteprima messaggio prima invio
- **Validation**: Controlli pre-invio (titolo, corpo, destinatari)

## 📈 Analytics

**Storico Notifiche** mostra:
- Titolo e corpo messaggio
- Numero destinatari
- Data e ora invio
- Stato (Inviata/Errore)

## 🔐 Sicurezza

- ✅ Autenticazione richiesta
- ✅ Verifica role (admin/coach only per invio bulk)
- ✅ Tenant isolation (ogni tenant vede solo sue notifiche)
- ✅ Cloud Functions con auth check

## 🐛 Troubleshooting

### Notifiche non arrivano?

1. **Verifica permessi browser**
   ```javascript
   console.log(Notification.permission); // deve essere 'granted'
   ```

2. **Controlla Service Worker**
   ```javascript
   navigator.serviceWorker.getRegistrations()
   ```

3. **Verifica FCM token**
   ```javascript
   // firebase-messaging-sw.js logs
   console.log('FCM Token:', token);
   ```

4. **Check Cloud Functions logs**
   ```bash
   firebase functions:log
   ```

### Cloud Function non si attiva?

1. **Verifica deploy**
   ```bash
   firebase deploy --only functions:dailyCheckReminders
   ```

2. **Check schedule syntax**
   ```javascript
   '0 10 * * *' // Cron expression valida
   ```

3. **Test manuale**
   ```bash
   firebase functions:shell
   dailyCheckReminders({})
   ```

## 🚀 Prossimi Miglioramenti

- [ ] Notifiche programmate (schedule send)
- [ ] A/B testing template
- [ ] Statistiche apertura notifiche
- [ ] Segmentazione avanzata clienti
- [ ] Template salvati personalizzati
- [ ] Notifiche ricorrenti (weekly/monthly)
- [ ] Rich notifications (immagini, action buttons)
- [ ] Centro Notifiche per clienti (inbox)

## 📞 Supporto

Per problemi o domande:
- Check logs: `firebase functions:log`
- Firestore Console: verifica collezione `notifications`
- Browser DevTools: Console tab per errori JS

---

**Versione:** 1.0.0
**Data:** Gennaio 2026
**Status:** ✅ Production Ready
