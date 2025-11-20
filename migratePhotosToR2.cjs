#!/usr/bin/env node
/**
 * Automatic Migration Script: Firebase Storage -> Cloudflare R2
 *
 * Features:
 * - Scans Firestore: clients, each client's anamnesi (initial) and checks
 * - Detects photoURLs needing migration (Firebase relative paths or firebase URLs)
 * - Downloads each image from Firebase Storage public endpoint
 * - Uploads to Cloudflare R2 (S3-compatible) bucket
 * - Updates Firestore docs with new R2 URLs and sets migratedAt timestamp
 * - Skips already migrated URLs (those containing R2 public base)
 * - Supports dry-run mode (no writes, just report) via --dry flag
 * - Resilient: continues on individual file errors, logs summary at end
 *
 * Requirements:
 * - ENV: VITE_API_KEY, VITE_AUTH_DOMAIN, VITE_PROJECT_ID, VITE_STORAGE_BUCKET, VITE_MESSAGING_SENDER_ID,
 *        VITE_APP_ID, (optional VITE_MEASUREMENT_ID), ADMIN_EMAIL, ADMIN_PASSWORD,
 *        VITE_R2_ACCOUNT_ID, VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, VITE_R2_BUCKET_NAME, VITE_R2_PUBLIC_URL
 * - Node >= 18 (global fetch available)
 *
 * Usage:
 *   Dry run:   node migratePhotosToR2.cjs --dry
 *   Execute:   node migratePhotosToR2.cjs --run
 *   Verbose:   node migratePhotosToR2.cjs --run --verbose
 */

const dotenv = require('dotenv');
dotenv.config();

const args = process.argv.slice(2);
const isDry = args.includes('--dry');
const isRun = args.includes('--run');
const verbose = args.includes('--verbose');
if (!isDry && !isRun) {
  console.log('\nSpecify one: --dry (preview) or --run (execute). Example:');
  console.log('  node migratePhotosToR2.cjs --dry');
  console.log('  node migratePhotosToR2.cjs --run');
  process.exit(1);
}

// Validate required environment variables
const requiredEnv = [
  'VITE_API_KEY','VITE_AUTH_DOMAIN','VITE_PROJECT_ID','VITE_STORAGE_BUCKET','VITE_MESSAGING_SENDER_ID','VITE_APP_ID',
  'ADMIN_EMAIL','ADMIN_PASSWORD','VITE_R2_ACCOUNT_ID','VITE_R2_ACCESS_KEY_ID','VITE_R2_SECRET_ACCESS_KEY','VITE_R2_BUCKET_NAME','VITE_R2_PUBLIC_URL'
];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID || undefined,
};

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc } = require('firebase/firestore');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY
  }
});

const R2_PUBLIC = process.env.VITE_R2_PUBLIC_URL.replace(/\/$/, '');
const BUCKET = process.env.VITE_R2_BUCKET_NAME;
const FIREBASE_BUCKET = process.env.VITE_STORAGE_BUCKET;

function isAlreadyR2(url) {
  if (!url) return false;
  return url.startsWith(R2_PUBLIC) || /r2\.dev/.test(url);
}
function isFirebaseFullURL(url) {
  return /firebasestorage\.googleapis\.com/.test(url);
}
function buildFirebaseDownloadURL(path) {
  // path relative: encode slashes
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
}

async function downloadFirebaseFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

function makeR2Key(userId, segment, type) {
  return `${segment}/${userId}/${type}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
}

async function uploadToR2(buffer, contentType, key) {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read' // though R2 may ignore ACLs; ensure bucket is public
  }));
  return `${R2_PUBLIC}/${key}`;
}

async function migratePhotoGroup(photoURLs, userId, segment) {
  if (!photoURLs || typeof photoURLs !== 'object') return { migrated: false, updated: photoURLs, details: [] };

  const updated = { ...photoURLs };
  const details = [];
  let changed = false;

  for (const [type, value] of Object.entries(photoURLs)) {
    if (!value) { details.push({ type, status: 'skip-empty' }); continue; }
    if (isAlreadyR2(value)) { details.push({ type, status: 'skip-r2' }); continue; }

    let downloadURL = value;
    if (!isFirebaseFullURL(value)) {
      // assume relative path
      downloadURL = buildFirebaseDownloadURL(value);
    }

    try {
      const { buffer, contentType } = await downloadFirebaseFile(downloadURL);
      const key = makeR2Key(userId, segment, type);
      const newURL = isDry ? `(dry) ${R2_PUBLIC}/${key}` : await uploadToR2(buffer, contentType, key);
      updated[type] = newURL;
      changed = true;
      details.push({ type, status: 'migrated', from: value, to: newURL });
      if (verbose) console.log(`  [${segment}] ${type} migrated -> ${newURL}`);
    } catch (err) {
      details.push({ type, status: 'error', from: value, error: err.message });
      console.error(`  ERROR migrating ${segment}/${type} for user ${userId}:`, err.message);
    }
  }

  return { migrated: changed, updated, details };
}

async function main() {
  console.log(`\n=== Firebase -> R2 Migration (${isDry ? 'DRY RUN' : 'EXECUTION'}) ===`);
  console.log('Signing in as admin user...');
  await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  console.log('Auth OK');

  const clientsSnap = await getDocs(collection(db, 'clients'));
  console.log(`Found ${clientsSnap.size} clients.`);

  const summary = { clients: 0, anamnesiMigrated: 0, checksMigrated: 0, filesMigrated: 0, errors: 0 };

  for (const clientDoc of clientsSnap.docs) {
    const clientId = clientDoc.id;
    summary.clients++;
    if (verbose) console.log(`\n--- Client ${clientId} ---`);

    // Anamnesi
    const anamnesiRef = doc(db, 'clients', clientId, 'anamnesi', 'initial');
    const anamnesiSnap = await getDoc(anamnesiRef);
    if (anamnesiSnap.exists()) {
      const aData = anamnesiSnap.data();
      if (aData.photoURLs) {
        const result = await migratePhotoGroup(aData.photoURLs, clientId, 'anamnesi_photos');
        summary.filesMigrated += result.details.filter(d => d.status === 'migrated').length;
        summary.errors += result.details.filter(d => d.status === 'error').length;
        if (result.migrated) {
          summary.anamnesiMigrated++;
          if (!isDry) {
            await updateDoc(anamnesiRef, { photoURLs: result.updated, migratedAt: new Date() });
          }
        }
      }
    }

    // Checks
    const checksCol = collection(db, 'clients', clientId, 'checks');
    const checksSnap = await getDocs(checksCol);
    for (const checkDoc of checksSnap.docs) {
      const cData = checkDoc.data();
      if (cData.photoURLs) {
        const result = await migratePhotoGroup(cData.photoURLs, clientId, 'check_photos');
        summary.filesMigrated += result.details.filter(d => d.status === 'migrated').length;
        summary.errors += result.details.filter(d => d.status === 'error').length;
        if (result.migrated) {
          summary.checksMigrated++;
          if (!isDry) {
            await updateDoc(checkDoc.ref, { photoURLs: result.updated, migratedAt: new Date() });
          }
        }
      }
    }
  }

  console.log('\n=== Migration Summary ===');
  console.table({
    Clients: summary.clients,
    AnamnesiDocsUpdated: summary.anamnesiMigrated,
    CheckDocsUpdated: summary.checksMigrated,
    FilesMigrated: summary.filesMigrated,
    Errors: summary.errors,
    Mode: isDry ? 'DRY' : 'EXECUTED'
  });
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
