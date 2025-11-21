const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_DOMAIN = 'biondo-fitness-coach.daily.co';

/**
 * Testa la connessione all'API Daily.co
 * @returns {Promise<boolean>} - True se la connessione funziona
 */
export async function testDailyConnection() {
  try {
    if (!DAILY_API_KEY) {
      console.error('Daily.co API key not configured');
      return false;
    }

    const response = await fetch('https://api.daily.co/v1/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Daily.co connection test failed:', error);
    return false;
  }
}

/**
 * Crea una room su Daily.co tramite API
 * @param {string} roomName - Nome della room
 * @param {Object} options - Opzioni per la room
 * @returns {Promise<Object>} - Dati della room creata
 */
export async function createDailyRoom(roomName, options = {}) {
  try {
    // Prima testa la connessione
    const isConnected = await testDailyConnection();
    if (!isConnected) {
      throw new Error('Impossibile connettersi a Daily.co. Verifica la connessione internet e la configurazione API.');
    }

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
      const errorText = await response.text();
      console.error('Daily.co API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 401) {
        throw new Error('Chiave API Daily.co non valida o scaduta. Contatta l\'amministratore.');
      } else if (response.status === 403) {
        throw new Error('Permessi insufficienti per creare stanze su Daily.co.');
      } else if (response.status === 429) {
        throw new Error('Troppe richieste a Daily.co. Riprova tra qualche minuto.');
      } else {
        throw new Error(`Errore Daily.co (${response.status}): ${response.statusText}`);
      }
    }

    const roomData = await response.json();
    console.log('Room created successfully:', roomData);
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