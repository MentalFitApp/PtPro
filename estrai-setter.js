import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/firebase.js";
import fs from "fs";

async function estraiSetter() {
  console.log("Leggo i lead...");
  const snapshot = await getDocs(collection(db, "leads"));
  const setterMap = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const id = data.collaboratoreId;
    const nome = data.collaboratoreNome || "Sconosciuto";

    if (id && id.trim()) {
      if (!setterMap[id]) {
        setterMap[id] = { id, nome: nome.trim(), count: 0 };
      }
      setterMap[id].count++;
    }
  });

  const setterList = Object.values(setterMap);
  fs.writeFileSync("setter-da-lead.json", JSON.stringify(setterList, null, 2));
  console.log("SETTER TROVATI:");
  setterList.forEach(s => {
    console.log(`• ${s.nome} (ID: ${s.id}) → ${s.count} lead`);
  });
  console.log("\nFile salvato: setter-da-lead.json");
}

estraiSetter().catch(console.error);
