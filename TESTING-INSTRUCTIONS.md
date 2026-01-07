# 🧪 ISTRUZIONI PER IL TESTING COMPLETO DELL'APP

## 📋 **OVERVIEW**
Questo documento contiene le istruzioni dettagliate per testare completamente l'applicazione FitFlows utilizzando il tenant di test dedicato.

**Nota sulle Credenziali:** Le password di test sono rappresentate con placeholder `[TEST_PASSWORD_*]` per motivi di sicurezza. Contatta il team di sviluppo per ottenere le password reali o usa gli script di setup per creare account di test.

## 🔐 **CREDENZIALI DI TEST**

### **ADMIN** (Gestione completa del business)
- **Email:** `test-admin@fitflowsapp.com`
- **Password:** `[TEST_PASSWORD_ADMIN]`
- **Tenant:** `test-tenant`

### **CLIENTE** (Area cliente con check-in)
- **Email:** `test-client@fitflowsapp.com`
- **Password:** `[TEST_PASSWORD_CLIENT]`
- **Tenant:** `test-tenant`

### **COLLABORATORE** (Area dipendente)
- **Email:** `test-collaboratore@fitflowsapp.com`
- **Password:** `[TEST_PASSWORD_COLLAB]`
- **Tenant:** `test-tenant`

### **COACH** (Gestione clienti e schede)
- **Email:** `test-coach@fitflowsapp.com`
- **Password:** `[TEST_PASSWORD_COACH]`
- **Tenant:** `test-tenant`

---

## 🧪 **PROTOCOLLO DI TESTING**

### **FASE 1: SETUP E AVVIO**
1. **Avvia l'applicazione:**
   ```bash
   cd /workspaces/PtPro
   npm run dev
   ```
2. **Apri il browser** all'indirizzo: `http://localhost:5173`
3. **Prepara 4 schede/tabs del browser** (una per ciascun ruolo)

---

## 👨‍💼 **TESTING ADMIN** (`test-admin@fitflowsapp.com`)

### **Login e Dashboard**
1. ✅ **Accedi** con credenziali admin
2. ✅ **Verifica** che vieni reindirizzato alla dashboard admin
3. ✅ **Controlla** che vedi il menu laterale con tutte le opzioni admin

### **Gestione Clienti**
1. ✅ **Clicca** su "Clienti" nel menu laterale
2. ✅ **Verifica** che vedi la lista clienti (dovresti vedere "Test Client")
3. ✅ **Clicca** su "Test Client" per vedere i dettagli
4. ✅ **Prova** a creare un nuovo cliente (opzionale)
5. ✅ **Verifica** che puoi modificare i dati del cliente

### **Gestione Coach**
1. ✅ **Verifica** che vedi "Test Coach" nella sezione coach
2. ✅ **Controlla** l'assegnazione clienti-coach

### **Gestione Collaboratori**
1. ✅ **Verifica** che vedi "Test Collaboratore" nella sezione collaboratori
2. ✅ **Controlla** i permessi e le funzionalità disponibili

### **Altre Funzionalità Admin**
1. ✅ **Testa** la navigazione tra tutte le sezioni del menu
2. ✅ **Verifica** che tutte le pagine caricano correttamente
3. ✅ **Prova** le funzionalità di ricerca e filtro
4. ✅ **Testa** le esportazioni dati (se disponibili)

---

## 👤 **TESTING CLIENTE** (`test-client@fitflowsapp.com`)

### **Login e Dashboard Cliente**
1. ✅ **Accedi** con credenziali cliente
2. ✅ **Verifica** che vieni reindirizzato alla dashboard cliente
3. ✅ **Controlla** che vedi solo l'area riservata al cliente

### **Funzionalità Cliente**
1. ✅ **Verifica** che vedi il tuo profilo personale
2. ✅ **Controlla** se puoi vedere le tue schede di allenamento
3. ✅ **Testa** la funzionalità di check-in giornaliero
4. ✅ **Verifica** che puoi aggiornare i tuoi dati (peso, misure, etc.)
5. ✅ **Prova** a visualizzare il tuo piano alimentare (se presente)

