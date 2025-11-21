# 🔧 Fix Errori Indici Firebase

## Problema
Firebase Firestore richiede indici compositi per query complesse. Gli errori in console mostrano link diretti per crearli.

## ✅ Soluzione Rapida

### Opzione 1: Click sui link (Più veloce)
Nella console del browser, clicca su uno dei link che iniziano con:
```
https://console.firebase.google.com/v1/r/project/biondo-fitness-coach/firestore/indexes?create_composite=...
```

Questo ti porterà direttamente alla Firebase Console per creare l'indice automaticamente.

### Opzione 2: Crea manualmente (Alternativa)

1. Vai su [Firebase Console](https://npm .firebase.google.com/project/biondo-fitness-coach/firestore/indexes)

2. Crea questi indici:

#### Indice 1: notifications
- **Collection ID**: `notifications`
- **Fields**:
  - `userId` - Ascending
  - `createdAt` - Descending
- **Query scope**: Collection

#### Indice 2: community_posts  
- **Collection ID**: `community_posts`
- **Fields**:
  - `pinned` - Ascending
  - `pinnedAt` - Descending
- **Query scope**: Collection

## ⏱️ Tempo di creazione
Gli indici richiedono alcuni minuti per essere creati da Firebase (di solito 2-5 minuti).

## 📝 Nota
Ho già semplificato le query nel codice per ridurre la necessità di indici complessi, ma alcuni potrebbero essere ancora richiesti per funzionalità future (post pinned, notifiche ordinate, ecc.).

## 🎯 Risultato atteso
Dopo aver creato gli indici, gli errori in console scompariranno e tutte le query funzioneranno correttamente.
