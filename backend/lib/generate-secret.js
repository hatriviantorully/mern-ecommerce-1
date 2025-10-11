// generate-secret.js - SIMPLE VERSION

import crypto from "crypto";

console.log('=== JWT SECRETS FOR .env ===\n');

const accessSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('ACCESS_TOKEN_SECRET=' + accessSecret);
console.log('REFRESH_TOKEN_SECRET=' + refreshSecret);

console.log('\n✅ Copy these to your .env file!');