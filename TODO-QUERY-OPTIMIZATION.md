# 🎯 Checklist Query Firestore da Ottimizzare

## ⚠️ Query Senza Limit (17 trovate)

Queste query dovrebbero essere riviste per aggiungere `limit()` o paginazione:

### Priorità ALTA (pagine spesso visitate)

1. **Login.jsx** - Query clienti/collaboratori per email
   ```javascript
   // PRIMA
   getDocs(query(clientsRef, where('email', '==', email)))
   
   // DOPO
   getDocs(query(clientsRef, where('email', '==', email), limit(1)))
   ```

2. **CoachDashboard** - Snapshot clienti
   ```javascript
   // PRIMA
   getDocs(getTenantCollection(db, 'clients'))
   
   // DOPO
   getDocs(query(getTenantCollection(db, 'clients'), limit(100)))
   // Oppure usa useFirestorePagination per paginare
   ```

3. **Updates/CoachUpdates** - Query checks/anamnesi per cliente
   ```javascript
   // PRIMA
   getDocs(getTenantSubcollection(db, 'clients', clientId, 'checks'))
   
   // DOPO  
   getDocs(query(
     getTenantSubcollection(db, 'clients', clientId, 'checks'),
     orderBy('createdAt', 'desc'),
     limit(10)
   ))
   ```

### Priorità MEDIA

4. **AlimentazioneAllenamento** - Query clienti
5. **Notifications** - Query clients e collaboratori
6. **SchedaAlimentazione** - Query presets, alimenti tenant e global
7. **SchedaAllenamento** - Query presets, workouts
8. **Chat** - Query chats
9. **IntegrationsHub** - Query integrations

### Priorità BASSA (pagine admin/platform)

10. **PlatformReports** - Query tenants, users, clients
11. **BackupRecovery** - Query collections per backup
12. **TenantDeepDive** - Query users per tenant
13. **Collaboratori** - Query rates, checks
14. **FoodAnalytics** - Query schede, alimenti
15. **Community** - Query posts, comments

---

## 🔧 Template di Correzione

### Pattern 1: Singolo Documento (Email Lookup)
```javascript
// PRIMA
const snap = await getDocs(
  query(collection, where('email', '==', email))
);

// DOPO
const snap = await getDocs(
  query(collection, where('email', '==', email), limit(1))
);
```

### Pattern 2: Lista per UI
```javascript
// PRIMA
const snap = await getDocs(getTenantCollection(db, 'clients'));

// DOPO - Con limit ragionevole
const snap = await getDocs(
  query(getTenantCollection(db, 'clients'), limit(100))
);

// OPPURE - Con paginazione
const { data } = useFirestorePagination(
  getTenantCollection(db, 'clients'),
  { pageSize: 20 }
);
```

### Pattern 3: Subcollection (Checks, Anamnesi, etc)
```javascript
// PRIMA
const checksSnap = await getDocs(
  getTenantSubcollection(db, 'clients', clientId, 'checks')
);

// DOPO
const checksSnap = await getDocs(
  query(
    getTenantSubcollection(db, 'clients', clientId, 'checks'),
    orderBy('createdAt', 'desc'),
    limit(20) // Ultimi 20 check
  )
);
```

### Pattern 4: Admin/Platform (Può essere più alto)
```javascript
// PRIMA
const tenantsSnap = await getDocs(collection(db, 'tenants'));

// DOPO
const tenantsSnap = await getDocs(
  query(collection(db, 'tenants'), limit(500))
);
// Platform admin può vedere più dati, ma comunque con limit
```

---

## 🚀 Script di Correzione Automatica

Puoi usare questo script per trovare e correggere automaticamente alcuni pattern:

```bash
#!/bin/bash
# fix-queries.sh

# Trova tutte le query getDocs senza limit
echo "🔍 Ricerca query senza limit..."

# Pattern da cercare
PATTERN='getDocs\(getTenantCollection\(db,'

# File da escludere (già ottimizzati)
EXCLUDE='DashboardDemo.jsx|ClientsOptimized.jsx|AnalyticsOptimized.jsx'

# Trova matches
grep -rn "$PATTERN" src/pages --include="*.jsx" | grep -v "limit" | grep -Ev "$EXCLUDE"

echo ""
echo "💡 Suggerimento:"
echo "Aggiungi query() e limit() a queste query"
echo "Esempio: getDocs(query(getTenantCollection(...), limit(100)))"
```

---

## 📊 Limiti Consigliati per Tipo

| Tipo Query | Limit Suggerito | Note |
|------------|----------------|------|
| Email lookup | 1 | Dovrebbe essere univoca |
| Lista clienti UI | 100 | O paginazione |
| Checks recenti | 10-20 | Ultimi check |
| Anamnesi | 10 | Ultime anamnesi |
| Payments/Rates | 50 | Storia pagamenti |
| Posts community | 20 | Con paginazione |
| Platform admin | 500 | Admin può vedere più |
| Global foods | 1000 | Con cache lunga |
| Exercises | 500 | Con cache lunga |

---

## ✅ Dopo le Correzioni

1. Esegui di nuovo `./verify-optimizations.sh`
2. Dovresti vedere 0 warning per query senza limit
3. Testa le pagine modificate per assicurarti che funzionino
4. Monitora performance con DevTools

---

## 🎓 Best Practice

1. **Sempre usa limit()** tranne per:
   - Conteggi (usa `getCountFromServer()`)
   - Aggregazioni specifiche

2. **Preferisci paginazione** per liste lunghe:
   ```javascript
   useFirestorePagination(baseQuery, { pageSize: 20 })
   ```

3. **Usa cache** per dati che cambiano poco:
   ```javascript
   useCachedQuery('foods', fetchFoods, { 
     staleTime: 10 * 60 * 1000 
   })
   ```

4. **Batch processa** query multiple:
   ```javascript
   for (let i = 0; i < items.length; i += 10) {
     const batch = items.slice(i, i + 10);
     await Promise.all(batch.map(fetchForItem));
   }
   ```

---

**Questo documento sarà rimosso una volta completate le correzioni!**
