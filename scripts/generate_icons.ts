import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';

async function generateIcons() {
  const sizes = [192, 512];
  const outDir = path.join(process.cwd(), 'public', 'icons');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const size of sizes) {
    // #4F46E5 is rgb(79, 70, 229)
    // #FBBF24 is rgb(251, 191, 36)
    const bg = new Jimp({ width: size, height: size, color: 0x4F46E5ff });
    
    // Draw gold accent corner
    const accentSize = Math.floor(size * 0.2);
    for (let y = 0; y < accentSize; y++) {
      for (let x = size - accentSize; x < size; x++) {
        // Triangle shape: 
        if (x - (size - accentSize) + y > accentSize - 1) {
            bg.setPixelColor(0xFBBF24ff, x, y);
        }
      }
    }

    // Try to write to file
    await bg.write(`${outDir}/icon-${size}.png`);
  }
}

generateIcons().then(() => console.log('Icons generated')).catch(e => console.error(e));
