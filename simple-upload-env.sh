#!/bin/bash

echo "🚀 Caricamento automatico variabili d'ambiente su Vercel"
echo ""

# Conta totale variabili
TOTAL=$(cat .env.vercel | wc -l)
CURRENT=0

echo "📊 Trovate $TOTAL variabili da caricare"
echo ""

while IFS='=' read -r key value; do
  ((CURRENT++))
  
  if [[ -n "$key" && -n "$value" ]]; then
    echo "[$CURRENT/$TOTAL] 📤 $key"
    
    # Prova production
    echo "$value" | vercel env add "$key" production --scope=fitflows-projects --force 2>&1 | grep -v "Error: Your codebase" | head -3
    
    # Prova preview  
    echo "$value" | vercel env add "$key" preview --scope=fitflows-projects --force 2>&1 | grep -v "Error: Your codebase" | head -3
    
    # Prova development
    echo "$value" | vercel env add "$key" development --scope=fitflows-projects --force 2>&1 | grep -v "Error: Your codebase" | head -3
    
    echo ""
  fi
done < .env.vercel

echo "✅ Processo completato!"
echo ""
echo "🌐 Verifica su: https://vercel.com/fitflows-projects/fit-flow/settings/environment-variables"
echo "🔄 Fai redeploy: https://vercel.com/fitflows-projects/fit-flow"
