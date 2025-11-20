import React from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../firebase';

// Genera nome stanza unico per tenant/PT e cliente
function getRoomName(ptId, clientId) {
  return `pt-${ptId}-client-${clientId}`;
}

export default function VideoCall() {
  // Esempio: recupera parametri da URL
  const { ptId, clientId } = useParams();
  const user = auth.currentUser;
  const roomName = getRoomName(ptId, clientId);

  // Puoi aggiungere controlli accesso qui (es. solo coach o cliente)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Videochiamata</h1>
      <p className="text-slate-300 mb-2">Stanza: <span className="font-mono text-cyan-400">{roomName}</span></p>
      <div className="w-full max-w-2xl h-[500px] rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        <iframe
          src={`https://meet.jit.si/${roomName}`}
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="camera; microphone; fullscreen; display-capture"
          title="Videocall"
        />
      </div>
    </div>
  );
}
