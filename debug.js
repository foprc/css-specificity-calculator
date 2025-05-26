// Debug script to test CSS parsing

// Create the mock module file temporarily
const fs = require('fs');

// Add package.json for vscode mock
const mockPackageJson = '{"name": "vscode", "main": "index.js"}';
fs.mkdirSync('./node_modules/vscode', { recursive: true });
fs.writeFileSync('./node_modules/vscode/package.json', mockPackageJson);

const mockVscode = `
module.exports = {
  Range: class {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  }
};
`;

// Create mock module
fs.writeFileSync('./node_modules/vscode/index.js', mockVscode);

const { CSSParser } = require('./out/cssParser.js');

// Mock document class
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

console.log('=== Testing comment issue ===');
const commentTest = `
        /* Main button style */
        .button /* primary button */ {
          color: red;
        }
        
        .container {
          /* Container styles */
          background: blue;
        }
      `;

console.log('Original text:');
console.log(commentTest);

// Let's see what happens to the text after comment removal
let workingText = commentTest.replace(/\/\*[\s\S]*?\*\//g, '');
console.log('\nAfter comment removal:');
console.log(workingText);

// Then after @rules removal
workingText = workingText.replace(/@[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
console.log('\nAfter @rules removal:');
console.log(workingText);

// Check what the regex finds
const cssRuleRegex = /([^{}]+?)\s*\{[^{}]*\}/gs;
let match;
let matches = [];
while ((match = cssRuleRegex.exec(workingText)) !== null) {
  const selectorText = match[1].trim();
  console.log(`\nFound match: "${selectorText}"`);
  
  // Check if it passes validation
  const isValid = isValidCSSSelector(selectorText);
  console.log(`Is valid: ${isValid}`);
  
  if (isValid) {
    const cleanedSelector = cleanSelector(selectorText);
    console.log(`Cleaned selector: "${cleanedSelector}"`);
    
    // Try to find it in original text
    const originalMatch = findSelectorInOriginalText(commentTest, cleanedSelector);
    console.log(`Found in original: ${originalMatch ? 'YES' : 'NO'}`);
    if (originalMatch) {
      console.log(`Offset: ${originalMatch.startOffset}-${originalMatch.endOffset}`);
    }
  }
  
  matches.push(selectorText);
}

// Helper functions from the CSS parser
function isValidCSSSelector(selector) {
  const trimmed = selector.trim();
  
  // Skip empty selectors
  if (!trimmed) {
    return false;
  }
  
  // Skip keyframe steps
  if (trimmed === 'from' || trimmed === 'to' || /^\d+%$/.test(trimmed)) {
    return false;
  }
  
  // Skip @rules
  if (trimmed.startsWith('@')) {
    return false;
  }
  
  // Skip lines that are clearly CSS properties (word: value;)
  if (/^[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/.test(trimmed)) {
    return false;
  }
  
  return true;
}

function cleanSelector(selector) {
  return selector
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Merge spaces
    .replace(/\s*,\s*/g, ', ') // Standardize comma separation
    .trim();
}

function findSelectorInOriginalText(text, selector) {
  // For multi-line selectors, we need a more flexible approach
  // First, try to find each part of a comma-separated selector
  if (selector.includes(',')) {
    const parts = selector.split(',').map(part => part.trim());
    const firstPart = parts[0];
    
    // Find the first part in the original text
    const escapedFirstPart = firstPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const firstPartRegex = new RegExp(`(${escapedFirstPart})`, 'i');
    const firstMatch = text.match(firstPartRegex);
    
    if (firstMatch && firstMatch.index !== undefined) {
      // Now find where this multi-line selector ends (look for the opening brace)
      const afterFirstPart = text.substring(firstMatch.index);
      const braceMatch = afterFirstPart.match(/\{/);
      
      if (braceMatch && braceMatch.index !== undefined) {
        // The selector ends just before the brace
        const beforeBrace = afterFirstPart.substring(0, braceMatch.index).trim();
        return {
          startOffset: firstMatch.index,
          endOffset: firstMatch.index + beforeBrace.length
        };
      }
    }
  }
  
  // Fallback to the original logic for single selectors
  // Escape special regex characters in the selector
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create a flexible regex that allows for whitespace variations
  const flexibleSelector = escapedSelector
    .replace(/\\s\+/g, '\\s*')  // Allow optional whitespace
    .replace(/,\\s*/g, ',\\s*') // Handle comma-separated selectors  
    .replace(/\\\s/g, '\\s+');  // Require at least one space where expected
  
  // Look for the selector followed by opening brace
  const regex = new RegExp(`(${flexibleSelector})\\s*\\{`, 'i');
  const match = text.match(regex);
  
  if (match && match.index !== undefined) {
    return {
      startOffset: match.index,
      endOffset: match.index + match[1].length
    };
  }
  
  return null;
}

const doc1 = new MockDocument(commentTest);
const rules1 = CSSParser.parseDocument(doc1);
console.log('Found rules:', rules1.length);
rules1.forEach((rule, i) => {
  console.log(`${i}: ${rule.selector}`);
});

// Test the complex pseudo-selector issue
console.log('\n=== Testing complex pseudo-selectors ===');
const complexCss = `
        table tr:nth-child(even) {
          background: #f2f2f2;
        }
        
        input:not([type="hidden"]):not([type="submit"]) {
          border: 1px solid #ccc;
        }
        
        .dropdown-menu .dropdown-item:hover:not(.disabled) {
          background-color: #f8f9fa;
        }
      `;

console.log('\nOriginal complex CSS:');
console.log(complexCss);

let workingText2 = complexCss.replace(/\/\*[\s\S]*?\*\//g, '');
workingText2 = workingText2.replace(/@[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

console.log('\nAfter processing:');
console.log(workingText2);

const cssRuleRegex2 = /([^{}]+?)\s*\{[^{}]*\}/gs;
let match2;
console.log('\nFound matches:');
while ((match2 = cssRuleRegex2.exec(workingText2)) !== null) {
  const selectorText = match2[1].trim();
  console.log(`"${selectorText}"`);
}

const doc2 = new MockDocument(complexCss);
const rules2 = CSSParser.parseDocument(doc2);
console.log('\nParsed rules:', rules2.length);
rules2.forEach((rule, i) => {
  console.log(`${i}: ${rule.selector}`);
});

console.log('\n=== Debugging input selector specifically ===');
const inputSelector = 'input:not([type="hidden"]):not([type="submit"])';
console.log(`Looking for: "${inputSelector}"`);

const inputMatch = findSelectorInOriginalText(complexCss, inputSelector);
console.log(`Found input in original: ${inputMatch ? 'YES' : 'NO'}`);
if (inputMatch) {
  console.log(`Offset: ${inputMatch.startOffset}-${inputMatch.endOffset}`);
  console.log(`Text: "${complexCss.substring(inputMatch.startOffset, inputMatch.endOffset)}"`);
}