### **Interazioni con Coach**
1. ✅ **Verifica** che vedi il coach assegnato ("Test Coach")
2. ✅ **Controlla** se puoi comunicare con il coach
3. ✅ **Testa** l'invio di messaggi o richieste

---

## 🏋️‍♂️ **TESTING COACH** (`test-coach@fitflowsapp.com`)

### **Login e Dashboard Coach**
1. ✅ **Accedi** con credenziali coach
2. ✅ **Verifica** che vieni reindirizzato alla dashboard coach
3. ✅ **Controlla** che vedi i tuoi clienti assegnati

### **Gestione Clienti**
1. ✅ **Verifica** che vedi "Test Client" nella tua lista clienti
2. ✅ **Clicca** su "Test Client" per accedere al suo profilo
3. ✅ **Controlla** i dati del cliente (peso, misure, progresso)
4. ✅ **Verifica** che puoi creare/modificare schede di allenamento
5. ✅ **Testa** la creazione di piani alimentari

### **Comunicazione**
1. ✅ **Prova** a inviare messaggi al cliente
2. ✅ **Verifica** la cronologia delle comunicazioni
3. ✅ **Testa** le notifiche push (se implementate)

### **Strumenti Coach**
1. ✅ **Testa** la creazione di nuove schede
2. ✅ **Verifica** la libreria esercizi
3. ✅ **Prova** i template di scheda predefiniti
4. ✅ **Controlla** i report di progresso clienti

---

## 👷‍♂️ **TESTING COLLABORATORE** (`test-collaboratore@fitflowsapp.com`)

### **Login e Dashboard Collaboratore**
1. ✅ **Accedi** con credenziali collaboratore
2. ✅ **Verifica** che vieni reindirizzato alla dashboard collaboratore
3. ✅ **Controlla** che vedi solo le funzionalità per dipendenti

### **Funzionalità Collaboratore**
1. ✅ **Verifica** i permessi di accesso (cosa puoi/non puoi vedere)
2. ✅ **Testa** le funzionalità disponibili per il tuo ruolo
3. ✅ **Controlla** se puoi vedere clienti limitati o tutti
4. ✅ **Verifica** le funzionalità di supporto clienti

### **Gestione Oraria/Lavoro**
1. ✅ **Controlla** se c'è timesheet o tracking ore
2. ✅ **Testa** eventuali funzionalità di calendario
3. ✅ **Verifica** le comunicazioni interne

---

## 🔄 **TESTING CROSS-ROLE**

### **Comunicazione tra Ruoli**
1. ✅ **Da Admin:** Verifica comunicazione con tutti i ruoli
2. ✅ **Da Coach:** Testa comunicazione con clienti e admin
3. ✅ **Da Cliente:** Verifica comunicazione con coach
4. ✅ **Da Collaboratore:** Testa comunicazione interna

### **Condivisione Dati**
1. ✅ **Verifica** che i dati siano isolati per tenant
2. ✅ **Controlla** che non ci siano leak di dati tra tenant
3. ✅ **Testa** la sicurezza dei dati sensibili

---

## 🚨 **TESTING ERRORI E EDGE CASES**

### **Per Ogni Ruolo:**
1. ✅ **Prova** a accedere a pagine non autorizzate
2. ✅ **Verifica** i messaggi di errore appropriati
3. ✅ **Testa** la disconnessione e riconnessione
4. ✅ **Controlla** il comportamento offline (se applicabile)

### **Validazione Dati**
1. ✅ **Inserisci** dati non validi nei form
2. ✅ **Verifica** che la validazione funzioni
3. ✅ **Testa** i limiti dei campi (lunghezza, formato, etc.)

---

## 📱 **TESTING RESPONSIVE/MOBILE**

### **Per Ogni Ruolo:**
1. ✅ **Riduci** la finestra del browser a dimensioni mobile
2. ✅ **Verifica** che l'interfaccia si adatti
3. ✅ **Testa** la navigazione touch
4. ✅ **Controlla** che tutti i componenti siano usabili

---

## ✅ **CHECKLIST FINALE**

