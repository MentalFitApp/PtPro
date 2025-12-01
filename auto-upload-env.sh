#!/bin/bash

# Script automatico per caricare env su Vercel via API

# Leggi il token
TOKEN=$(cat /home/codespace/.local/share/com.vercel.cli/auth.json 2>/dev/null | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Token Vercel non trovato"
  exit 1
fi

PROJECT_ID="prj_rCj6hEqAfMfpQ6zTEcqBDsaE5UE7"  # ID progetto fit-flow
TEAM_ID="team_NNAYshYI1l9BpFPDeLNwLhPb"      # ID team fitflows-projects

echo "🚀 Caricamento automatico variabili su Vercel..."
echo ""

SUCCESS=0
FAILED=0

while IFS='=' read -r key value; do
  # Salta righe vuote e commenti
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  
  # Pulisci key e value
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs | sed 's/#.*$//' | xargs)
  
  if [[ -n "$key" && -n "$value" ]]; then
    echo "📤 Caricamento: $key"
    
    # Carica per ogni environment
    for ENV in "production" "preview" "development"; do
      RESPONSE=$(curl -s -X POST \
        "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
          \"key\": \"$key\",
          \"value\": \"$value\",
          \"type\": \"encrypted\",
          \"target\": [\"$ENV\"]
        }")
      
      if echo "$RESPONSE" | grep -q "error"; then
        if echo "$RESPONSE" | grep -q "already exists"; then
          echo "  ⚠️  $ENV: già esistente (saltato)"
        else
          echo "  ❌ $ENV: errore - $(echo $RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
          ((FAILED++))
        fi
      else
        echo "  ✅ $ENV: caricato"
        ((SUCCESS++))
      fi
    done
    echo ""
  fi
done < .env.vercel

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Completato: $SUCCESS variabili caricate"
if [ $FAILED -gt 0 ]; then
  echo "⚠️  Falliti: $FAILED"
fi
echo ""
echo "🔄 Ora triggera un redeploy su Vercel"
