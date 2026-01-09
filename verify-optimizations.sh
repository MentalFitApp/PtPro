#!/bin/bash
# Script per verificare performance e ottimizzazioni

echo "🚀 Verifica Ottimizzazioni FitFlows"
echo "===================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Contatori
PASSED=0
FAILED=0
WARNINGS=0

# Test 1: Verifica esistenza file ottimizzati
echo "📁 Verifica file ottimizzati..."

FILES=(
  "src/hooks/useFirestoreOptimized.js"
  "src/hooks/useDataCache.jsx"
  "src/components/ui/VirtualList.jsx"
  "src/components/shared/SchedaOptimizer.jsx"
  "src/utils/prefetchManager.js"
  "src/pages/admin/AnalyticsOptimized.jsx"
  "src/pages/admin/Clients/ClientsOptimized.jsx"
  "PERFORMANCE-GUIDE.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $file - MANCANTE"
    ((FAILED++))
  fi
done

echo ""

# Test 2: Verifica import ottimizzati in App.jsx
echo "🔍 Verifica import prefetch in App.jsx..."
if grep -q "prefetchCriticalData" src/App.jsx; then
  echo -e "${GREEN}✓${NC} Prefetch implementato in App.jsx"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Prefetch non trovato in App.jsx"
  ((WARNINGS++))
fi

echo ""

# Test 3: Verifica lazy loading componenti
echo "⚡ Verifica lazy loading..."
LAZY_COUNT=$(grep -r "React.lazy" src/App.jsx | wc -l)
if [ $LAZY_COUNT -gt 20 ]; then
  echo -e "${GREEN}✓${NC} $LAZY_COUNT componenti lazy-loaded"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Solo $LAZY_COUNT componenti lazy-loaded"
  ((WARNINGS++))
fi

echo ""

# Test 4: Verifica ottimizzazioni Dashboard
echo "📊 Verifica ottimizzazioni Dashboard..."
if grep -q "useFirestoreSnapshot" src/pages/admin/DashboardDemo.jsx 2>/dev/null; then
  echo -e "${GREEN}✓${NC} DashboardDemo usa snapshot ottimizzato"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} DashboardDemo potrebbe non usare ottimizzazioni"
  ((WARNINGS++))
fi

if grep -q "BATCH_SIZE" src/pages/admin/DashboardDemo.jsx 2>/dev/null; then
  echo -e "${GREEN}✓${NC} DashboardDemo usa batch processing"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} DashboardDemo non usa batch processing"
  ((WARNINGS++))
fi

echo ""

# Test 5: Verifica indici Firestore
echo "🔥 Verifica indici Firestore..."
if [ -f "firestore.indexes.json" ]; then
  INDEX_COUNT=$(grep -c "collectionGroup" firestore.indexes.json)
  echo -e "${GREEN}✓${NC} firestore.indexes.json trovato ($INDEX_COUNT indici)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} firestore.indexes.json non trovato"
  ((FAILED++))
fi

echo ""

# Test 6: Verifica bundle size (npm build richiesto)
echo "📦 Analisi bundle size..."
if [ -d "dist" ] || [ -d "build" ]; then
  BUILD_DIR="dist"
  [ -d "build" ] && BUILD_DIR="build"
  
  BUNDLE_SIZE=$(du -sh $BUILD_DIR | cut -f1)
  echo -e "${GREEN}✓${NC} Build trovata: $BUNDLE_SIZE"
  ((PASSED++))
  
  # Conta chunk files (code splitting)
  CHUNK_COUNT=$(find $BUILD_DIR -name "*.js" -type f | wc -l)
  if [ $CHUNK_COUNT -gt 10 ]; then
    echo -e "${GREEN}✓${NC} Code splitting attivo ($CHUNK_COUNT chunks)"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} Code splitting limitato ($CHUNK_COUNT chunks)"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠${NC} Build non trovata (esegui 'npm run build')"
  ((WARNINGS++))
fi

echo ""

# Test 7: Verifica memoization patterns
echo "🧠 Verifica memoization patterns..."
USEMEMO_COUNT=$(grep -r "useMemo" src/pages --include="*.jsx" | wc -l)
USECALLBACK_COUNT=$(grep -r "useCallback" src/pages --include="*.jsx" | wc -l)

echo "  useMemo: $USEMEMO_COUNT occorrenze"
echo "  useCallback: $USECALLBACK_COUNT occorrenze"

if [ $USEMEMO_COUNT -gt 20 ] && [ $USECALLBACK_COUNT -gt 20 ]; then
  echo -e "${GREEN}✓${NC} Buon uso di memoization"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Memoization potrebbe essere migliorata"
  ((WARNINGS++))
fi

echo ""

# Test 8: Verifica virtualizzazione
echo "📜 Verifica virtualizzazione..."
if grep -q "VirtualList\|VirtualGrid" src/pages/admin/Clients/ClientsOptimized.jsx 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Virtualizzazione implementata in Clients"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Virtualizzazione non trovata in Clients"
  ((WARNINGS++))
fi

echo ""

# Test 9: Check per anti-patterns
echo "🚨 Check anti-patterns..."
ANTIPATTERNS=0

# Anti-pattern: getDocs senza limit
BAD_GETDOCS=$(grep -r "getDocs(getTenantCollection" src/pages --include="*.jsx" | grep -v "limit" | wc -l)
if [ $BAD_GETDOCS -gt 5 ]; then
  echo -e "${YELLOW}⚠${NC} Trovate $BAD_GETDOCS query senza limit()"
  ((ANTIPATTERNS++))
  ((WARNINGS++))
fi

# Anti-pattern: onSnapshot senza debounce
# (difficile da verificare automaticamente)

if [ $ANTIPATTERNS -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Nessun anti-pattern evidente"
  ((PASSED++))
fi

echo ""

# Test 10: Verifica documentazione
echo "📚 Verifica documentazione..."
if [ -f "PERFORMANCE-GUIDE.md" ]; then
  GUIDE_LINES=$(wc -l < PERFORMANCE-GUIDE.md)
  echo -e "${GREEN}✓${NC} Guida performance presente ($GUIDE_LINES righe)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Guida performance mancante"
  ((FAILED++))
fi

echo ""
echo "===================================="
echo "📊 RISULTATI"
echo "===================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

# Score finale
TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

if [ $SCORE -ge 80 ]; then
  echo -e "${GREEN}✓ Score: $SCORE% - OTTIMO!${NC}"
  exit 0
elif [ $SCORE -ge 60 ]; then
  echo -e "${YELLOW}⚠ Score: $SCORE% - BUONO (migliorabile)${NC}"
  exit 0
else
  echo -e "${RED}✗ Score: $SCORE% - NECESSARIO MIGLIORARE${NC}"
  exit 1
fi
