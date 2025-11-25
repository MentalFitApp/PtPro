# 🏋️ Exercise Database - Multi-Tenant Architecture

## 🎯 Strategia

### 📚 **Database Universale (Global)**
- Collection: `platform_exercises` (root level, fuori da tenants)
- Accessibile da tutti i tenant
- Video/GIF professionali
- Manutenuto dalla piattaforma
- Non modificabile dai tenant

### 🎨 **Database Personalizzato (Per Tenant)**
- Collection: `tenants/{tenantId}/exercises`
- Video custom del brand
- Override esercizi globali
- Esercizi signature del coach
- Piena libertà di customizzazione

---

## 📊 SCHEMA FIRESTORE

```
Root Level:
├── platform_exercises/              ← DATABASE UNIVERSALE
│   ├── {exerciseId}/
│   │   ├── name, nameEn
│   │   ├── category, equipment, difficulty
│   │   ├── primaryMuscles, secondaryMuscles
│   │   ├── videoUrl (YouTube/ExerciseDB)
│   │   ├── gifUrl (se disponibile)
│   │   ├── instructions[], tips[], commonMistakes[]
│   │   ├── thumbnailUrl
│   │   └── isGlobal: true
│
└── tenants/{tenantId}/
    ├── exercises/                   ← DATABASE CUSTOM TENANT
    │   ├── {exerciseId}/
    │   │   ├── ... (stessi campi)
    │   │   ├── isCustom: true
    │   │   ├── overridesGlobal: "squat_barbell" (opzionale)
    │   │   └── videoUrl (R2/Vimeo del brand)
    │
    └── exercise_settings/           ← CONFIGURAZIONE
        └── config
            ├── useGlobalDatabase: true
            ├── allowCustomExercises: true
            └── preferCustomOverGlobal: true
```

---

## 🔄 LOGICA DI MERGE

### Quando Client Vede Lista Esercizi:

```javascript
async function getExercisesForTenant(tenantId) {
  // 1. Leggi configurazione tenant
  const config = await getExerciseConfig(tenantId);
  
  // 2. Carica esercizi globali (se abilitato)
  let globalExercises = [];
  if (config.useGlobalDatabase) {
    globalExercises = await getDocs(collection(db, 'platform_exercises'));
  }
  
  // 3. Carica esercizi custom del tenant
  const customExercises = await getDocs(
    collection(db, `tenants/${tenantId}/exercises`)
  );
  
  // 4. Merge con priorità
  const merged = mergeExercises(
    globalExercises, 
    customExercises,
    config.preferCustomOverGlobal
  );
  
  return merged;
}

function mergeExercises(global, custom, preferCustom) {
  const exerciseMap = new Map();
  
  // Prima aggiungi gli esercizi globali
  global.forEach(ex => {
    exerciseMap.set(ex.id, {
      ...ex,
      source: 'global',
      editable: false
    });
  });
  
  // Poi aggiungi/sovrascrivi con custom
  custom.forEach(ex => {
    if (ex.overridesGlobal && preferCustom) {
      // Override: sostituisci completamente
      exerciseMap.set(ex.overridesGlobal, {
        ...ex,
        source: 'custom',
        editable: true
      });
    } else {
      // Nuovo esercizio custom
      exerciseMap.set(ex.id, {
        ...ex,
        source: 'custom',
        editable: true
      });
    }
  });
  
  return Array.from(exerciseMap.values());
}
```

---

## 🎛️ UI ADMIN - Exercise Settings

### Pagina: `/admin/exercise-settings`

```jsx
<div className="exercise-settings">
  <h1>Configurazione Database Esercizi</h1>
  
  {/* Toggle Database Globale */}
  <SettingCard>
    <Toggle
      label="Usa Database Globale"
      description="Accedi a 150+ esercizi professionali con video"
      checked={useGlobalDatabase}
      onChange={handleToggleGlobal}
    />
  </SettingCard>
  
  {/* Toggle Esercizi Custom */}
  <SettingCard>
    <Toggle
      label="Abilita Esercizi Personalizzati"
      description="Crea i tuoi esercizi con video del brand"
      checked={allowCustomExercises}
      onChange={handleToggleCustom}
    />
  </SettingCard>
  
  {/* Priorità */}
  <SettingCard>
    <Toggle
      label="Priorità Esercizi Custom"
      description="Mostra prima i tuoi esercizi rispetto a quelli globali"
      checked={preferCustomOverGlobal}
      onChange={handleTogglePriority}
    />
  </SettingCard>
  
  {/* Stats */}
  <StatsGrid>
    <StatCard 
      title="Esercizi Globali Disponibili"
      value="150+"
      icon={<Globe />}
    />
    <StatCard 
      title="Esercizi Custom Creati"
      value={customCount}
      icon={<Star />}
    />
    <StatCard 
      title="Totale Visibile ai Clienti"
      value={totalCount}
      icon={<Dumbbell />}
    />
  </StatsGrid>
  
  {/* Azioni */}
  <ButtonGroup>
    <Button to="/admin/exercises/browse-global">
      📚 Sfoglia Database Globale
    </Button>
    <Button to="/admin/exercises/create">
      ➕ Crea Esercizio Custom
    </Button>
    <Button to="/admin/exercises/manage">
      ⚙️ Gestisci Esercizi Custom
    </Button>
  </ButtonGroup>
</div>
```

