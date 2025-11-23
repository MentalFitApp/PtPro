// Script di test per verificare l'integrazione con Daily.co API
const { createDailyRoom, deleteDailyRoom, generateRoomName } = require('./src/utils/dailyApi');

async function testDailyAPI() {
  console.log('🧪 Test Daily.co API Integration');
  console.log('================================');

  try {
    // Genera un nome room di test
    const roomName = generateRoomName('test');
    console.log(`📝 Room name: ${roomName}`);

    // Crea una room di test
    console.log('🏗️  Creating room...');
    const roomData = await createDailyRoom(roomName, {
      maxParticipants: 2,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false
      }
    });

    console.log('✅ Room created successfully!');
    console.log(`🔗 Room URL: ${roomData.url}`);
    console.log(`🆔 Room ID: ${roomData.id}`);
    console.log(`👥 Max participants: ${roomData.config?.max_participants}`);

    // Aspetta 2 secondi
    console.log('⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Elimina la room di test
    console.log('🗑️  Deleting room...');
    await deleteDailyRoom(roomName);
    console.log('✅ Room deleted successfully!');

    console.log('\n🎉 Daily.co API integration test PASSED!');

  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Esegui il test solo se chiamato direttamente
if (require.main === module) {
  testDailyAPI();
}

module.exports = { testDailyAPI };