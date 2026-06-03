// Інжектить PWA / iOS standalone мета-теги у dist/index.html після `expo export`.
// Потрібно для output:"single" (SPA) — expo-router НЕ застосовує app/+html.tsx у цьому режимі,
// тож згенерований index.html не містить manifest/apple-mobile-web-app-capable,
// і iOS Safari відкриває PWA як звичайну вкладку (з тулбаром), а не повноекранно.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = 'dist/index.html';
// Фіксований GH Pages підшлях (= app.json experiments.baseUrl). Не з env —
// щоб уникнути MSYS-конвертації шляхів у Git Bash і будь-яких сюрпризів у CI.
const base = '/kids_app';

if (!existsSync(FILE)) {
  console.error(`[inject-pwa-head] ${FILE} not found — run \`expo export -p web\` first`);
  process.exit(1);
}

let html = readFileSync(FILE, 'utf8');

if (html.includes('apple-mobile-web-app-capable')) {
  console.log('[inject-pwa-head] PWA head already present — skip');
  process.exit(0);
}

const tags = `
    <link rel="manifest" href="${base}/manifest.json" />
    <meta name="theme-color" content="#6C5CE7" />
    <link rel="apple-touch-icon" href="${base}/icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Школярик" />
    <link rel="icon" type="image/png" href="${base}/favicon.png" />
`;

// Заодно гарантуємо viewport-fit=cover (для коректного відображення під notch у standalone)
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

html = html.replace('</head>', `${tags}  </head>`);
writeFileSync(FILE, html);
console.log('[inject-pwa-head] Injected PWA/iOS standalone head tags');
