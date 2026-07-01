import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = `C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\f5206606-3971-4c5b-a028-fbafb8f9ec6f\\media__1782889697507.png`;
const destDir = path.join(__dirname, 'src', 'assets');
const dest = path.join(destDir, 'logo.png');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFile(src, dest, (err) => {
  if (err) {
    console.error('Error copying file:', err);
  } else {
    console.log('Logo copied successfully to src/assets/logo.png!');
  }
});
