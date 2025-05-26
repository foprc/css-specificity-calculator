// Simple test to debug findSelectorPartInText method
const fs = require('fs');
const { CSSParser } = require('./out/cssParser.js');

// Test the specific input selector
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

console.log('Testing input selector directly...');
const inputSelector = 'input:not([type="hidden"]):not([type="submit"])';

// Access the private method via hack
const result = CSSParser.findSelectorInOriginalText(complexCss, inputSelector);
console.log('Result:', result);
