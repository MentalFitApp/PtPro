# Documentazione Schede Allenamento e Alimentazione

## Panoramica
Nuove pagine dedicate per creare e gestire schede di allenamento e alimentazione personalizzate per ogni cliente.

## Accesso
Dal menu "Alimentazione e Allenamento" → "Lista Clienti" → Clicca su uno dei badge colorati (Scheda Allenamento o Scheda Alimentazione)

---

## Scheda Alimentazione

### URL
`/scheda-alimentazione/:clientId`

### Campi Principali

#### Intestazione
- **Nome Cliente**: Visualizzato automaticamente
- **Obiettivo**: Menu a tendina
  - Definizione
  - Massa
  - Mantenimento
  - Dimagrimento
  - Sportivo
- **Durata**: In settimane (es. 12)
- **Note**: Campo libero per annotazioni generali

### Struttura Settimanale

#### Giorni
7 giorni della settimana (Lunedì - Domenica) navigabili con tab

#### Pasti per Giorno
Ogni giorno ha 5 pasti predefiniti:
1. Colazione
2. Spuntino
3. Pranzo
4. Spuntino
5. Cena

### Gestione Alimenti

#### Aggiunta Alimento
Per ogni pasto si possono aggiungere alimenti con:
- **Nome**: Es. "Petto di pollo"
- **Quantità**: In grammi (es. 150g)
- **Kcal**: Calorie per 100g
- **Proteine**: Grammi per 100g
- **Carboidrati**: Grammi per 100g
- **Grassi**: Grammi per 100g

I valori nutrizionali vengono calcolati automaticamente in base alla quantità inserita.

#### Visualizzazione
Tabella con colonne:
- Alimento
- Quantità
- Kcal (calcolate)
- Proteine (calcolate)
- Carboidrati (calcolati)
- Grassi (calcolati)
- Azioni (elimina)

### Funzionalità Pasti

#### Spostare Pasti
- ⬆️ **Freccia Su**: Sposta il pasto prima nella sequenza
- ⬇️ **Freccia Giù**: Sposta il pasto dopo nella sequenza
- Esempio: Spostare "Spuntino" dopo "Cena" o "Pranzo" prima di "Spuntino"

#### Duplicare Pasto
- 📋 **Duplica**: Crea una copia del pasto con tutti i suoi alimenti
- Utile per aggiungere pasti extra (es. secondo spuntino)

### Funzionalità Giorno

#### Duplicare Giorno
- Copia l'intera programmazione del giorno su altri giorni della settimana
- Conferma richiesta prima di sovrascrivere

#### Reset Giorno
- Cancella tutti i pasti e alimenti del giorno corrente
- Conferma richiesta per evitare cancellazioni accidentali

### Totali Giornalieri

Visualizzazione automatica dei totali del giorno selezionato:
- **Quantità Totale**: Grammi totali di cibo
- **Kcal**: Calorie totali
- **Proteine**: Grammi totali
- **Carboidrati**: Grammi totali
- **Grassi**: Grammi totali

I totali vengono calcolati sommando tutti i pasti del giorno.

### Sezione Integrazione

Campo di testo libero per inserire:
- Consigli sull'integrazione
- Tips nutrizionali
- Note sugli integratori consigliati
- Timing di assunzione

### Salvataggio

Cliccando "Salva Scheda":
1. La scheda viene salvata in Firestore (`schede_alimentazione/{clientId}`)
2. Viene calcolata la data di scadenza (oggi + durata in settimane)
3. La scadenza viene aggiornata sul record cliente (`clients/{clientId}.schedaAlimentazione.scadenza`)
4. Il badge nella lista clienti si aggiorna automaticamente

---

## Scheda Allenamento

### URL
`/scheda-allenamento/:clientId`

### Campi Principali

#### Intestazione
- **Nome Cliente**: Visualizzato automaticamente
- **Obiettivo**: Menu a tendina
  - Forza
  - Massa
  - Definizione
  - Resistenza
  - Ricomposizione
- **Livello**: Menu a tendina
  - Principiante
  - Intermedio
  - Avanzato
- **Durata**: In settimane (es. 12)
- **Note**: Campo libero per annotazioni generali

### Struttura Settimanale

#### Giorni
7 giorni della settimana (Lunedì - Domenica) navigabili con tab

