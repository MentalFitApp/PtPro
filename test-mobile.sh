#!/bin/bash

# Script per testare le ottimizzazioni mobile di PtPro
# Autore: GitHub Copilot
# Data: 2025-11-19

echo "🚀 PtPro - Test Ottimizzazioni Mobile"
echo "======================================"
echo ""

# Controlla se npm è installato
if ! command -v npm &> /dev/null; then
    echo "❌ npm non trovato. Installa Node.js prima di continuare."
    exit 1
fi

echo "✅ npm trovato"
echo ""

# Controlla se le dipendenze sono installate
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
    echo ""
fi

echo "🔨 Build del progetto..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completata con successo!"
    echo ""
    echo "🌐 Avvio server di sviluppo..."
    echo ""
    echo "📱 Per testare su mobile:"
    echo "   1. Trova il tuo IP locale (ifconfig o ipconfig)"
    echo "   2. Connetti il telefono alla stessa rete WiFi"
    echo "   3. Apri il browser sul telefono"
    echo "   4. Vai a http://TUO_IP:5173"
    echo ""
    echo "💻 Per testare su desktop:"
    echo "   1. Apri http://localhost:5173"
    echo "   2. Premi F12 per aprire DevTools"
    echo "   3. Clicca sull'icona telefono per device mode"
    echo ""
    echo "📋 Leggi MOBILE_OPTIMIZATION_GUIDE.md per dettagli completi"
    echo ""
    echo "Avvio in corso..."
    sleep 2
    
    npm run dev
else
    echo ""
    echo "❌ Build fallita. Controlla gli errori sopra."
    exit 1
fi
