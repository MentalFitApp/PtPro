import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./src/firebase.js";

async function recupera() {
  console.log("Recupero setter dai lead...");

  const leadSnap = await getDocs(collection(db, "leads"));
  const setterMap = {};

  leadSnap.forEach(doc => {
    const d = doc.data();
    if (d.collaboratoreId && d.collaboratoreNome) {
      setterMap[d.collaboratoreId] = {
        id: d.collaboratoreId,
        nome: d.collaboratoreNome.trim()
      };
    }
  });

  console.log(`Trovati ${Object.keys(setterMap).length} setter unici`);

  for (const [id, data] of Object.entries(setterMap)) {
    await setDoc(doc(db, "collaboratori", id), {
      nome: data.nome,
      ruolo: "setter",
      telefono: "",
      email: "",
      note: "Ricreato dai lead",
      createdAt: new Date()
    }, { merge: false });
    console.log(`Ricreato: ${data.nome}`);
  }

  console.log("TUTTI I COLLABORATORI SONO TORNATI!");
}

recupera().catch(console.error);
