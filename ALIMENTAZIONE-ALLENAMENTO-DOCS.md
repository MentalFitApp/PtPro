# Documentazione: Sezione Alimentazione e Allenamento

## Panoramica
Questa nuova sezione, accessibile solo agli amministratori, permette la gestione completa di alimenti, esercizi e schede cliente per allenamento e alimentazione.

## Accesso
- **URL**: `/alimentazione-allenamento`
- **Permessi**: Solo amministratori
- **Navigazione**: Visibile nella sidebar sinistra come "Alimentazione"

## Struttura della Sezione

### 1. Schermata Principale
La schermata principale presenta tre sezioni principali sotto forma di card cliccabili:

#### Lista Clienti (Rosso)
- Icona: Utenti
- Descrizione: "Gestisci le schede di allenamento e alimentazione dei tuoi clienti"

#### Lista Alimenti (Verde)
- Icona: Mela
- Descrizione: "Database completo di alimenti con valori nutrizionali"

#### Lista Esercizi (Blu)
- Icona: Manubri
- Descrizione: "Catalogo esercizi con attrezzi e gruppi muscolari"

---

## 2. Lista Alimenti

### Categorie Alimentari (18)
Le seguenti categorie sono disponibili:
1. Antipasti
2. Primi
3. Secondi
4. Dolci
5. Pizze
6. Bevande
7. Carne
8. Condimenti
9. Formaggi
10. Frutta
11. Integratori
12. Latte
13. Pane
14. Pasta
15. Pesce
16. Salumi
17. Uova
18. Verdura

### Funzionalità
- **Visualizzazione Categorie**: Griglia di card cliccabili con tutte le categorie
- **Ricerca**: Campo di ricerca per filtrare gli alimenti per nome
- **Aggiunta Alimento**: Bottone "Aggiungi Alimento" per creare nuovi alimenti

### Campi per Alimento
Ogni alimento contiene i seguenti dati (per 100g):
- **Nome Alimento** (obbligatorio)
- **Kcal** (obbligatorio)
- **Proteine (g)** (obbligatorio)
- **Carboidrati (g)** (obbligatorio)
- **Grassi (g)** (obbligatorio)

### Operazioni CRUD
- **Crea**: Aggiungi nuovo alimento tramite form
- **Leggi**: Visualizza tutti gli alimenti in tabella
- **Aggiorna**: Modifica alimento esistente tramite icona matita
- **Elimina**: Cancella alimento tramite icona cestino (con conferma)

### Tabella Alimenti
Visualizzazione in formato tabella con colonne:
- Nome
- Kcal
- Proteine
- Carboidrati
- Grassi
- Azioni (Modifica/Elimina)

### Storage Firestore
```
Collection: alimenti/{categoria}/items/{documentId}
Fields:
  - nome: string
  - kcal: number
  - proteine: number
  - carboidrati: number
  - grassi: number
  - createdAt: timestamp
  - updatedAt: timestamp (opzionale)
```

---

## 3. Lista Esercizi

### Attrezzi Disponibili (12)
1. Bilanciere
2. Manubri
3. Macchina
4. Cavi
5. Corpo libero
6. Kettlebell
7. Bande elastiche
8. TRX
9. Palla medica
10. Swiss ball
11. Sbarra per trazioni
12. Panca

### Gruppi Muscolari (14)
1. Petto
2. Schiena
3. Spalle
4. Bicipiti
5. Tricipiti
6. Gambe
7. Quadricipiti
8. Femorali
9. Polpacci
10. Glutei
11. Addominali
12. Core
13. Avambracci
14. Trapezio

### Funzionalità
- **Ricerca per Nome**: Campo di ricerca per trovare esercizi specifici
- **Filtri Avanzati**: Pannello filtri espandibile per:
  - Filtrare per attrezzo
  - Filtrare per gruppo muscolare
- **Aggiunta Esercizio**: Bottone "Aggiungi Esercizio"

### Campi per Esercizio
- **Nome Esercizio** (obbligatorio)
- **Attrezzo** (obbligatorio, selezione da lista)
- **Gruppo Muscolare** (obbligatorio, selezione da lista)
- **Descrizione** (opzionale)
- **URL Video** (opzionale)

### Operazioni CRUD
- **Crea**: Aggiungi nuovo esercizio tramite form
- **Leggi**: Visualizza tutti gli esercizi in tabella con filtri
- **Aggiorna**: Modifica esercizio esistente
- **Elimina**: Cancella esercizio (con conferma)

### Tabella Esercizi
Visualizzazione con colonne:
- Nome
- Attrezzo (badge blu)
- Gruppo Muscolare (badge viola)
- Descrizione
- Azioni (Modifica/Elimina)

