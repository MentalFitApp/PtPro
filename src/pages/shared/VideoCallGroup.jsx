import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import DailyIframe from '@daily-co/daily-js';
import { DailyProvider, useParticipantIds, useParticipant, useDaily, useScreenShare, useLocalParticipant, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';
import { deleteDailyRoom } from '../../services/external/dailyApi';
import { Camera, CameraOff, Mic as MicOn, MicOff, Monitor, PhoneOff, ArrowLeft, Users, MessageCircle, Settings, Volume2, VolumeX, UserPlus, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

// Componente per video partecipante remoto
function ParticipantVideo({ sessionId, isHost = false }) {
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
            <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              {participant?.user_name || 'Partecipante'}
            </p>
            <p className="text-slate-500 text-xs">Video spento</p>
          </div>
        </div>
      )}

      {/* Badge host */}
      {isHost && (
        <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Crown size={10} />
          Host
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
function LocalVideo({ isHost = false }) {
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
            {isHost && <Crown size={12} className="text-yellow-500 mx-auto mt-1" />}
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

// Componente principale della chiamata di gruppo
function VideoCallGroupInterface({ roomUrl, onLeave, callData, currentUser }) {
  const participants = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();
  const daily = useDaily();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [startTime] = useState(Date.now());
  const [showInvite, setShowInvite] = useState(false);

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

  const isHost = callData?.hostId === currentUser?.uid;
  const totalParticipants = participants.length + 1;

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
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{callData?.title || 'Chiamata di Gruppo'}</h2>
              <p className="text-sm text-slate-400">{formatDuration(callDuration)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <UserPlus size={14} />
              Invita
            </button>
          )}
          <div className="px-3 py-1 bg-slate-700 rounded-lg">
            <span className="text-sm text-slate-300">{totalParticipants} partecipanti</span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Video principali */}
          <div className="lg:col-span-2">
            <div className={`grid gap-4 h-full ${totalParticipants <= 2 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {participants.slice(0, 4).map((sessionId, index) => (
                <ParticipantVideo
                  key={sessionId}
                  sessionId={sessionId}
                  isHost={callData?.hostId === participants[index]?.user_id}
                />
              ))}

              {/* Placeholder per video aggiuntivi */}
              {totalParticipants < 5 && (
                <div className="bg-slate-800/50 rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-slate-600">
                  <div className="text-center text-slate-500">
                    <UserPlus size={32} className="mx-auto mb-2" />
                    <p className="text-sm">In attesa di altri partecipanti...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Video locale */}
            <LocalVideo isHost={isHost} />

            {/* Lista partecipanti */}
            <div className="bg-slate-800/50 rounded-xl p-4 flex-1">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Users size={16} />
                Partecipanti ({totalParticipants})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Host */}
                <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown size={14} className="text-black" />
                  </div>
                  <span className="text-slate-300 text-sm">{callData?.hostName || 'Host'}</span>
                </div>

                {/* Altri partecipanti */}
                {participants.map((sessionId) => {
                  const participant = useParticipant(sessionId);
                  return (
                    <div key={sessionId} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                        <Users size={14} className="text-slate-400" />
                      </div>
                      <span className="text-slate-300 text-sm">
                        {participant?.user_name || 'Partecipante'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

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
          </div>
        </div>
      </div>

      {/* Modal invita partecipanti */}
      {showInvite && isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowInvite(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Invita Partecipanti</h3>
            <p className="text-slate-400 mb-6">
              Condividi questo link per invitare altri membri della community:
            </p>
            <div className="bg-slate-700 rounded-lg p-3 mb-4">
              <p className="text-slate-300 text-sm font-mono break-all">
                {window.location.href}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Copia Link
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Componente principale
export default function VideoCallGroup() {
  const { callId } = useParams();
  const navigate = useNavigate();

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
        const callDoc = await getDoc(doc(db, 'group_video_calls', callId));
        if (!callDoc.exists()) {
          setError('Chiamata di gruppo non trovata');
          setLoading(false);
          return;
        }

        const data = callDoc.data();
        setCallData(data);
        setLoading(false);

        // Aggiorna stato chiamata
        await updateDoc(doc(db, 'group_video_calls', callId), {
          status: 'active',
          participants: [...(data.participants || []), user.uid],
          updatedAt: serverTimestamp(),
        });

      } catch (err) {
        console.error('Error loading group call:', err);
        setError('Errore nel caricamento della chiamata di gruppo');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [callId, navigate]);

  const handleLeaveCall = async () => {
    if (callData && currentUser) {
      try {
        const updatedParticipants = callData.participants?.filter(id => id !== currentUser.uid) || [];
        await updateDoc(doc(db, 'group_video_calls', callId), {
          participants: updatedParticipants,
          updatedAt: serverTimestamp(),
        });

        // Se non ci sono più partecipanti, termina la chiamata e cleanup della room
        if (updatedParticipants.length === 0) {
          await updateDoc(doc(db, 'group_video_calls', callId), {
            status: 'ended',
            endedAt: serverTimestamp(),
          });

          // Cleanup della room dopo un delay
          if (callData.roomName) {
            setTimeout(async () => {
              try {
                await deleteDailyRoom(callData.roomName);
                console.log('Group room cleaned up:', callData.roomName);
              } catch (error) {
                console.error('Error cleaning up group room:', error);
              }
            }, 5000); // 5 secondi per permettere la disconnessione
          }
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
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Connessione alla chiamata di gruppo...</p>
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

  return (
    <DailyProvider
      url={callData.roomUrl}
      userName={currentUser.displayName || 'Partecipante'}
    >
      <VideoCallGroupInterface
        roomUrl={callData.roomUrl}
        onLeave={handleLeaveCall}
        callData={callData}
        currentUser={currentUser}
      />
    </DailyProvider>
  );
}