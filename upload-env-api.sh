#!/bin/bash

echo "Per caricare le variabili d'ambiente, vai su:"
echo ""
echo "🌐 https://vercel.com/fitflows-projects/fit-flow/settings/environment-variables"
echo ""
echo "Copia e incolla queste variabili:"
echo ""
echo "=================================="
cat .env | grep -v "^#" | grep -v "^$"
echo "=================================="