---

## 📱 UI CLIENT - Exercise Library

### Componente: ExerciseCard con Badge Source

```jsx
<ExerciseCard exercise={exercise}>
  <div className="header">
    <h3>{exercise.name}</h3>
    
    {/* Badge Source */}
    {exercise.source === 'global' ? (
      <Badge color="blue">
        <Globe size={12} />
        Database Globale
      </Badge>
    ) : (
      <Badge color="purple">
        <Star size={12} />
        {brandName} Signature
      </Badge>
    )}
  </div>
  
  <img src={exercise.thumbnailUrl} />
  
  <div className="info">
    <Tags>
      <Tag>{exercise.category}</Tag>
      <Tag>{exercise.equipment}</Tag>
    </Tags>
    
    {/* Se custom e override globale */}
    {exercise.overridesGlobal && (
      <Tooltip>
        💡 Versione personalizzata dal tuo coach
      </Tooltip>
    )}
  </div>
</ExerciseCard>
```

---

## 🎨 FLUSSO CREAZIONE ESERCIZIO CUSTOM

### Admin UI Flow:

```jsx
1. Admin va su "Crea Esercizio Custom"

2. Scelta Iniziale:
   [ ] Crea nuovo esercizio da zero
   [ ] Personalizza esercizio esistente (override)

3. Se Override:
   - Mostra lista esercizi globali
   - Seleziona quale sovrascrivere
   - Pre-compila form con dati globali
   - Cambia video/istruzioni/tips
   
4. Upload Video:
   - Drag & drop video file
   - Upload su R2/Vimeo
   - Oppure YouTube URL
   
5. Compila Dettagli:
   - Nome, categoria, equipment
   - Muscoli primari/secondari
   - Istruzioni step-by-step
   - Tips & common mistakes
   
6. Salva:
   - Va in tenants/{tenantId}/exercises/
   - Se override, campo overridesGlobal: "exercise_id"
```

---

## 🔐 FIRESTORE RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // DATABASE GLOBALE - Solo lettura per tutti autenticati
    match /platform_exercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if isPlatformCEO(); // Solo platform admin
    }
    
    // ESERCIZI CUSTOM PER TENANT
    match /tenants/{tenantId}/exercises/{exerciseId} {
      allow read: if request.auth != null && (
        isTenantClient(tenantId, request.auth.uid) ||
        isTenantCoach(tenantId) ||
        isTenantAdmin(tenantId)
      );
      
      allow create, update, delete: if (
        isTenantAdmin(tenantId) ||
        isTenantCoach(tenantId)
      );
    }
    
    // CONFIGURAZIONE ESERCIZI
    match /tenants/{tenantId}/exercise_settings/{docId} {
      allow read: if request.auth != null;
      allow write: if isTenantAdmin(tenantId);
    }
  }
}
```

---

## 🎬 VIDEO STRATEGY PER TENANT

### Opzioni Upload Video Custom:

#### 1. **Cloudflare R2** (Consigliato - Economico)
```javascript
Costi:
- Storage: $0.015/GB/mese
- Bandwidth: $0 (GRATIS per primi 10GB/mese, poi $0.01/GB)

Per 100 video (200MB ciascuno = 20GB):
- Storage: $0.30/mese
- Bandwidth: gratis se <10GB traffico/mese

Pro:
✅ Economico
✅ S3-compatible
✅ Già integrato in app
✅ CDN globale
```

#### 2. **Vimeo Pro** ($20/mese)
```javascript
- 5TB storage
- Privacy controls
- Player personalizzabile
- No pubblicità
- Embed illimitati

Pro:
✅ Player professionale
✅ Privacy granulare
✅ Analytics video
```

#### 3. **YouTube Unlisted**
```javascript
Pro:
✅ Gratis
✅ Hosting infinito

