const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'lib', 'locales', 'en.json');
const s = fs.readFileSync(file, 'utf8');

let depth = 0;
let line = 1;
let col = 0;
let inStr = false;
let esc = false;

let topLevelEnd = null;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '\n') { line++; col = 0; } else { col++; }
  if (inStr) {
    if (!esc && ch === '"') { inStr = false; }
    esc = !esc && ch === '\\';
    continue;
  }
  if (ch === '"') { inStr = true; esc = false; continue; }
  if (ch === '{') { depth++; }
  else if (ch === '}') {
    depth--;
    if (depth === 0) { topLevelEnd = { pos: i, line, col }; break; }
  }
}

console.log('Top-level end:', topLevelEnd);
console.log('Total length:', s.length);

try {
  JSON.parse(s);
  console.log('JSON parse: OK');
} catch (e) {
  console.error('JSON parse error:', e.message);
}