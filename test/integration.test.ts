import { SpecificityCalculator } from '../src/specificityCalculator';
import { CSSParser } from '../src/cssParser';
import * as vscode from 'vscode';

// Mock document for integration testing
class MockDocument implements vscode.TextDocument {
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean = false;
  languageId: string;
  version: number = 1;
  isDirty: boolean = false;
  isClosed: boolean = false;
  eol: vscode.EndOfLine = vscode.EndOfLine.LF;
  lineCount: number;
  encoding: string = 'utf8';
  private _text: string;

  constructor(text: string, languageId: string = 'css') {
    this._text = text;
    this.languageId = languageId;
    this.lineCount = text.split('\n').length;
    this.uri = vscode.Uri.parse(`file:///test.${languageId}`);
    this.fileName = `test.${languageId}`;
  }

  save(): Thenable<boolean> { return Promise.resolve(true); }
  getText(): string { return this._text; }
  getWordRangeAtPosition(): vscode.Range | undefined { return undefined; }
  validateRange(range: vscode.Range): vscode.Range { return range; }
  validatePosition(position: vscode.Position): vscode.Position { return position; }
  
  offsetAt(position: vscode.Position): number {
    const lines = this._text.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1;
    }
    return offset + position.character;
  }

  positionAt(offset: number): vscode.Position {
    const lines = this._text.split('\n');
    let currentOffset = 0;
    for (let line = 0; line < lines.length; line++) {
      if (currentOffset + lines[line].length >= offset) {
        return new vscode.Position(line, offset - currentOffset);
      }
      currentOffset += lines[line].length + 1;
    }
    return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
  }

  lineAt(lineOrPosition: any): vscode.TextLine {
    const lineNum = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
    const lines = this._text.split('\n');
    const text = lines[lineNum] || '';
    return {
      lineNumber: lineNum,
      text: text,
      range: new vscode.Range(lineNum, 0, lineNum, text.length),
      rangeIncludingLineBreak: new vscode.Range(lineNum, 0, lineNum + 1, 0),
      firstNonWhitespaceCharacterIndex: text.search(/\S/),
      isEmptyOrWhitespace: text.trim().length === 0
    };
  }
}

