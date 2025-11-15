const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.getUidByEmail = functions.https.onCall(async (data, context) => {
  const email = data?.email?.trim().toLowerCase();

  console.log('EMAIL RICEVUTA NELLA FUNZIONE:', email);

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email mancante');
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('UTENTE TROVATO:', userRecord.uid);
    return { uid: userRecord.uid };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('UTENTE NON TROVATO:', email);
      return { uid: null };
    }
    console.error('ERRORE ADMIN SDK:', error);
    throw new functions.https.HttpsError('internal', 'Errore server');
  }
});