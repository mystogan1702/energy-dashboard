// test-key.js
if (process.argv.length < 3) {
  console.log('Usage: node test-key.js <YOUR_REST_API_KEY>');
  process.exit(1);
}

const REST_KEY = process.argv[2];
const APP_ID = "45fad956-4485-4484-aacb-582da8a98b48";
const auth = Buffer.from(`${REST_KEY}:`).toString('base64');

const body = JSON.stringify({
  app_id: APP_ID,
  headings: { en: "Test" },
  contents: { en: "Hello from script" },
  included_segments: ["Subscribed Users"],
});

const https = require('https');
const req = https.request({
  hostname: 'onesignal.com',
  path: '/api/v1/notifications',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200) console.log('✅ Key is valid');
    else console.log('❌ Key rejected');
  });
});
req.write(body);
req.end();