### **Funzionalità Core**
- [ ] Login sicuro per tutti i ruoli
- [ ] Routing corretto basato sui permessi
- [ ] Isolamento tenant funzionante
- [ ] Dashboard appropriate per ogni ruolo
- [ ] Gestione clienti completa (admin/coach)
- [ ] Area cliente funzionale
- [ ] Sistema collaboratori operativo
- [ ] Comunicazione inter-ruolo
- [ ] Sicurezza e autorizzazioni
- [ ] Responsive design

### **Privacy e Sicurezza**
- [ ] Pagina eliminazione account accessibile: https://www.flowfitpro.it/delete-account.html
- [ ] Esportazione dati GDPR funzionante
- [ ] Cancellazione account sicura con conferma
- [ ] Eliminazione effettiva dei dati personali
- [ ] Conservazione dati obbligatori (pagamenti)
- [ ] Contatti privacy raggiungibili

### **Performance**
- [ ] Caricamento pagine veloce
- [ ] Navigazione fluida
- [ ] Nessun errore console
- [ ] Gestione errori appropriata

### **UX/UI**
- [ ] Interfaccia intuitiva
- [ ] Feedback visivo appropriato
- [ ] Navigazione chiara
- [ ] Design consistente

---

## � **DIRITTI PRIVACY E GDPR**

### **📥 Esportazione Dati Personali**
Ogni utente può richiedere l'esportazione di tutti i propri dati personali:

1. ✅ **Accedi** al tuo account
2. ✅ **Vai** nelle impostazioni del profilo
3. ✅ **Clicca** su "Privacy & GDPR"
4. ✅ **Seleziona** "Esporta i miei dati"
5. ✅ **Scarica** il file JSON con tutti i tuoi dati

### **🗑️ Cancellazione Account e Dati**
Per richiedere la cancellazione completa del tuo account e di tutti i dati associati, hai due opzioni:

#### **Opzione 1: Eliminazione dall'App (Raccomandata)**
1. ✅ **Accedi** al tuo account nell'app FitFlows
2. ✅ **Vai** nelle impostazioni del profilo
3. ✅ **Clicca** su "Privacy & GDPR"
4. ✅ **Seleziona** "Elimina account"
5. ✅ **Leggi** attentamente le informazioni sulla cancellazione
6. ✅ **Digita** esattamente "ELIMINA IL MIO ACCOUNT" nel campo di conferma
7. ✅ **Clicca** "Elimina definitivamente"

#### **Opzione 2: Pagina Web Dedicata**
Visita la nostra pagina dedicata per l'eliminazione account:
- **URL:** https://www.flowfitpro.it/delete-account.html
- **Contiene:** Istruzioni dettagliate, tipi di dati eliminati/conservati, e contatti supporto

### **⚠️ Importante sulla Cancellazione:**
- **La cancellazione è irreversibile** - tutti i dati verranno eliminati permanentemente
- **Alcuni dati potrebbero essere conservati** per obblighi legali (pagamenti, fatturazione per 10 anni)
- **Il processo richiede conferma esplicita** per prevenire cancellazioni accidentali
- **Dopo la cancellazione**, non potrai più accedere con le stesse credenziali
- **Tempo di elaborazione:** Fino a 30 giorni

### **📞 Contatti Privacy**
Per qualsiasi domanda sui tuoi diritti privacy o problemi con la cancellazione:
- **Email supporto:** privacy@fitflowsapp.com
- **Sezione supporto:** Disponibile nell'app nelle impostazioni
- **Link eliminazione account:** https://www.flowfitpro.it/delete-account.html

---

## �🐛 **SEGNALAZIONE BUG**

Se trovi un bug durante il testing:
1. **Descrivi** il problema in dettaglio
2. **Specifica** con quale account si verifica
3. **Includi** i passi per riprodurre
4. **Aggiungi** screenshot se possibile
5. **Nota** il browser e dispositivo utilizzati

---

## 🎯 **OBIETTIVI DEL TESTING**

- ✅ **Verificare** che tutti i ruoli funzionino correttamente
- ✅ **Confermare** l'isolamento dei dati per tenant
- ✅ **Testare** la sicurezza e le autorizzazioni
- ✅ **Validare** l'esperienza utente per ogni profilo
- ✅ **Identificare** eventuali bug o problemi di performance

**Buon testing! 🚀**</content>
<parameter name="filePath">/workspaces/PtPro/TESTING-INSTRUCTIONS.md