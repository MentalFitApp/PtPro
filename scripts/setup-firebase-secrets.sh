#!/bin/bash
# Setup Firebase Secrets
# Questo script configura i secrets necessari per le Cloud Functions

echo "🔐 Configurazione Firebase Secrets"
echo "=================================="
echo ""
echo "Devi avere firebase-tools installato e aver fatto login con 'firebase login'"
echo ""

# Controlla se firebase è installato
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI non trovato. Installalo con: npm install -g firebase-tools"
    exit 1
fi

echo "📋 I seguenti secrets verranno configurati:"
echo "  - DAILY_API_KEY: API key per Daily.co (videochiamate)"
echo "  - FACEBOOK_APP_SECRET: Secret per Meta/Facebook OAuth"
echo "  - INSTAGRAM_CLIENT_ID: Client ID per Instagram OAuth"  
echo "  - INSTAGRAM_CLIENT_SECRET: Secret per Instagram OAuth"
echo ""

# DAILY_API_KEY
echo "🔑 Configurazione DAILY_API_KEY..."
echo "Inserisci la tua Daily.co API key (lascia vuoto per saltare):"
read -s DAILY_KEY
if [ -n "$DAILY_KEY" ]; then
    echo "$DAILY_KEY" | firebase functions:secrets:set DAILY_API_KEY
    echo "✅ DAILY_API_KEY configurato"
else
    echo "⏭️  Saltato"
fi

echo ""

# FACEBOOK_APP_SECRET
echo "🔑 Configurazione FACEBOOK_APP_SECRET..."
echo "Inserisci il tuo Facebook App Secret (lascia vuoto per saltare):"
read -s FB_SECRET
if [ -n "$FB_SECRET" ]; then
    echo "$FB_SECRET" | firebase functions:secrets:set FACEBOOK_APP_SECRET
    echo "✅ FACEBOOK_APP_SECRET configurato"
else
    echo "⏭️  Saltato"
fi

echo ""

# INSTAGRAM_CLIENT_ID
echo "🔑 Configurazione INSTAGRAM_CLIENT_ID..."
echo "Inserisci il tuo Instagram Client ID (lascia vuoto per saltare):"
read INSTA_ID
if [ -n "$INSTA_ID" ]; then
    echo "$INSTA_ID" | firebase functions:secrets:set INSTAGRAM_CLIENT_ID
    echo "✅ INSTAGRAM_CLIENT_ID configurato"
else
    echo "⏭️  Saltato"
fi

echo ""

# INSTAGRAM_CLIENT_SECRET  
echo "🔑 Configurazione INSTAGRAM_CLIENT_SECRET..."
echo "Inserisci il tuo Instagram Client Secret (lascia vuoto per saltare):"
read -s INSTA_SECRET
if [ -n "$INSTA_SECRET" ]; then
    echo "$INSTA_SECRET" | firebase functions:secrets:set INSTAGRAM_CLIENT_SECRET
    echo "✅ INSTAGRAM_CLIENT_SECRET configurato"
else
    echo "⏭️  Saltato"
fi

echo ""
echo "=================================="
echo "✅ Configurazione completata!"
echo ""
echo "📝 Per verificare i secrets configurati:"
echo "   firebase functions:secrets:access DAILY_API_KEY"
echo ""
echo "🚀 Per deployare le functions con i nuovi secrets:"
echo "   firebase deploy --only functions"
echo ""
echo "⚠️  IMPORTANTE: Ricorda di rimuovere i segreti dal file functions/.env"
echo "   e dal codice sorgente prima di committare!"