### Gestione Esercizi

#### Aggiunta Esercizio
Cliccando "Aggiungi Esercizio" si apre un modale con:
- **Ricerca**: Cerca esercizio per nome
- **Lista Esercizi**: Tutti gli esercizi dall'archivio con:
  - Nome esercizio
  - Attrezzo (badge blu)
  - Gruppo muscolare (badge viola)
  - Icona video se disponibile

#### Dettagli Esercizio
Per ogni esercizio aggiunto:
- **Nome**: Visualizzato in intestazione
- **Video**: Link al video esecutivo (se presente nell'archivio)
- **Attrezzo e Gruppo Muscolare**: Badge informativi
- **Serie**: Numero di serie (es. 3)
- **Ripetizioni**: Range o numero (es. "8-12" o "10")
- **Recupero**: Secondi di riposo (es. 60)
- **Note Esercizio**: Campo per note tecniche, varianti, ecc.

### Funzionalità Esercizi

#### Spostare Esercizi
- ⬆️ **Freccia Su**: Sposta l'esercizio prima nella sequenza
- ⬇️ **Freccia Giù**: Sposta l'esercizio dopo nella sequenza

#### Eliminare Esercizio
- 🗑️ **Elimina**: Rimuove l'esercizio dal programma

### Superserie

#### Aggiunta Marcatori
Per ogni esercizio ci sono due pulsanti:
- **+ Inizio Superserie**: Aggiunge una barra "▼ INIZIO SUPERSERIE" dopo l'esercizio
- **+ Fine Superserie**: Aggiunge una barra "▲ FINE SUPERSERIE" dopo l'esercizio

#### Utilizzo
1. Aggiungi il primo esercizio della superserie
2. Clicca "+ Inizio Superserie"
3. Aggiungi 2-3 esercizi da eseguire in sequenza
4. Clicca "+ Fine Superserie" sull'ultimo esercizio

Esempio:
```
Esercizio 1: Panca piana
▼ INIZIO SUPERSERIE
Esercizio 2: Croci manubri
Esercizio 3: Push up
▲ FINE SUPERSERIE
Esercizio 4: Shoulder press
```

### Funzionalità Giorno

#### Duplicare Giorno
- Copia l'intera programmazione del giorno su altri giorni della settimana
- Mantiene anche i marcatori superserie
- Conferma richiesta prima di sovrascrivere

#### Reset Giorno
- Cancella tutti gli esercizi e marcatori del giorno corrente
- Conferma richiesta per evitare cancellazioni accidentali

### Video Esecutivi

#### Visualizzazione
Se un esercizio ha un video nell'archivio:
- Viene mostrato un badge "🎬 Video" accanto al nome
- Cliccando si apre il video in una nuova tab

#### Gestione
I video vengono caricati nell'archivio esercizi tramite il campo "URL Video" nella sezione "Lista Esercizi"

### Salvataggio

Cliccando "Salva Scheda":
1. La scheda viene salvata in Firestore (`schede_allenamento/{clientId}`)
2. Viene calcolata la data di scadenza (oggi + durata in settimane)
3. La scadenza viene aggiornata sul record cliente (`clients/{clientId}.schedaAllenamento.scadenza`)
4. Il badge nella lista clienti si aggiorna automaticamente

---

## Integrazione con Lista Clienti

### Badge Cliccabili
Nella "Lista Clienti" della sezione "Alimentazione e Allenamento", ogni cliente ha due badge di stato:
- **Scheda Allenamento**: Cliccabile per aprire l'editor
- **Scheda Alimentazione**: Cliccabile per aprire l'editor

### Stati Badge
- 🟢 **Verde (Consegnata)**: Scheda valida, scade tra più di 7 giorni
- 🟠 **Arancione (Scaduta)**: Scheda scaduta o in scadenza entro 7 giorni
- 🔴 **Rosso (Mancante)**: Nessuna scheda presente

Cliccando su qualsiasi badge si apre la pagina dedicata per creare o modificare quella scheda.

---

## Struttura Database Firestore

### Nuove Collection

#### schede_alimentazione
```javascript
schede_alimentazione/{clientId}: {
  obiettivo: "Definizione",
  note: "Note generali",
  durataSettimane: 12,
  integrazione: "Creatina 5g/die, Omega 3...",
  giorni: {
    "Lunedì": {
      pasti: [
        {
          nome: "Colazione",
          alimenti: [
            {
              nome: "Avena",
              quantita: 80,
              kcal: 370,
              proteine: 13,
              carboidrati: 66,
              grassi: 7
            },
            // ... altri alimenti
          ]
        },
        // ... altri pasti
      ]
    },
    // ... altri giorni
  },
  updatedAt: timestamp
}
```

#### schede_allenamento
```javascript
schede_allenamento/{clientId}: {
  obiettivo: "Massa",
  livello: "Intermedio",
  note: "Focus su compound",
  durataSettimane: 12,
  giorni: {
    "Lunedì": {
      esercizi: [
        {
          nome: "Panca piana",
          attrezzo: "Bilanciere",
          gruppoMuscolare: "Petto",
          videoUrl: "https://...",
          serie: "4",
          ripetizioni: "8-10",
          recupero: "90",
          noteEsercizio: "Enfasi sulla fase eccentrica"
        },
        {
          type: "superset-start",
          isMarker: true
        },
        // ... altri esercizi
        {
          type: "superset-end",
          isMarker: true
        }
      ]
    },
    // ... altri giorni
  },
  updatedAt: timestamp
}
```

### Collection Aggiornata

#### clients
```javascript
clients/{clientId}: {
  // ... campi esistenti
  schedaAlimentazione: {
    scadenza: timestamp
  },
  schedaAllenamento: {
    scadenza: timestamp
  }
}
```

---

## Flusso di Lavoro Tipico

### Creazione Scheda Alimentazione
1. Vai su "Alimentazione e Allenamento" → "Lista Clienti"
2. Clicca sul badge "Scheda Alimentazione" del cliente
3. Compila obiettivo, durata, note
4. Per ogni giorno:
   - Seleziona il giorno dalla tab
   - Per ogni pasto, aggiungi gli alimenti con quantità
   - Verifica i totali giornalieri
5. Aggiungi note sull'integrazione
6. Salva la scheda
7. Il badge nella lista diventerà verde con la data di scadenza

### Creazione Scheda Allenamento
1. Vai su "Alimentazione e Allenamento" → "Lista Clienti"
2. Clicca sul badge "Scheda Allenamento" del cliente
3. Compila obiettivo, livello, durata, note
4. Per ogni giorno:
   - Seleziona il giorno dalla tab
   - Clicca "Aggiungi Esercizio" e seleziona dall'archivio
   - Compila serie, ripetizioni, recupero
   - Aggiungi note se necessario
   - Aggiungi marcatori superserie se serve
   - Ripeti per tutti gli esercizi
5. Salva la scheda
6. Il badge nella lista diventerà verde con la data di scadenza

### Modifica Scheda Esistente
1. Clicca sul badge del cliente
2. La scheda esistente viene caricata automaticamente
3. Modifica i campi necessari
4. Salva le modifiche
5. La data di scadenza viene ricalcolata se hai modificato la durata

---

## Note Tecniche

### Calcoli Automatici
- I valori nutrizionali sono calcolati in tempo reale in base alla quantità
- I totali giornalieri si aggiornano automaticamente quando si aggiungono/rimuovono alimenti
- La data di scadenza viene calcolata come: oggi + (durata_settimane * 7 giorni)

### Validazione
- Nome e quantità sono obbligatori per gli alimenti
- Selezione esercizio è obbligatoria prima di aggiungere
- Conferma richiesta per operazioni distruttive (reset, duplica sovrascrivendo)

### Performance
- Caricamento lazy delle schede esistenti
- Salvataggio su richiesta (non automatico)
- Dati strutturati per query efficienti

---

## Sviluppi Futuri

### Area Cliente (Non ancora implementato)
Le schede create dagli admin saranno visibili nell'area personale del cliente in modalità read-only, dove potranno:
- Visualizzare il piano alimentare giorno per giorno
- Vedere il programma di allenamento
- Guardare i video esecutivi
- Monitorare la data di scadenza

### Possibili Estensioni
1. Export PDF delle schede
2. Template predefiniti
3. Storico schede precedenti
4. Progress tracking
5. Note giornaliere del cliente
6. Notifiche di scadenza automatiche
7. Clone scheda per rinnovare
8. Statistiche di aderenza
