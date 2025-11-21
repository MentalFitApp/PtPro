import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import DailyIframe from '@daily-co/daily-js';
import { DailyProvider, useParticipantIds, useParticipant, useDaily, useScreenShare, useLocalParticipant, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';
import { Camera, CameraOff, Mic as MicOn, MicOff, Monitor, PhoneOff, ArrowLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// Genera nome stanza unico per PT e cliente
function getRoomName(ptId, clientId) {
  return `pt-${ptId}-client-${clientId}`;
}

// Richiedi permessi per videocamera e microfono
const requestMediaPermissions = async () => {
  try {
    // Richiedi accesso a camera e microfono
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Ferma lo stream subito dopo aver ottenuto i permessi
    stream.getTracks().forEach(track => track.stop());

    return true;
  } catch (error) {
    console.error('Errore richiesta permessi media:', error);
    alert('Per partecipare alla videochiamata è necessario consentire l\'accesso a videocamera e microfono.');
    return false;
  }
};

// Componente per video partecipante remoto
function ParticipantVideo({ sessionId }) {
  const participant = useParticipant(sessionId);
  const videoTrack = useVideoTrack(sessionId);
  const audioTrack = useAudioTrack(sessionId);

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
      {videoTrack?.isEnabled ? (
        <video
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          ref={(el) => {
            if (el && videoTrack.track) {
              el.srcObject = new MediaStream([videoTrack.track]);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-700">
          <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
            <Users size={32} className="text-slate-400" />
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
        {participant?.user_name || 'Partecipante'} {!audioTrack?.isEnabled && '(muto)'}
      </div>
    </div>
  );
}

// Componente principale videocall
function VideoCallInterface({ roomUrl, onClose, isVideoEnabled, isAudioEnabled, isScreenSharing, onToggleVideo, onToggleAudio, onToggleScreenShare }) {
  const callObject = useDaily();
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const { screens } = useScreenShare();

  return (
    <div className="flex-1 relative bg-slate-900">
      {/* Header con controlli */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-full transition-all backdrop-blur-sm"
          title="Torna indietro"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-slate-800/90 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="text-white text-sm flex items-center gap-2">
            <Users size={16} />
            {participantIds.length + 1} partecipante{participantIds.length !== 0 ? 'i' : ''}
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 pt-20 h-full overflow-auto">
        {/* Partecipante locale */}
        <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
          <video
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            ref={(el) => {
              if (el && localParticipant?.videoTrack) {
                el.srcObject = new MediaStream([localParticipant.videoTrack]);
              }
            }}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
                <Users size={32} className="text-slate-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
            Tu {isAudioEnabled ? '' : '(muto)'}
          </div>
        </div>

        {/* Altri partecipanti */}
        {participantIds.filter(id => id !== localParticipant?.sessionId).map((id) => (
          <ParticipantVideo key={id} sessionId={id} />
        ))}

        {/* Screen share */}
        {screens.length > 0 && (
          <div className="col-span-full relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              ref={(el) => {
                if (el && screens[0]?.screenVideoTrack) {
                  el.srcObject = new MediaStream([screens[0].screenVideoTrack]);
                }
              }}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              Condivisione schermo
            </div>
          </div>
        )}
      </div>

      {/* Controlli chiamata */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-all ${
            isVideoEnabled
              ? 'bg-slate-600 hover:bg-slate-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isVideoEnabled ? 'Disattiva video' : 'Attiva video'}
        >
          {isVideoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>

        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-all ${
            isAudioEnabled
              ? 'bg-slate-600 hover:bg-slate-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isAudioEnabled ? 'Disattiva audio' : 'Attiva audio'}
        >
          {isAudioEnabled ? <MicOn size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-all ${
            isScreenSharing
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : 'bg-slate-600 hover:bg-slate-500 text-white'
          }`}
          title={isScreenSharing ? 'Ferma condivisione' : 'Condividi schermo'}
        >
          <Monitor size={20} />
        </button>

        <button
          onClick={onClose}
          className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all"
          title="Termina chiamata"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

export default function VideoCall() {
  const { ptId, clientId } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const roomName = getRoomName(ptId, clientId);

  // Stati per Daily.co
  const [dailyCallObject, setDailyCallObject] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inizializza chiamata Daily.co
  const initializeDailyCall = async () => {
    try {
      setIsLoading(true);

      // Richiedi permessi prima di procedere
      const hasPermissions = await requestMediaPermissions();
      if (!hasPermissions) {
        setIsLoading(false);
        return;
      }

      // Crea stanza Daily.co
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            max_participants: 2,
            enable_chat: false,
            enable_screenshare: true,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Errore creazione stanza Daily.co');
      }

      const roomData = await response.json();
      const roomUrl = roomData.url;

      // Inizializza call object
      const call = DailyIframe.createCallObject({
        url: roomUrl,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });

      setDailyCallObject(call);

      // Event listeners
      call.on('participant-joined', (event) => {
        console.log('Partecipante entrato:', event.participant);
      });

      call.on('participant-left', (event) => {
        console.log('Partecipante uscito:', event.participant);
      });

      call.on('error', (event) => {
        console.error('Errore Daily.co:', event.error);
      });

      // Partecipa alla chiamata
      await call.join();
      setHasJoined(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Errore inizializzazione Daily.co:', error);
      setIsLoading(false);
      alert('Errore durante l\'accesso alla videochiamata');
    }
  };

  // Controlli chiamata
  const toggleVideo = async () => {
    if (!dailyCallObject) return;
    try {
      if (isVideoEnabled) {
        await dailyCallObject.setLocalVideo(false);
      } else {
        await dailyCallObject.setLocalVideo(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Errore toggle video:', error);
    }
  };

  const toggleAudio = async () => {
    if (!dailyCallObject) return;
    try {
      if (isAudioEnabled) {
        await dailyCallObject.setLocalAudio(false);
      } else {
        await dailyCallObject.setLocalAudio(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Errore toggle audio:', error);
    }
  };

  const toggleScreenShare = async () => {
    if (!dailyCallObject) return;
    try {
      if (isScreenSharing) {
        await dailyCallObject.stopScreenShare();
      } else {
        await dailyCallObject.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Errore screen share:', error);
    }
  };

  // Inizializza al mount
  useEffect(() => {
    if (user && ptId && clientId) {
      initializeDailyCall();
    }
  }, [user, ptId, clientId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dailyCallObject) {
        dailyCallObject.leave();
        dailyCallObject.destroy();
      }
    };
  }, []);

  const handleClose = async () => {
    if (dailyCallObject) {
      try {
        await dailyCallObject.leave();
        dailyCallObject.destroy();
        setDailyCallObject(null);
      } catch (error) {
        console.error('Errore rilascio Daily.co:', error);
      }
    }
    navigate(-1); // Torna indietro
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connessione in corso...</h2>
          <p className="text-slate-400">Preparazione videochiamata</p>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Videochiamata PT-Cliente</h1>
          <p className="text-slate-300 mb-6">
            Stanza privata: <span className="font-mono text-cyan-400">{roomName}</span>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => initializeDailyCall()}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg"
            >
              Entra nella chiamata
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
            >
              Annulla
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DailyProvider callObject={dailyCallObject}>
        <VideoCallInterface
          roomUrl={dailyCallObject?.url}
          onClose={handleClose}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isScreenSharing={isScreenSharing}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onToggleScreenShare={toggleScreenShare}
        />
      </DailyProvider>
    </div>
  );
}
