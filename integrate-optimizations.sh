#!/bin/bash
# Script per integrare gradualmente le ottimizzazioni

echo "🔄 Integrazione Ottimizzazioni FitFlows"
echo "======================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Backup directory
BACKUP_DIR="backups/pre-optimization-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}Questo script ti guiderà nell'integrazione delle ottimizzazioni.${NC}"
echo ""

# Step 1: Backup
echo -e "${YELLOW}Step 1: Backup files${NC}"
read -p "Vuoi creare un backup dei file originali? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  mkdir -p "$BACKUP_DIR"
  
  # Backup files che verranno modificati
  cp src/App.jsx "$BACKUP_DIR/"
  cp src/pages/admin/Clients.jsx "$BACKUP_DIR/" 2>/dev/null || true
  
  echo -e "${GREEN}✓${NC} Backup creato in $BACKUP_DIR"
else
  echo "Backup saltato"
fi

echo ""

# Step 2: Integra Clients
echo -e "${YELLOW}Step 2: Integra Clients Ottimizzato${NC}"
echo "Questo sostituirà la pagina Clients con la versione ottimizzata."
read -p "Procedere? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Modifica App.jsx per usare ClientsOptimized
  if grep -q "import('./pages/admin/Clients')" src/App.jsx; then
    sed -i.bak "s|import('./pages/admin/Clients')|import('./pages/admin/Clients/ClientsOptimized')|g" src/App.jsx
    echo -e "${GREEN}✓${NC} App.jsx aggiornato per usare ClientsOptimized"
  else
    echo -e "${YELLOW}⚠${NC} Pattern non trovato in App.jsx, modifica manualmente"
  fi
else
  echo "Integrazione Clients saltata"
fi

echo ""

# Step 3: Integra Analytics
echo -e "${YELLOW}Step 3: Integra Analytics Ottimizzato${NC}"
echo "Questo sostituirà la pagina Analytics con la versione pre-aggregata."
read -p "Procedere? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if grep -q "import('./pages/admin/Analytics')" src/App.jsx; then
    sed -i.bak "s|import('./pages/admin/Analytics')|import('./pages/admin/AnalyticsOptimized')|g" src/App.jsx
    echo -e "${GREEN}✓${NC} App.jsx aggiornato per usare AnalyticsOptimized"
  else
    echo -e "${YELLOW}⚠${NC} Pattern non trovato in App.jsx, modifica manualmente"
  fi
else
  echo "Integrazione Analytics saltata"
fi

echo ""

# Step 4: Cleanup backup files
if [ -f "src/App.jsx.bak" ]; then
  rm src/App.jsx.bak
fi

# Step 5: Test
echo -e "${YELLOW}Step 4: Verifica${NC}"
echo "Eseguo verifica ottimizzazioni..."
./verify-optimizations.sh

echo ""

# Step 6: Istruzioni finali
echo "======================================="
echo -e "${GREEN}✓ Integrazione completata!${NC}"
echo ""
echo -e "${BLUE}Prossimi step:${NC}"
echo "1. Testa l'app: npm run dev"
echo "2. Verifica che Clients e Analytics funzionino"
echo "3. Controlla performance in DevTools"
echo "4. Leggi TODO-QUERY-OPTIMIZATION.md per fixare le query"
echo ""
echo -e "${YELLOW}Per rollback:${NC}"
echo "cp $BACKUP_DIR/* src/"
echo ""
