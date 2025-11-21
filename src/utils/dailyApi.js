const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_DOMAIN = 'biondo-fitness-coach.daily.co';

/**
 * Crea una room su Daily.co tramite API
 * @param {string} roomName - Nome della room
 * @param {Object} options - Opzioni per la room
 * @returns {Promise<Object>} - Dati della room creata
 */
export async function createDailyRoom(roomName, options = {}) {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: options.maxParticipants || 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
          ...options.properties
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.status} ${response.statusText}`);
    }

    const roomData = await response.json();
    return roomData;
  } catch (error) {
    console.error('Error creating Daily room:', error);
    throw error;
  }
}

/**
 * Elimina una room su Daily.co
 * @param {string} roomName - Nome della room da eliminare
 */
export async function deleteDailyRoom(roomName) {
  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`Error deleting room ${roomName}:`, response.statusText);
    }
  } catch (error) {
    console.error('Error deleting Daily room:', error);
  }
}

/**
 * Ottiene informazioni su una room
 * @param {string} roomName - Nome della room
 * @returns {Promise<Object>} - Dati della room
 */
export async function getDailyRoom(roomName) {
  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.status} ${response.statusText}`);
    }

    const roomData = await response.json();
    return roomData;
  } catch (error) {
    console.error('Error getting Daily room:', error);
    throw error;
  }
}

/**
 * Genera un nome room univoco
 * @param {string} prefix - Prefisso per il nome
 * @returns {string} - Nome room univoco
 */
export function generateRoomName(prefix = 'call') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Converte l'URL della room nel formato corretto per Daily.co
 * @param {string} roomName - Nome della room
 * @returns {string} - URL completo della room
 */
export function getRoomUrl(roomName) {
  return `https://${DAILY_DOMAIN}/${roomName}`;
}