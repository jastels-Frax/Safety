const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ORANGE = { r: 232, g: 115, b: 26 };
const BG     = { r: 17,  g: 17,  b: 17  };
const THRESHOLD = 128;

// Find source file
const candidates = [
  path.join(__dirname, 'White_Transparent_Squircle.png'),
  path.join(__dirname, 'icons', 'White_Transparent_Squircle.png'),
];
const src = candidates.find(p => fs.existsSync(p));
if (!src) {
  console.error('ERROR: White_Transparent_Squircle.png not found in project root or icons/');
  process.exit(1);
}
console.log('Source:', src);

const outputs = [
  { name: 'icons/icon-192.png',          size: 192 },
  { name: 'icons/icon-192-maskable.png', size: 192 },
  { name: 'icons/icon-512.png',          size: 512 },
  { name: 'icons/icon-512-maskable.png', size: 512 },
];

async function process() {
  const { data, info } = await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);

  // Build an orange-on-transparent layer — alpha encodes the logo mask.
  // This lets us blur it cleanly to produce a glow without bleed into the BG.
  const logoAlpha = new Uint8Array(512 * 512 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const t = Math.max(brightness, a / 255);
    logoAlpha[i]   = ORANGE.r;
    logoAlpha[i+1] = ORANGE.g;
    logoAlpha[i+2] = ORANGE.b;
    logoAlpha[i+3] = Math.round(t * 255);
  }

  const sharpLogo = await sharp(Buffer.from(logoAlpha), {
    raw: { width: 512, height: 512, channels: 4 }
  }).png().toBuffer();

  // Glow layer: heavy blur of the logo, then boost brightness so it blooms
  const glowLayer = await sharp(sharpLogo)
    .blur(12)
    .modulate({ brightness: 1.2 })
    .toBuffer();

  // Composite: dark BG → glow → crisp logo
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
