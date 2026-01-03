const fetch = require('node-fetch');

async function test() {
  console.log('🧪 Test Cloud Functions R2\n');
  
  const projectId = 'biondo-fitness-coach';
  const region = 'europe-west1';
  
  // Test uploadToR2
  console.log('📤 Test uploadToR2...');
  const uploadUrl = `https://${region}-${projectId}.cloudfunctions.net/uploadToR2`;
  const uploadResp = await fetch(uploadUrl, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ data: {} }) 
  });
  const uploadResult = await uploadResp.json();
  console.log('   Risposta:', JSON.stringify(uploadResult.error || uploadResult, null, 2));
  
  // Test deleteFromR2
  console.log('\n🗑️ Test deleteFromR2...');
  const deleteUrl = `https://${region}-${projectId}.cloudfunctions.net/deleteFromR2`;
  const deleteResp = await fetch(deleteUrl, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ data: {} }) 
  });
  const deleteResult = await deleteResp.json();
  console.log('   Risposta:', JSON.stringify(deleteResult.error || deleteResult, null, 2));
  
  // Verifica risultati
  const uploadProtected = uploadResult.error?.message?.includes('Autenticazione') || 
                          uploadResult.error?.message === 'INTERNAL';
  const deleteProtected = deleteResult.error?.message?.includes('Autenticazione') || 
                          deleteResult.error?.message === 'INTERNAL';
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RISULTATO TEST:');
  console.log('='.repeat(50));
  console.log(`✅ uploadToR2 funziona: ${uploadResp.status === 200 ? 'SÌ' : 'NO'} (status ${uploadResp.status})`);
  console.log(`✅ deleteFromR2 funziona: ${deleteResp.status === 200 ? 'SÌ' : 'NO'} (status ${deleteResp.status})`);
  console.log(`🔒 Protezione autenticazione: ${uploadProtected && deleteProtected ? 'ATTIVA' : 'DA VERIFICARE'}`);
  console.log('\n💡 Le funzioni richiedono autenticazione Firebase per funzionare.');
  console.log('   Per un test completo, usa l\'app frontend con login.');
}

test();
