#!/bin/bash

# Script per applicare la configurazione CORS al bucket R2 di Cloudflare
# Questo script usa AWS CLI (compatibile con R2)

echo "🔧 Applicazione CORS al bucket R2..."

# Leggi le credenziali dal file .env
source .env

# Verifica che le variabili siano impostate
if [ -z "$VITE_R2_ACCOUNT_ID" ] || [ -z "$VITE_R2_ACCESS_KEY_ID" ] || [ -z "$VITE_R2_SECRET_ACCESS_KEY" ] || [ -z "$VITE_R2_BUCKET_NAME" ]; then
  echo "❌ Errore: Variabili d'ambiente R2 non trovate nel file .env"
  exit 1
fi

# Configura endpoint R2
R2_ENDPOINT="https://${VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "📦 Bucket: $VITE_R2_BUCKET_NAME"
echo "🌐 Endpoint: $R2_ENDPOINT"
echo ""

# Controlla se AWS CLI è installato
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI non installato. Installazione in corso..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip
  sudo ./aws/install
  rm -rf aws awscliv2.zip
fi

# Applica CORS
echo "📤 Applicazione configurazione CORS da cors.json..."
aws s3api put-bucket-cors \
  --bucket "$VITE_R2_BUCKET_NAME" \
  --cors-configuration file://cors.json \
  --endpoint-url "$R2_ENDPOINT" \
  --profile r2 \
  2>/dev/null || \
AWS_ACCESS_KEY_ID="$VITE_R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$VITE_R2_SECRET_ACCESS_KEY" \
aws s3api put-bucket-cors \
  --bucket "$VITE_R2_BUCKET_NAME" \
  --cors-configuration file://cors.json \
  --endpoint-url "$R2_ENDPOINT"

if [ $? -eq 0 ]; then
  echo "✅ CORS applicato con successo!"
  echo ""
  echo "🔍 Verifica configurazione CORS..."
  AWS_ACCESS_KEY_ID="$VITE_R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$VITE_R2_SECRET_ACCESS_KEY" \
  aws s3api get-bucket-cors \
    --bucket "$VITE_R2_BUCKET_NAME" \
    --endpoint-url "$R2_ENDPOINT"
else
  echo "❌ Errore nell'applicazione del CORS"
  exit 1
fi
