const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

// Safety app: Fraxinus green on dark background
const LOGO  = { r: 93,  g: 191, b: 138 };  // #5DBF8A
const BG    = { r: 18,  g: 18,  b: 18  };  // #121212

const src = path.join(__dirname, 'icons', 'White&Transparent Squircle.png');
if (!fs.existsSync(src)) { console.error('Source not found:', src); process.exit(1); }
console.log('Source:', src);

const outputs = [
  { name: 'icons/icon-192.png',          size: 192 },
  { name: 'icons/icon-192-maskable.png', size: 192 },
  { name: 'icons/icon-512.png',          size: 512 },
  { name: 'icons/icon-512-maskable.png', size: 512 },
];

async function process() {
  const { data } = await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);

  // Orange-on-transparent logo layer; alpha = logo intensity
  const logoAlpha = new Uint8Array(512 * 512 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const t = Math.max(brightness, a / 255);
    logoAlpha[i]   = LOGO.r;
    logoAlpha[i+1] = LOGO.g;
    logoAlpha[i+2] = LOGO.b;
    logoAlpha[i+3] = Math.round(t * 255);
  }

  const sharpLogo = await sharp(Buffer.from(logoAlpha), {
    raw: { width: 512, height: 512, channels: 4 }
  }).png().toBuffer();

  const glowLayer = await sharp(sharpLogo)
    .blur(12)
    .modulate({ brightness: 1.2 })
    .toBuffer();

  const recoloured = await sharp({
    create: { width: 512, height: 512, channels: 4,
              background: { r: BG.r, g: BG.g, b: BG.b, alpha: 255 } }
  })
  .composite([
    { input: glowLayer, blend: 'over' },
    { input: sharpLogo, blend: 'over' },
  ])
  .png()
  .toBuffer();

  for (const { name, size } of outputs) {
    const outPath = path.join(__dirname, name);
    await sharp(recoloured).resize(size, size).toFile(outPath);
    const bytes = fs.statSync(outPath).size;
    console.log(`  ${name}: ${bytes.toLocaleString()} bytes`);
  }
}

process().then(() => console.log('Done')).catch(err => { console.error(err); process.exit(1); });
