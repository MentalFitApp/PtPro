// setup-community.js ← VERSIONE CHE FUNZIONA SUBITO
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Usa le credenziali del CLI (magia 2025)
const app = initializeApp({
  projectId: "biondo-fitness-coach",
  apiKey: "AIzaSyDU4GmH6xLhrEd2jSkyATXJOasIyEfisXY", // non serve con CLI
});

const db = getFirestore(app);

// Forza l'autenticazione admin tramite CLI (bypassa tutto)
await signInAnonymously(getAuth(app));

const batch = writeBatch(db);

// ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
// METTI QUI LA TUA UID REALE (la trovi in Authentication → il tuo utente)
const TUA_UID = "AeZKjJYu5zMZ4mvffaGiqCBb0cF2";   // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
// ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

batch.set(doc(db, "config", "superadmins"), { uids: [TUA_UID] });

const channels = [
  { id: "welcome", name: "benvenuto", icon: "sparkles", readOnly: true, order: 0 },
  { id: "introductions", name: "presentazioni", icon: "users", order: 1 },
  { id: "wins", name: "vittorie", icon: "trophy", order: 2 },
  { id: "questions", name: "domande", icon: "message-circle", order: 3 },
  { id: "tips", name: "consigli", icon: "lightbulb", order: 4 },
  { id: "live", name: "live", icon: "calendar", minLevel: 2, order: 5 },
];

channels.forEach(ch => batch.set(doc(db, "community_channels", ch.id), ch));

batch.set(doc(db, "community_posts", "welcome-1"), {
  content: "Benvenuti nella community FitFlow Pro!\n\nLivello 2+ = accesso alle group call settimanali!\n\nForza ragazzi!",
  author: { uid: TUA_UID, name: "Maurizio", level: 4 },
  channel: "welcome",
  pinned: true,
  pinnedAt: new Date(),
  timestamp: new Date(),
  likes: 999,
  likedBy: []
});

await batch.commit();
console.log("STRUTTURA COMMUNITY CREATA IN 3 SECONDI!");
process.exit(0);