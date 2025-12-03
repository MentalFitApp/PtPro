// Script di debug per verificare i dati del profilo
// Copia e incolla nella console del browser (F12)

const tenantId = sessionStorage.getItem('tenantId');
const userId = firebase.auth().currentUser.uid;

console.log('TenantId:', tenantId);
console.log('UserId:', userId);

// Verifica cosa c'è in users
firebase.firestore()
  .doc(`tenants/${tenantId}/users/${userId}`)
  .get()
  .then(doc => {
    console.log('Dati in users collection:', doc.exists ? doc.data() : 'NON ESISTE');
  });

// Verifica cosa c'è in profiles (se esiste)
firebase.firestore()
  .doc(`tenants/${tenantId}/profiles/${userId}`)
  .get()
  .then(doc => {
    console.log('Dati in profiles collection:', doc.exists ? doc.data() : 'NON ESISTE');
  });

// Verifica Firebase Auth
console.log('Firebase Auth displayName:', firebase.auth().currentUser.displayName);
console.log('Firebase Auth email:', firebase.auth().currentUser.email);
