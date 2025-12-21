const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  const tenants = await db.collection('tenants').get();
  for (const tenant of tenants.docs) {
    const ig = await db.doc('tenants/' + tenant.id + '/integrations/instagram').get();
    if (ig.exists) {
      console.log('\n=== Tenant:', tenant.id, '===');
      const data = ig.data();
      console.log('enabled:', data.enabled);
      console.log('has access_token:', !!data.access_token);
      console.log('instagram_user_id:', data.instagram_user_id);
      console.log('instagram_username:', data.instagram_username);
      console.log('facebook_page_id:', data.facebook_page_id);
      console.log('connected_at:', data.connected_at);
    }
  }
}
check().then(() => process.exit(0));
