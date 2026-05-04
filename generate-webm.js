/**
 * Gera assets/logo-animado.webm (VP9 alpha, fundo transparente)
 * Duração: 4s loop @ 30fps = 120 frames
 */

const puppeteer  = require('puppeteer');
const ffmpeg     = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs         = require('fs');
const path       = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const FPS      = 30;
const DURATION = 4;          // segundos de loop
const W        = 300;
const H        = 340;
const FRAMES   = FPS * DURATION;
const FRAMES_DIR = path.resolve(__dirname, 'assets/_frames');
const OUT_FILE   = path.resolve(__dirname, 'assets/logo-animado.webm');

// ── SVG inline com fundo transparente ────────────────────────────────────────
// Lê o SVG final (com paths) e envolve num HTML com bg transparente
const svgRaw = fs.readFileSync(
  path.resolve(__dirname, 'assets/logo-saude-digital-animado.svg'),
  'utf8'
);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  html, body { margin:0; padding:0; background:transparent; width:${W}px; height:${H}px; overflow:hidden; }
</style>
</head>
<body>
${svgRaw}
</body>
</html>`;

const HTML_FILE = path.resolve(__dirname, 'assets/_capture.html');

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // Prepara pasta de frames
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR);
  fs.writeFileSync(HTML_FILE, html);

  console.log('▶ Abrindo browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  // Fundo transparente
  await page.goto(`file:///${HTML_FILE}`, { waitUntil: 'networkidle0' });
  await page._client().send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: 0 },
  });

  // Avança o tempo da animação via CSS e captura frame a frame
  console.log(`▶ Capturando ${FRAMES} frames...`);
  const interval = 1000 / FPS; // ms entre frames

  for (let i = 0; i < FRAMES; i++) {
    const t = (i / FPS).toFixed(4); // segundos corridos

    // Pausa todas as animações SMIL no tempo exato
    await page.evaluate((sec) => {
      document.querySelectorAll('svg').forEach(svg => {
        try { svg.setCurrentTime(sec); } catch(e){}
      });
      document.querySelectorAll('animateTransform, animate, animateMotion').forEach(el => {
        try {
          el.ownerSVGElement?.setCurrentTime(sec);
        } catch(e){}
      });
    }, parseFloat(t));

    const framePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(4,'0')}.png`);
    await page.screenshot({
      path: framePath,
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: W, height: H },
    });

    if (i % 15 === 0) process.stdout.write(`\r  frame ${i+1}/${FRAMES}`);
  }

  await browser.close();
  console.log('\n▶ Encoding WebM VP9 com alpha...');

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(FRAMES_DIR, 'frame-%04d.png'))
      .inputOptions([`-framerate ${FPS}`])
      .videoCodec('libvpx-vp9')
      .outputOptions([
        '-pix_fmt yuva420p',   // alpha channel
        '-b:v 0',              // qualidade constante (CRF)
        '-crf 18',             // alta qualidade
        '-auto-alt-ref 0',     // obrigatório para alpha
        '-loop 0',             // loop infinito
        '-an',                 // sem áudio
      ])
      .output(OUT_FILE)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Limpa temporários
  fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.unlinkSync(HTML_FILE);

  const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(`✓ assets/logo-animado.webm gerado — ${size} KB, ${DURATION}s loop, ${W}×${H}px, VP9 alpha`);
})();
