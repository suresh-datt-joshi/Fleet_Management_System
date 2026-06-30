/**
 * Configure Google Maps API key in backend and frontend .env files.
 *
 * Usage:
 *   node scripts/setup-google-maps.js YOUR_GOOGLE_MAPS_API_KEY
 *   npm run setup:maps -- YOUR_GOOGLE_MAPS_API_KEY
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env');

const apiKey = process.argv[2]?.trim();

if (!apiKey || apiKey === 'your-google-maps-api-key') {
  console.error('Usage: node scripts/setup-google-maps.js <GOOGLE_MAPS_API_KEY>');
  console.error('');
  console.error('Get a key from Google Cloud Console and enable:');
  console.error('  - Maps JavaScript API');
  console.error('  - Places API');
  console.error('  - Geocoding API');
  console.error('  - Directions API');
  console.error('  - Distance Matrix API');
  process.exit(1);
}

const upsertEnvVar = (content, key, value) => {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const trimmed = content.replace(/\s*$/, '');
  return `${trimmed}${trimmed ? '\n' : ''}${line}\n`;
};

const readEnv = (filePath) => (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');

const writeEnv = (filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.relative(rootDir, filePath)}`);
};

writeEnv(backendEnvPath, upsertEnvVar(readEnv(backendEnvPath), 'GOOGLE_MAPS_API_KEY', apiKey));
writeEnv(
  frontendEnvPath,
  upsertEnvVar(readEnv(frontendEnvPath), 'VITE_GOOGLE_MAPS_API_KEY', apiKey)
);

console.log('');
console.log('Google Maps API key configured.');
console.log('Restart backend and frontend dev servers for changes to take effect.');
