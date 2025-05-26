// Debug the input selector issue specifically
console.log('Script starting...');

const fs = require('fs');

// Mock vscode module
try {
  fs.mkdirSync('./node_modules/vscode', { recursive: true });
  fs.writeFileSync('./node_modules/vscode/package.json', '{"name": "vscode", "main": "index.js"}');
  fs.writeFileSync('./node_modules/vscode/index.js', `
module.exports = {
  Range: class {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  }
};
`);
  console.log('Mock vscode created');
} catch (e) {
  console.log('Mock already exists or error:', e.message);
}

console.log('Loading CSSParser...');
const { CSSParser } = require('./out/cssParser.js');
console.log('CSSParser loaded');

class MockDocument {
  constructor(content, lang = 'css') {
    this.content = content;
    this.languageId = lang;
  }
  
  getText() {
    return this.content;
  }
  
  positionAt(offset) {
    const lines = this.content.substring(0, offset).split('\n');
    return {
      line: lines.length - 1,
      character: lines[lines.length - 1].length
    };
  }
}

console.log('Testing input selector individually...');

const inputCss = `
input:not([type="hidden"]):not([type="submit"]) {
  border: 1px solid #ccc;
}
`;

console.log('Input CSS:', JSON.stringify(inputCss));

// Let's manually step through what the parser does
const text = inputCss;

// Step 1: Remove comments
let workingText = text.replace(/\/\*[\s\S]*?\*\//g, '');
console.log('After comment removal:', JSON.stringify(workingText));

// Step 2: Remove @rules
workingText = workingText.replace(/@[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
console.log('After @rules removal:', JSON.stringify(workingText));

// Step 3: Apply CSS rule regex
const cssRuleRegex = /([^{}]+?)\s*\{[^{}]*\}/gs;
let match;
let foundSelectors = [];

while ((match = cssRuleRegex.exec(workingText)) !== null) {
  let selectorText = match[1].trim();
  console.log('Raw selector found:', JSON.stringify(selectorText));
  
  // Test validation
  function isValidCSSSelector(selector) {
    const trimmed = selector.trim();
    
    if (!trimmed) {
      console.log('  -> Invalid: empty');
      return false;
    }
    
    if (trimmed === 'from' || trimmed === 'to' || /^\d+%$/.test(trimmed)) {
      console.log('  -> Invalid: keyframe step');
      return false;
    }
    
    if (trimmed.startsWith('@')) {
      console.log('  -> Invalid: @rule');
      return false;
    }
    
    if (/^[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/.test(trimmed)) {
      console.log('  -> Invalid: CSS property');
      return false;
    }
    
    console.log('  -> Valid');
    return true;
  }
  
  const isValid = isValidCSSSelector(selectorText);
  if (isValid) {
    foundSelectors.push(selectorText);
  }
}

console.log('Found valid selectors:', foundSelectors);

const doc = new MockDocument(inputCss);
const rules = CSSParser.parseDocument(doc);

console.log(`Found ${rules.length} rules for input selector`);
if (rules.length > 0) {
  console.log(`Selector: "${rules[0].selector}"`);
} else {
  console.log('No rules found for input selector!');
}

console.log('Script complete.');