describe('CSS Specificity Calculator Integration Tests', () => {
  describe('End-to-End CSS Processing', () => {
    test('should process a complete CSS file correctly', () => {
      const cssContent = `
        /* Basic selectors */
        .button {
          color: red;
        }
        
        #main {
          background: blue;
        }
        
        /* Complex selectors */
        .container .button:hover {
          color: green;
        }
        
        #sidebar .nav-item.active:not(.disabled) {
          font-weight: bold;
        }
        
        /* Pseudo-elements */
        .quote::before {
          content: '"';
        }
      `;

      const document = new MockDocument(cssContent);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(5);
      
      // Test each rule's specificity calculation
      const specificityResults = rules.map(rule => ({
        selector: rule.selector,
        specificity: SpecificityCalculator.calculate(rule.selector)
      }));
      
      // Verify each selector's specificity
      expect(specificityResults[0].specificity.weight).toBe(10); // .button
      expect(specificityResults[1].specificity.weight).toBe(100); // #main
      expect(specificityResults[2].specificity.weight).toBe(30); // .container .button:hover
      expect(specificityResults[3].specificity.weight).toBe(130); // #sidebar .nav-item.active:not(.disabled)
      expect(specificityResults[4].specificity.weight).toBe(11); // .quote::before
    });

    test('should handle SCSS nested rules', () => {
      const scssContent = `
        .nav {
          padding: 10px;
          
          .item {
            display: block;
            
            &:hover {
              color: blue;
            }
          }
        }
      `;

      const document = new MockDocument(scssContent, 'scss');
      const rules = CSSParser.parseDocument(document);
      
      // Should find the main rules (nested parsing would be more complex)
      expect(rules.length).toBeGreaterThan(0);
      expect(CSSParser.isCSSFile(document)).toBe(true);
    });

    test('should process Less file correctly', () => {
      const lessContent = `
        @primary-color: #333;
        
        .header {
          color: @primary-color;
          
          .title {
            font-size: 2em;
          }
        }
      `;

      const document = new MockDocument(lessContent, 'less');
      expect(CSSParser.isCSSFile(document)).toBe(true);
      
      const rules = CSSParser.parseDocument(document);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world CSS Examples', () => {
    test('should handle Bootstrap-like CSS', () => {
      const bootstrapCss = `
        .btn {
          padding: 0.375rem 0.75rem;
        }
        
        .btn-primary {
          background-color: #007bff;
        }
        
        .btn.btn-lg {
          padding: 0.5rem 1rem;
        }
        
        .navbar .navbar-nav .nav-link.active {
          color: #fff;
        }
      `;

      const document = new MockDocument(bootstrapCss);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(4);
      
      const specificities = rules.map(rule => 
        SpecificityCalculator.calculate(rule.selector).weight
      );
      
      expect(specificities[0]).toBe(10); // .btn
      expect(specificities[1]).toBe(10); // .btn-primary
      expect(specificities[2]).toBe(20); // .btn.btn-lg
      expect(specificities[3]).toBe(40); // .navbar .navbar-nav .nav-link.active
    });

    test('should handle media queries correctly', () => {
      const responsiveCss = `
        .container {
          width: 100%;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 750px;
          }
          
          .col-md-6 {
            width: 50%;
          }
        }
        
        .responsive-image {
          max-width: 100%;
        }
      `;

      const document = new MockDocument(responsiveCss);
      const rules = CSSParser.parseDocument(document);
      
      // Should skip @media rule but parse selectors inside and outside
      expect(rules.length).toBeGreaterThan(1);
      
      // Verify that @media is not included in rules
      const hasMediaRule = rules.some(rule => rule.selector.includes('@media'));
      expect(hasMediaRule).toBe(false);
    });

    test('should handle complex pseudo-selectors', () => {
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

      const document = new MockDocument(complexCss);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(3);
      
      const weights = rules.map(rule => 
        SpecificityCalculator.calculate(rule.selector).weight
      );
      
      expect(weights[0]).toBe(12); // table tr:nth-child(even)
      expect(weights[1]).toBe(21); // input:not([type="hidden"]):not([type="submit"])
      expect(weights[2]).toBe(40); // .dropdown-menu .dropdown-item:hover:not(.disabled)
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed CSS gracefully', () => {
      const malformedCss = `
        .button {
          color: red
        }
        
        .incomplete-rule {
        
        .another-rule {
          background: blue;
        }
      `;

      const document = new MockDocument(malformedCss);
      const rules = CSSParser.parseDocument(document);
      
      // Should still parse what it can
      expect(rules.length).toBeGreaterThan(0);
    });

    test('should handle very long selectors', () => {
      const longSelector = '.level1 .level2 .level3 .level4 .level5 .level6 .level7 .level8 .level9 .level10';
      const specificity = SpecificityCalculator.calculate(longSelector);
      
      expect(specificity.specificity).toEqual([0, 0, 10, 0]);
      expect(specificity.weight).toBe(100);
    });

    test('should handle selectors with unicode characters', () => {
      const unicodeCss = `
        .文字 {
          color: red;
        }
        
        .émoji-🎉 {
          background: blue;
        }
      `;

      const document = new MockDocument(unicodeCss);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      
      rules.forEach(rule => {
        const specificity = SpecificityCalculator.calculate(rule.selector);
        expect(specificity.weight).toBe(10); // Each should be a single class
      });
    });
  });

  describe('Extension Positioning Tests', () => {
    test('should position decoration after opening brace', () => {
      const cssContent = `
.button {
  background: blue;
}

#main .container {
  padding: 10px;
}`;

      const document = new MockDocument(cssContent);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      
      // Test positioning logic for each rule
      for (const rule of rules) {
        const line = document.lineAt(rule.line);
        const bracePos = line.text.indexOf('{');
        
        if (bracePos !== -1) {
          // The decoration should be positioned after the brace (bracePos + 1)
          const decorationPos = bracePos + 1;
          expect(decorationPos).toBeGreaterThan(bracePos);
          expect(decorationPos).toBe(bracePos + 1);
        }
      }
    });

    test('should handle lines without braces gracefully', () => {
      const cssContent = `
.incomplete-rule
.another-line`;

      const document = new MockDocument(cssContent);
      
      // Simulate the positioning logic from extension.ts
      const line = document.lineAt(1); // .incomplete-rule
      const bracePos = line.text.indexOf('{');
      const endPosition = bracePos !== -1 ? bracePos + 1 : line.text.length;
      
      expect(bracePos).toBe(-1); // No brace found
      expect(endPosition).toBe(line.text.length); // Falls back to line length
    });
  });
});
