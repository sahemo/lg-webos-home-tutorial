const fs = require('node:fs');
const path = require('node:path');
const qrcode = require('../qrcode.js');

const projectRoot = path.resolve(__dirname, '..');
const inputPath = path.join(projectRoot, 'wifi-private.json');
const outputPath = path.join(projectRoot, 'still-tv-home-webos', 'wifi-qr-static.svg');
if (!fs.existsSync(inputPath)) {
  console.error('Create wifi-private.json in the project folder with ssid, security, and password fields first.');
  process.exit(1);
}
const network = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const ssid = String(network.ssid || '');
const security = String(network.security || 'WPA').toUpperCase();
const password = String(network.password || '');
if (!ssid) throw new Error('The ssid field must not be empty.');
if (!['WPA', 'WEP', 'NOPASS'].includes(security)) throw new Error('security must be WPA, WEP, or nopass.');
if (security !== 'NOPASS' && !password) throw new Error('A password is required for secured Wi-Fi.');
const escapeWifi = value => value.replace(/[\\;,:"]/g, character => `\\${character}`);
const payload = `WIFI:T:${security};S:${escapeWifi(ssid)};${security === 'NOPASS' ? '' : `P:${escapeWifi(password)};`}H:false;;`;
const qr = qrcode(0, 'M');
qr.addData(payload, 'Byte');
qr.make();
fs.writeFileSync(outputPath, qr.createSvgTag(10, 4), { mode: 0o600 });
console.log('Generated private QR asset inside still-tv-home-webos/.');
