const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const DARK = process.argv.includes('--dark');
const HTML_PATH = path.join(DIR, DARK ? 'logo-orbit-preview-dark.html' : 'logo-orbit-preview.html');
const OUTPUT_PATH = path.join(DIR, DARK ? 'logo-mapa-mt-animado-dark.gif' : 'logo-mapa-mt-animado.gif');
const LOGO_SRC_PATH = path.join(DIR, 'logo-src.txt');

// Config
const SIZE = 300;       // tamanho do viewport (px)
const SCALE = 2;        // deviceScaleFactor — gera 600x600 internamente
const FPS = 20;
const DURATION_S = 4;   // segundos capturados (loop de 4s no GIF)
const TOTAL_FRAMES = FPS * DURATION_S;
const FRAME_DELAY = Math.round(1000 / FPS);
const GIF_W = SIZE * SCALE;
const GIF_H = SIZE * SCALE;

function decodePng(buffer) {
  return new Promise((resolve, reject) => {
    new PNG().parse(buffer, (err, png) => {
      if (err) reject(err);
      else resolve(png);
    });
  });
}

async function main() {
  console.log('Lendo imagem base64 da logo...');
  const logoSrc = fs.readFileSync(LOGO_SRC_PATH, 'utf8').trim();

  console.log('Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: SCALE });

  await page.evaluateOnNewDocument((src) => { window._logoSrc = src; }, logoSrc);

  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Garante que a imagem está carregada
  await page.evaluate((src) => {
    document.getElementById('mapImg').src = src;
    return new Promise(r => {
      const img = document.getElementById('mapImg');
      if (img.complete) r();
      else img.onload = r;
    });
  }, logoSrc);

  // Pausa para garantir renderização inicial
  await new Promise(r => setTimeout(r, 600));

  console.log(`Capturando ${TOTAL_FRAMES} frames (${DURATION_S}s a ${FPS}fps)...`);

  const encoder = new GIFEncoder(GIF_W, GIF_H);
  encoder.setDelay(FRAME_DELAY);
  encoder.setRepeat(0);  // loop infinito
  encoder.setQuality(8);

  const outStream = fs.createWriteStream(OUTPUT_PATH);
  encoder.createReadStream().pipe(outStream);
  encoder.start();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const pngBuf = await page.screenshot({ type: 'png', omitBackground: false });
    const png = await decodePng(pngBuf);

    // gif-encoder-2 espera Uint8Array RGBA
    encoder.addFrame(new Uint8Array(png.data.buffer));

    if ((i + 1) % FPS === 0) {
      console.log(`  ${i + 1}/${TOTAL_FRAMES} frames`);
    }

    // Avança a animação SVG
    await page.evaluate((ms) => {
      document.getAnimations().forEach(a => {
        try { a.currentTime = (a.currentTime || 0) + ms; } catch (_) {}
      });
    }, FRAME_DELAY);

    await new Promise(r => setTimeout(r, FRAME_DELAY));
  }

  encoder.finish();
  await browser.close();

  await new Promise(r => outStream.on('finish', r));
  const kb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(0);
  console.log(`\nPronto! GIF gerado em:\n  ${OUTPUT_PATH}  (${kb} KB)`);
}

main().catch(err => { console.error('\nErro:', err.message); process.exit(1); });
