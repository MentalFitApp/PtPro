
// --- Nuova versione avanzata stile Skool ---
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UsersRound, Settings, MessageCircle, Layers, Shield, Award } from "lucide-react";

const SECTIONS = [
  { key: "general", label: "Generali", icon: <Settings size={20} /> },
  { key: "onboarding", label: "Onboarding", icon: <Layers size={20} /> },
  { key: "levels", label: "Livelli", icon: <Award size={20} /> },
  { key: "channels", label: "Canali", icon: <UsersRound size={20} /> },
  { key: "moderation", label: "Moderazione", icon: <Shield size={20} /> },
  { key: "chat", label: "Chat", icon: <MessageCircle size={20} /> },
];

export default function CommunitySettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      // Verifica permessi superadmin
      const adminDoc = await getDoc(doc(db, "roles/superadmins", user.uid));
      setIsSuperAdmin(adminDoc.exists());

      // Carica impostazioni community
      const settingsDoc = await getDoc(doc(db, "settings", "community"));
      setSettings(settingsDoc.exists() ? settingsDoc.data() : {});
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // Salva impostazioni
  const handleSave = async (sectionKey, data) => {
    if (!isSuperAdmin) return;
    const newSettings = { ...settings, [sectionKey]: data };
    await setDoc(doc(db, "settings", "community"), newSettings, { merge: true });
    setSettings(newSettings);
  };

  if (loading) return <div className="flex items-center justify-center h-96">Caricamento...</div>;
  if (!isSuperAdmin)
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Accesso negato: solo i SuperAdmin possono gestire le impostazioni della Community.
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar stile Skool */}
      <aside className="w-64 bg-white border-r flex flex-col py-8 px-4">
        <h2 className="text-xl font-bold mb-8 text-blue-700">Impostazioni Community</h2>
        <nav className="flex flex-col gap-2">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeSection === section.key
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sezioni impostazioni */}
      <main className="flex-1 p-10">
        {activeSection === "general" && (
          <GeneralSettings data={settings?.general} onSave={(data) => handleSave("general", data)} />
        )}
        {activeSection === "onboarding" && (
          <OnboardingSettings data={settings?.onboarding} onSave={(data) => handleSave("onboarding", data)} />
        )}
        {activeSection === "levels" && (
          <LevelsSettings data={settings?.levels} onSave={(data) => handleSave("levels", data)} />
        )}
        {activeSection === "channels" && (
          <ChannelsSettings data={settings?.channels} onSave={(data) => handleSave("channels", data)} />
        )}
        {activeSection === "moderation" && (
          <ModerationSettings data={settings?.moderation} onSave={(data) => handleSave("moderation", data)} />
        )}
        {activeSection === "chat" && <ChatSettings />}
      </main>
    </div>
  );
}

// Esempio di componenti sezione (puoi espandere e personalizzare)
function GeneralSettings({ data, onSave }) {
  const [welcomeMsg, setWelcomeMsg] = useState(data?.welcomeMsg || "");
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Impostazioni Generali</h3>
      <div className="mb-4">
        <label className="block font-medium mb-2">Messaggio di benvenuto</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={welcomeMsg}
          onChange={(e) => setWelcomeMsg(e.target.value)}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => onSave({ welcomeMsg })}
      >
        Salva
      </button>
    </section>
  );
}

function OnboardingSettings({ data, onSave }) {
  const [steps, setSteps] = useState(data?.steps || ["Completa il profilo", "Presentati"]);
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Onboarding</h3>
      <div className="mb-4">
        <label className="block font-medium mb-2">Step di onboarding</label>
        <textarea
          className="border rounded px-3 py-2 w-full"
          value={steps.join("\n")}
          onChange={(e) => setSteps(e.target.value.split("\n"))}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => onSave({ steps })}
      >
        Salva
      </button>
    </section>
  );
}

function LevelsSettings({ data, onSave }) {
  const [levels, setLevels] = useState(data?.levels || ["Newbie", "Member", "Pro", "Mentor", "Legend"]);
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Livelli Community</h3>
      <div className="mb-4">
        <label className="block font-medium mb-2">Livelli</label>
        <textarea
          className="border rounded px-3 py-2 w-full"
          value={levels.join("\n")}
          onChange={(e) => setLevels(e.target.value.split("\n"))}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => onSave({ levels })}
      >
        Salva
      </button>
    </section>
  );
}

function ChannelsSettings({ data, onSave }) {
  const [channels, setChannels] = useState(data?.channels || ["Generale", "Allenamento", "Alimentazione"]);
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Canali Community</h3>
      <div className="mb-4">
        <label className="block font-medium mb-2">Canali</label>
        <textarea
          className="border rounded px-3 py-2 w-full"
          value={channels.join("\n")}
          onChange={(e) => setChannels(e.target.value.split("\n"))}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => onSave({ channels })}
      >
        Salva
      </button>
    </section>
  );
}

function ModerationSettings({ data, onSave }) {
  const [autoModeration, setAutoModeration] = useState(data?.autoModeration || false);
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Moderazione</h3>
      <div className="mb-4 flex items-center gap-4">
        <label className="block font-medium">Auto-moderazione</label>
        <input type="checkbox" checked={autoModeration} onChange={e => setAutoModeration(e.target.checked)} />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => onSave({ autoModeration })}
      >
        Salva
      </button>
    </section>
  );
}

function ChatSettings() {
  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Chat Community</h3>
      <div className="mb-4">Prossimamente: chat moderna stile Skool, con avatar, input fisso, conversazione fluida.</div>
    </section>
  );
}
