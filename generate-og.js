const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const templatePath = path.resolve(__dirname, 'og-template.html');
  await page.goto(`file:///${templatePath}`, { waitUntil: 'networkidle0' });

  // Aguarda fonte carregar
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.resolve(__dirname, 'assets/og-preview.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log('✓ assets/og-preview.png gerado com sucesso (2400×1260 @2x)');
})();
