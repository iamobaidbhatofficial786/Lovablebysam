const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const config = require('./obfuscate-config.json');

const filesToObfuscate = [
  'security-hardening.js',
  'extension-config.js',
  'license-guard.js',
  'lovable-auth.js',
  'lovable-feature-api.js',
  'user-messages.js',
  'content-bridge.js',
  'pageHook.js',
  'content-templates.js',
  'sidepanel-templates.js',
  'sounds.js',
  'hwFingerprint.js',
  'sidepanel.js',
  'content.js',
  'background.js'
];

const outputDir = path.join(__dirname, 'dist');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function copyAssets() {
  const items = [
    'manifest.json',
    'sidepanel.html',
    'sidepanel.css',
    'theme.css',
    'floating.css',
    'jszip.min.js',
    'assets',
    'sounds'
  ];
  items.forEach(item => {
    const src = path.join(__dirname, item);
    const dst = path.join(outputDir, item);
    if (fs.existsSync(src)) {
      if (fs.lstatSync(src).isDirectory()) {
        fs.cpSync(src, dst, { recursive: true });
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  });
}

filesToObfuscate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} (not found)`);
    return;
  }
  console.log(`Obfuscating ${file}...`);
  const code = fs.readFileSync(filePath, 'utf8');
  // Service workers (background.js) and content scripts cannot run
  // debugProtection (uses setInterval+debugger which is blocked in SW
  // and breaks page CSP in content scripts) or selfDefending (Function
  // toString traps that crash in non-DOM contexts).
  const isServiceWorker = file === 'background.js';
  // Any script that runs inside a web page (isolated OR MAIN world) must
  // skip debugProtection/selfDefending/controlFlowFlattening — those break
  // Lovable's React app (setInterval+debugger freezes the page, so the
  // project list never loads) and violate page CSP.
  const isContentScript = [
    'content.js',
    'content-bridge.js',
    'content-lite.js',
    'content-templates.js',
    'pageHook.js',
    'prompt-guard.js',
    'fix-prompt-rewrite.js',
    'license-guard.js',
    'security-hardening.js',
    'extension-config.js'
  ].includes(file);
  let fileConfig = config;
  if (isServiceWorker || isContentScript) {
    fileConfig = Object.assign({}, config, {
      debugProtection: false,
      debugProtectionInterval: 0,
      selfDefending: false,
      disableConsoleOutput: false,
      controlFlowFlattening: false,
      deadCodeInjection: false
    });
  }
  const result = JavaScriptObfuscator.obfuscate(code, fileConfig);
  fs.writeFileSync(path.join(outputDir, file), result.getObfuscatedCode());
  console.log(`  -> dist/${file}${(isServiceWorker || isContentScript) ? ' (safe mode)' : ''}`);
});

copyAssets();
console.log('\nDone! Obfuscated files are in dist/');