### Storage Firestore
```
Collection: esercizi/{documentId}
Fields:
  - nome: string
  - attrezzo: string
  - gruppoMuscolare: string
  - descrizione: string (opzionale)
  - videoUrl: string (opzionale)
  - createdAt: timestamp
  - updatedAt: timestamp (opzionale)
```

---

## 4. Lista Clienti

### Funzionalità
- **Ricerca**: Cerca cliente per nome o email
- **Filtri Stato**: 
  - Tutti
  - Attiva (entrambe le schede consegnate)
  - Scaduta (almeno una scheda scaduta)
  - In Scadenza (almeno una scheda in scadenza entro 7 giorni)

### Visualizzazione Stato Schede
Ogni cliente mostra due indicatori di stato:

#### Scheda Allenamento
- **Verde (Consegnata)**: Scheda valida, scadenza oltre 7 giorni
- **Arancione (Scaduta)**: Scheda scaduta o in scadenza entro 7 giorni
- **Rosso (Mancante)**: Scheda non presente

#### Scheda Alimentazione
- **Verde (Consegnata)**: Scheda valida, scadenza oltre 7 giorni
- **Arancione (Scaduta)**: Scheda scaduta o in scadenza entro 7 giorni
- **Rosso (Mancante)**: Scheda non presente

### Tabella Clienti
Colonne visualizzate:
- Nome
- Email
- Telefono
- Scheda Allenamento (badge colorato con stato e data scadenza)
- Scheda Alimentazione (badge colorato con stato e data scadenza)

### Logica Stato
```javascript
// Verde (Consegnata): scadenza > 7 giorni dal oggi
// Arancione (Scaduta): scadenza passata O scadenza <= 7 giorni
// Rosso (Mancante): nessuna data di scadenza presente
```

### Storage Firestore
```
Collection: clients/{clientId}
Fields utilizzati:
  - name: string
  - email: string
  - phone: string
  - schedaAllenamento: {
      scadenza: timestamp
    }
  - schedaAlimentazione: {
      scadenza: timestamp
    }
```

---

## Navigazione

### Aggiunta al Menu Admin
Il link "Alimentazione" è stato aggiunto alla sidebar amministratore tra le voci esistenti:
- Dashboard
- Clienti
- Chat
- Novità
- Collaboratori
- Guide & Lead
- Dipendenti
- Calendario
- Statistiche
- Notifiche
- **Alimentazione** (NUOVO)

### Routing
Nuova route aggiunta in `App.jsx`:
```jsx
<Route path="/alimentazione-allenamento" element={<AlimentazioneAllenamento />} />
```

---

## File Creati/Modificati

### Nuovi File
1. `/src/pages/AlimentazioneAllenamento.jsx` - Pagina principale
2. `/src/components/ListaAlimenti.jsx` - Componente gestione alimenti
3. `/src/components/ListaEsercizi.jsx` - Componente gestione esercizi
4. `/src/components/ListaClientiAllenamento.jsx` - Componente visualizzazione clienti

### File Modificati
1. `/src/App.jsx` - Aggiunta route e import
2. `/src/components/MainLayout.jsx` - Aggiunto link navigazione
3. `/eslint.config.js` - Fix configurazione ESLint
4. `/package.json` - Fix script lint

---

## Design e UX

### Palette Colori
- **Lista Clienti**: Tema rosso/rosa (rose-600)
- **Lista Alimenti**: Tema verde (emerald-600)
- **Lista Esercizi**: Tema blu (blue-600)

### Animazioni
- Tutte le transizioni usano Framer Motion per animazioni fluide
- Hover effects sulle card e bottoni
- Transizioni di stato per apertura/chiusura form e filtri

### Responsive
- Layout ottimizzato per desktop, tablet e mobile
- Tabelle con overflow scroll orizzontale su schermi piccoli
- Grid responsive per le card delle categorie

---

## Nota Importante
⚠️ **La sezione è attualmente solo lato admin. Non è ancora pubblica per i clienti finali.**

I clienti non vedranno questa sezione nella loro dashboard. Solo gli amministratori hanno accesso completo a queste funzionalità.

---

## Testing
Il progetto è stato compilato con successo usando:
```bash
npm run build
```

Build completato senza errori o warning di sicurezza.

---

## Futuri Sviluppi Possibili
1. Aggiunta campo "quantità" per gli alimenti
2. Sistema di preferiti per alimenti ed esercizi
3. Creazione schede direttamente da questa interfaccia
4. Export PDF delle schede
5. Integrazione con calendario per rinnovi automatici
6. Statistiche sull'utilizzo degli alimenti/esercizi più comuni
