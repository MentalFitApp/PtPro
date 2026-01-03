// Test per verificare i valori dei secrets nella Cloud Function
const functions = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');

const r2SecretAccessKey = defineSecret('R2_SECRET_ACCESS_KEY');

exports.testSecrets = functions.https.onCall(
  { secrets: [r2SecretAccessKey] },
  async () => {
    const value = r2SecretAccessKey.value();
    return {
      secretLength: value.length,
      secretStart: value.substring(0, 8),
      secretEnd: value.substring(value.length - 8),
    };
  }
);
