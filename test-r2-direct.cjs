const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

const accountId = '7682069cf34302dfc6988fbe193f2ba6';
const accessKeyId = '91fda93481d38b755d3591081b173be6';
const secretAccessKey = '68bb3833b7c65248d2be479c60d16c9a2db7cf9f8b200617329dc70224c9d458';
const bucketName = 'fitflow';

async function test() {
  console.log('🧪 Test diretto R2\n');
  
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

  // Test 1: Lista bucket
  console.log('1️⃣ Test ListBuckets...');
  try {
    const listResult = await client.send(new ListBucketsCommand({}));
    console.log('   ✅ Buckets trovati:', listResult.Buckets?.map(b => b.Name).join(', ') || 'nessuno');
  } catch (error) {
    console.log('   ❌ Errore ListBuckets:', error.message);
  }

  // Test 2: Upload file di test
  console.log('\n2️⃣ Test Upload...');
  try {
    const testContent = Buffer.from('Test upload ' + new Date().toISOString());
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test/upload-test.txt',
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    await client.send(command);
    console.log('   ✅ Upload completato!');
    console.log(`   📎 URL: https://media.flowfitpro.it/test/upload-test.txt`);
  } catch (error) {
    console.log('   ❌ Errore Upload:', error.message);
    console.log('   📝 Dettagli:', error.Code || error.name);
  }
}

test();