Contro:
⚠️ Branding YouTube
⚠️ Meno professionale
```

---

## 🚀 IMPLEMENTAZIONE PHASES

### Phase 1: Database Globale (2 giorni)
```
1. ✅ Creo JSON con 100 esercizi globali
2. ✅ Link YouTube per video dimostrativi
3. ✅ Script import in platform_exercises
4. ✅ Firestore rules per lettura
```

### Phase 2: UI Lettura (1 giorno)
```
1. Exercise Library component
2. Fetch da platform_exercises
3. Search & filters
4. Exercise detail modal
```

### Phase 3: Custom Exercises (2 giorni)
```
1. Admin UI per creare esercizi
2. Upload video su R2
3. Salvataggio in tenants/{id}/exercises
4. Override system
```

### Phase 4: Merge Logic (1 giorno)
```
1. Exercise settings page
2. Toggles configurazione
3. Merge global + custom
4. Priority logic
```

### Phase 5: Client Integration (1 giorno)
```
1. Client vede lista merged
2. Badge source (global/custom)
3. Filter per source
4. Favorite system
```

---

## 💾 ESEMPIO DOCUMENTO

### Platform Exercise (Globale):
```json
{
  "id": "squat_barbell",
  "name": "Squat con Bilanciere",
  "nameEn": "Barbell Back Squat",
  "category": "legs",
  "equipment": "barbell",
  "difficulty": "intermediate",
  "primaryMuscles": ["quadriceps", "glutes"],
  "secondaryMuscles": ["hamstrings", "core"],
  "videoUrl": "https://youtube.com/embed/...",
  "videoProvider": "youtube",
  "gifUrl": "https://exercisedb.p.rapidapi.com/...",
  "thumbnailUrl": "https://...",
  "instructions": [
    "Posiziona bilanciere su trapezi",
    "Piedi larghezza spalle",
    "Scendi controllato a 90°",
    "Risali spingendo sui talloni"
  ],
  "tips": [
    "Core sempre contratto",
    "Sguardo avanti",
    "Ginocchia allineate"
  ],
  "commonMistakes": [
    "Ginocchia interne",
    "Schiena curva",
    "Talloni sollevati"
  ],
  "isGlobal": true,
  "featured": true,
  "views": 0,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Custom Exercise (Tenant Override):
```json
{
  "id": "squat_barbell_biondo",
  "name": "Squat Metodo Biondo",
  "nameEn": "Biondo Method Squat",
  "overridesGlobal": "squat_barbell",
  "category": "legs",
  "equipment": "barbell",
  "difficulty": "intermediate",
  "primaryMuscles": ["quadriceps", "glutes"],
  "secondaryMuscles": ["hamstrings", "core"],
  "videoUrl": "https://r2.biondofitness.com/squat-custom.mp4",
  "videoProvider": "r2",
  "thumbnailUrl": "https://r2.biondofitness.com/squat-thumb.jpg",
  "instructions": [
    "Tecnica Biondo Fitness:",
    "Setup con stance larga",
    "Respira profondo prima di scendere",
    "Scendi 4 secondi, pausa 1 secondo",
    "Esplosivo in salita"
  ],
  "tips": [
    "Usa il nostro cue: 'Spingi il pavimento'",
    "Immagina di sederti su una sedia dietro",
    "Mantieni tensione costante"
  ],
  "commonMistakes": [
    "Setup troppo stretto",
    "Scendere troppo veloce",
    "Perdere tensione in basso"
  ],
  "coachNotes": "Versione signature con enfasi su controllo eccentrico",
  "isCustom": true,
  "brandExclusive": true,
  "createdBy": "coach_uid_123",
  "createdAt": "2024-03-20T15:30:00Z"
}
```

---

## 🎯 BENEFITS DI QUESTA ARCHITETTURA

### Per Platform (Te):
✅ Database globale si scale (aggiungi esercizi una volta, tutti i tenant ne beneficiano)
✅ Monetizzazione: "Premium exercise library" come feature a pagamento
✅ Qualità controllo centralizzato
✅ Analytics cross-tenant (quali esercizi più popolari)

### Per Tenant (Coach):
✅ Start veloce con database pronto
✅ Branding personalizzato con video custom
✅ Override selettivi (cambia solo ciò che serve)
✅ Mix & match (global + custom)

### Per Client:
✅ Libreria vasta sempre disponibile
✅ Video di qualità professionale
✅ Personalizzazione del brand preferito
✅ Consistency experience

---

## 📊 METRICHE & ANALYTICS

### Tracking Utilità:
```javascript
platform_exercises/{exerciseId}:
- views (globale cross-tenant)
- usedInPrograms (count)
- avgRating

tenants/{id}/exercises/{exerciseId}:
- views (per tenant)
- assignedToClients[]
- clientFavorites[]
- coachRating
```

### Dashboard Platform CEO:
- Top 20 esercizi più usati
- Tenant che usano solo global vs custom
- Video con più engagement
- Suggestions per nuovi esercizi da aggiungere

---

## 🔮 FUTURE ENHANCEMENTS

1. **AI Form Check**: Client carica video, AI analizza form vs video reference
2. **3D Interactive**: Rotazione modello 3D per vedere muscoli attivati
3. **Marketplace**: Tenant possono vendere i loro exercise packs ad altri tenant
4. **Progression Paths**: "Beginner → Intermediate → Advanced" auto-suggested
5. **Equipment Filter Smart**: Basato su attrezzatura dichiarata in palestra tenant

---

## ✅ NEXT STEPS

Vuoi che:
1. ✅ Creo il JSON con 100 esercizi globali + YouTube links?
2. ✅ Implemento Exercise Library UI con merge logic?
3. ✅ Creo Admin UI per custom exercises?
4. ✅ Script import in platform_exercises?

**Dimmi da dove parto!** 💪
