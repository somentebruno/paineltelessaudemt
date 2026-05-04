/**
 * Converte os <text> do SVG animado em <path> usando opentype.js
 * Resultado: assets/logo-saude-digital-animado.svg (atualizado)
 */

const _ot      = require('opentype.js');
const opentype = _ot.default || _ot;
const fs       = require('fs');
const path     = require('path');

const FONT_800 = path.resolve(__dirname, 'node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff');
const FONT_500 = path.resolve(__dirname, 'node_modules/@fontsource/nunito/files/nunito-latin-500-normal.woff');
const SVG_IN   = path.resolve(__dirname, 'assets/logo-saude-digital-animado.svg');

// ── Helpers ──────────────────────────────────────────────────────────────────

function textToPath(font, text, targetCenterX, baselineY, fontSize, tracking = 0) {
  // Gera o path centrado em targetCenterX
  // tracking = espaço extra entre caracteres (em unidades de fonte → px)
  const paths = [];
  let cursorX = 0;

  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const p     = glyph.getPath(cursorX, 0, fontSize);
    paths.push(p);
    cursorX += (glyph.advanceWidth / font.unitsPerEm) * fontSize + tracking;
  }

  const totalWidth = cursorX - tracking;
  const offsetX    = targetCenterX - totalWidth / 2;

  // Merge all glyph paths into one 'd' string with translation
  let d = '';
  for (const p of paths) {
    for (const cmd of p.commands) {
      switch (cmd.type) {
        case 'M': d += `M${(cmd.x + offsetX).toFixed(3)},${(cmd.y + baselineY).toFixed(3)} `; break;
        case 'L': d += `L${(cmd.x + offsetX).toFixed(3)},${(cmd.y + baselineY).toFixed(3)} `; break;
        case 'C': d += `C${(cmd.x1+offsetX).toFixed(3)},${(cmd.y1+baselineY).toFixed(3)} ${(cmd.x2+offsetX).toFixed(3)},${(cmd.y2+baselineY).toFixed(3)} ${(cmd.x+offsetX).toFixed(3)},${(cmd.y+baselineY).toFixed(3)} `; break;
        case 'Q': d += `Q${(cmd.x1+offsetX).toFixed(3)},${(cmd.y1+baselineY).toFixed(3)} ${(cmd.x+offsetX).toFixed(3)},${(cmd.y+baselineY).toFixed(3)} `; break;
        case 'Z': d += 'Z '; break;
      }
    }
  }
  return d.trim();
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  function loadFont(file) {
    const buf = fs.readFileSync(file);
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  const font800 = loadFont(FONT_800);
  const font500 = loadFont(FONT_500);

  const CENTER_X   = 150;
  const TRACKING   = 1.0; // px extra entre caracteres (equivale ao letter-spacing do CSS)

  const saudePath   = textToPath(font800, 'SAÚDE',       CENTER_X, 224, 25, TRACKING);
  const digitalPath = textToPath(font800, 'DIGITAL',     CENTER_X, 246, 20, TRACKING);
  const matoPath    = textToPath(font500, 'Mato Grosso', CENTER_X, 265, 13, 1.5);

  // Lê o SVG original e substitui os blocos <text>
  let svg = fs.readFileSync(SVG_IN, 'utf8');

  // Remove a tag @import da fonte (não é mais necessária)
  svg = svg.replace(
    /\s*@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);\s*/g,
    '\n      '
  );
  svg = svg.replace(
    /\s*text \{ font-family:[^}]*\}\s*/g,
    '\n      '
  );

  // Substitui os três <text> por <path>
  svg = svg.replace(
    /<text[^>]*>SAÚDE<\/text>/,
    `<path d="${saudePath}" fill="#0e2963"/>`
  );
  svg = svg.replace(
    /<text[^>]*>DIGITAL<\/text>/,
    `<path d="${digitalPath}" fill="#0e2963"/>`
  );
  svg = svg.replace(
    /<text[^>]*>Mato Grosso<\/text>/,
    `<path d="${matoPath}" fill="#0e2963"/>`
  );

  fs.writeFileSync(SVG_IN, svg);
  console.log('✓ Texto convertido em curvas em assets/logo-saude-digital-animado.svg');
})();
