require('dotenv').config();
const { put } = require('@vercel/blob');

async function main() {
  try {
    console.log("Token:", process.env.BLOB_READ_WRITE_TOKEN);
    const result = await put('test.txt', 'Hello World', {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
main();
