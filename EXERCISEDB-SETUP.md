# 🔑 SETUP EXERCISEDB API

## 📝 Come Ottenere API Key (GRATIS per Test)

### Step 1: Registrati su RapidAPI
1. Vai su: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
2. Clicca **"Sign Up"** (in alto a destra)
3. Registrati con email o Google

### Step 2: Subscribe al Piano Gratuito
1. Sulla pagina ExerciseDB, clicca **"Subscribe to Test"**
2. Scegli piano **"Basic"** (GRATIS)
   - ✅ 100 requests/mese gratis
   - ✅ Accesso completo a 1300+ esercizi
3. Conferma subscription

### Step 3: Copia API Key
1. Vai su tab **"Endpoints"**
2. Nella sezione **Code Snippets** (destra), vedrai:
   ```
   X-RapidAPI-Key: xxxxxxxxxxxxxxxxxxxxx
   ```
3. **Copia quella chiave**

### Step 4: Configura nel Progetto
```bash
# Export API key come variabile ambiente
export EXERCISEDB_API_KEY="tua-chiave-api-qui"

# Verifica che sia settata
echo $EXERCISEDB_API_KEY
```

### Step 5: Esegui Import
```bash
node scripts/import-from-exercisedb.mjs
```

---

## 💰 Piani Disponibili

| Piano | Costo | Requests | Note |
|-------|-------|----------|------|
| **Basic** | **GRATIS** | 100/mese | Perfetto per import iniziale |
| **Pro** | $9/mese | 10,000/mese | Upgrade se serve |
| **Ultra** | $30/mese | 100,000/mese | Per app production |

---

## 📊 Cosa Importerai

- 🎁 **1300+ esercizi** con GIF animati
- 🎬 **GIF professionali** (hosted da loro)
- 💪 **Tutti i gruppi muscolari**
- 🏋️ **Tutti gli attrezzi**
- 📝 **Istruzioni in inglese**

---

## 🚀 Dopo l'Import

✅ GIF animati dentro l'app
✅ Nessun costo storage (hosted da ExerciseDB)
✅ Loading veloce
✅ Professionale

**Nota**: Dopo il primo import, non serve più chiamare l'API.
I GIF URL rimangono nel tuo database e funzionano sempre! 🎉
