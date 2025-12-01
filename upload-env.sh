#!/bin/bash

# Script per caricare variabili d'ambiente su Vercel
# Usa: ./upload-env.sh [project-name]

PROJECT_NAME="${1:-ptpro}"

echo "🔧 Caricamento variabili d'ambiente su Vercel..."
echo "📦 Progetto: $PROJECT_NAME"
echo ""

# Leggi il file .env e carica ogni variabile
while IFS='=' read -r key value; do
  # Salta commenti e righe vuote
  if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
    continue
  fi
  
  # Rimuovi spazi e quotes
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs | sed 's/^["'\'']//' | sed 's/["'\'']$//')
  
  if [[ ! -z $key ]] && [[ ! -z $value ]]; then
    echo "⬆️  Caricamento: $key"
    vercel env add "$key" production --scope=fitflows-projects <<< "$value" 2>&1 | grep -v "Error: The variable" || true
    vercel env add "$key" preview --scope=fitflows-projects <<< "$value" 2>&1 | grep -v "Error: The variable" || true
    vercel env add "$key" development --scope=fitflows-projects <<< "$value" 2>&1 | grep -v "Error: The variable" || true
  fi
done < .env

echo ""
echo "✅ Caricamento completato!"
echo "🔄 Ora fai il redeploy del progetto su Vercel"
