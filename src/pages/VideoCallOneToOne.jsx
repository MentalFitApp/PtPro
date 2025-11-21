import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import DailyIframe from '@daily-co/daily-js';
import { DailyProvider, useParticipantIds, useParticipant, useDaily, useScreenShare, useLocalParticipant, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';
import { deleteDailyRoom } from '../utils/dailyApi';
import { Camera, CameraOff, Mic as MicOn, MicOff, Monitor, PhoneOff, ArrowLeft, Users, MessageCircle, Settings, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

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
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              {participant?.user_name || 'Partecipante'}
            </p>
            <p className="text-slate-500 text-xs">Video spento</p>
          </div>
        </div>
      )}

      {/* Nome partecipante */}
      <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded-lg">
        <p className="text-white text-sm font-medium">
          {participant?.user_name || 'Partecipante'}
        </p>
      </div>

      {/* Indicatore audio */}
      <div className="absolute bottom-3 right-3">
        {audioTrack?.isEnabled ? (
          <Volume2 size={16} className="text-green-400" />
        ) : (
          <VolumeX size={16} className="text-red-400" />
        )}
      </div>
    </div>
  );
}

// Componente per video locale
function LocalVideo() {
  const localParticipant = useLocalParticipant();
  const videoTrack = useVideoTrack(localParticipant?.sessionId);
  const audioTrack = useAudioTrack(localParticipant?.sessionId);

  return (
    <div className="relative bg-slate-800 rounded-lg overflow-hidden w-48 h-36">
      {videoTrack?.isEnabled ? (
        <video
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          ref={(el) => {
            if (el && videoTrack.track) {
              el.srcObject = new MediaStream([videoTrack.track]);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-700">
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-xs">Tu</p>
          </div>
        </div>
      )}

      {/* Indicatore audio locale */}
      <div className="absolute bottom-2 right-2">
        {audioTrack?.isEnabled ? (
          <Volume2 size={12} className="text-green-400" />
        ) : (
          <VolumeX size={12} className="text-red-400" />
        )}
      </div>
    </div>
  );
}

// Componente principale della chiamata
function VideoCallInterface({ roomUrl, onLeave, callerName, callerPhoto }) {
  const participants = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();
  const daily = useDaily();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [startTime] = useState(Date.now());

  // Timer per durata chiamata
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = async () => {
    if (daily) {
      if (isVideoEnabled) {
        await daily.setLocalVideo(false);
      } else {
        await daily.setLocalVideo(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (daily) {
      if (isAudioEnabled) {
        await daily.setLocalAudio(false);
      } else {
        await daily.setLocalAudio(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (daily) {
      if (isSharingScreen) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    }
  };

  const handleLeaveCall = async () => {
    if (daily) {
      await daily.leave();
    }
    onLeave();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveCall}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Chiamata con {callerName}</h2>
              <p className="text-sm text-slate-400">{formatDuration(callDuration)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-slate-700 rounded-lg">
            <span className="text-sm text-slate-300">{participants.length + 1} partecipanti</span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Video principale */}
          <div className="relative">
            {participants.length > 0 ? (
              <ParticipantVideo sessionId={participants[0]} />
            ) : (
              <div className="bg-slate-800 rounded-xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                      src={callerPhoto || '/default-avatar.png'}
                      alt={callerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <p className="text-slate-400 mb-2">In attesa che {callerName} si unisca...</p>
                  <div className="flex justify-center">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-200"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar con controlli e video locale */}
          <div className="flex flex-col gap-4">
            {/* Video locale */}
            <LocalVideo />

            {/* Controlli chiamata */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4">Controlli Chiamata</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-lg transition-colors ${
                    isVideoEnabled
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isVideoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-lg transition-colors ${
                    isAudioEnabled
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isAudioEnabled ? <MicOn size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-lg transition-colors ${
                    isSharingScreen
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <Monitor size={20} />
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>

            {/* Chat rapido (placeholder) */}
            <div className="bg-slate-800/50 rounded-xl p-4 flex-1">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <MessageCircle size={16} />
                Chat
              </h3>
              <div className="text-center text-slate-500 text-sm py-8">
                Chat non disponibile durante le chiamate one-to-one
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principale
export default function VideoCallOneToOne() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUser(user);

      try {
        // Carica dati della chiamata
        const callDoc = await getDoc(doc(db, 'video_calls', callId));
        if (!callDoc.exists()) {
          setError('Chiamata non trovata');
          setLoading(false);
          return;
        }

        const data = callDoc.data();

        // Verifica che l'utente sia parte della chiamata
        if (data.callerId !== user.uid && data.receiverId !== user.uid) {
          console.log('Access denied:', {
            userId: user.uid,
            callerId: data.callerId,
            receiverId: data.receiverId,
            callId: callId
          });
          setError('Non sei autorizzato a partecipare a questa chiamata. Potrebbe essere una chiamata privata o già terminata.');
          setLoading(false);
          return;
        }

        // Verifica che la chiamata sia ancora attiva
        if (data.status === 'ended') {
          setError('Questa chiamata è già terminata.');
          setLoading(false);
          return;
        }

        setCallData(data);
        setLoading(false);

        // Aggiorna stato chiamata
        await updateDoc(doc(db, 'video_calls', callId), {
          status: 'active',
          joinedAt: serverTimestamp(),
        });

      } catch (err) {
        console.error('Error loading call:', err);
        setError('Errore nel caricamento della chiamata');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [callId, navigate]);

  const handleLeaveCall = async () => {
    if (callData) {
      try {
        await updateDoc(doc(db, 'video_calls', callId), {
          status: 'ended',
          endedAt: serverTimestamp(),
        });

        // Cleanup della room dopo un delay
        if (callData.roomName) {
          setTimeout(async () => {
            try {
              await deleteDailyRoom(callData.roomName);
              console.log('Room cleaned up:', callData.roomName);
            } catch (error) {
              console.error('Error cleaning up room:', error);
            }
          }, 5000); // 5 secondi per permettere la disconnessione
        }
      } catch (error) {
        console.error('Error updating call status:', error);
      }
    }
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Connessione alla chiamata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Errore</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/community')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = callData.callerId === currentUser.uid
    ? { id: callData.receiverId, name: callData.receiverName, photo: callData.receiverPhoto }
    : { id: callData.callerId, name: callData.callerName, photo: callData.callerPhoto };

  return (
    <DailyProvider
      url={callData.roomUrl}
      userName={currentUser.displayName || 'Partecipante'}
    >
      <VideoCallInterface
        roomUrl={callData.roomUrl}
        onLeave={handleLeaveCall}
        callerName={otherParticipant.name}
        callerPhoto={otherParticipant.photo}
      />
    </DailyProvider>
  );
}