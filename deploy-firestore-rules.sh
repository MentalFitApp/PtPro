#!/bin/bash
# Script per deployare le regole Firestore

echo "🔥 Deploying Firestore Rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Regole Firestore deployate con successo!"
    echo "📝 Le nuove regole includono:"
    echo "   - Permessi per admin di gestire communityChannels"
    echo "   - Create, Update, Delete per canali community"
else
    echo "❌ Errore durante il deploy delle regole"
    echo "💡 Assicurati di:"
    echo "   1. Essere autenticato: firebase login"
    echo "   2. Aver selezionato il progetto: firebase use biondo-fitness-coach"
fi
