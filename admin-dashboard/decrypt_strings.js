const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '../src/lib/time-license.js'), 'utf8');

// The obfuscation array is defined inside time-license.js. Let's find it.
// We can extract all strings that are decoded during execution by overriding the window/global methods.
// Let's execute the script in a sandbox and intercept all string evaluations.
const mockWindow = {
  chrome: {
    storage: {
      local: {
        get: () => {},
        set: () => {}
      }
    }
  }
};
mockWindow.window = mockWindow;

const decryptedStrings = new Set();

// Let's find string patterns or run a regex to find all string literals in time-license.js
const stringRegex = /['"]([^'"]+)['"]/g;
let match;
while ((match = stringRegex.exec(code)) !== null) {
  decryptedStrings.add(match[1]);
}

console.log('Literal strings in time-license.js:');
Array.from(decryptedStrings).forEach(s => {
  if (s.length < 50) console.log('-', s);
});
