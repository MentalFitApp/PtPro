#!/usr/bin/env node

/**
 * Script per mostrare le credenziali di test
 */

console.log('🧪 CREDENZIALI DI TEST - FitFlows App\n');
console.log('=' .repeat(50));

const credentials = [
  {
    role: 'ADMIN',
    email: 'test-admin@fitflowsapp.com',
    password: 'TestAdmin2026!',
    description: 'Gestione completa del business'
  },
  {
    role: 'CLIENTE',
    email: 'test-client@fitflowsapp.com',
    password: 'TestClient2026!',
    description: 'Area cliente con check-in'
  },
  {
    role: 'COLLABORATORE',
    email: 'test-collaboratore@fitflowsapp.com',
    password: 'TestCollab2026!',
    description: 'Area dipendente'
  },
  {
    role: 'COACH',
    email: 'test-coach@fitflowsapp.com',
    password: 'TestCoach2026!',
    description: 'Gestione clienti e schede'
  }
];

credentials.forEach(cred => {
  console.log(`\n👤 ${cred.role}`);
  console.log(`   Email: ${cred.email}`);
  console.log(`   Password: ${cred.password}`);
  console.log(`   Descrizione: ${cred.description}`);
});

console.log('\n' + '=' .repeat(50));
console.log('🌐 URL App: http://localhost:5173');
console.log('📖 Istruzioni complete: TESTING-INSTRUCTIONS.md');
console.log('🚀 Avvia con: npm run dev');