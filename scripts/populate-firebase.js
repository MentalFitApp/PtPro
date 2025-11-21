import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function populate() {
  console.log('Popolando FitFlow...');

  await setDoc(doc(db, 'users', 'demo1'), {
    uid: 'demo1',
    displayName: 'Marco Coach',
    level: 5,
    levelName: 'Legend',
    bio: 'Fondatore FitFlow Pro',
    lastActive: new Date()
  });

  await addDoc(collection(db, 'community_posts'), {
    title: 'Benvenuto in FitFlow Pro!',
    content: 'La community è ufficialmente aperta!',
    channel: 'vittorie',
    author: { uid: 'demo1', name: 'Marco Coach' },
    likes: 99,
    pinned: true,
    pinnedAt: new Date(),
    timestamp: new Date(),
    isApproved: true
  });

  console.log('FATTO! Aspetta 2 minuti e aggiorna la pagina');
}

populate().catch(console.error);
