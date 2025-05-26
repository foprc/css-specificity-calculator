import { CSSParser, CSSRule } from '../src/cssParser';
import * as vscode from 'vscode';

// Mock VS Code TextDocument
class MockTextDocument implements vscode.TextDocument {
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

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }

  getText(range?: vscode.Range): string {
    if (!range) {
      return this._text;
    }
    // Simplified implementation for testing
    return this._text;
  }

  getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined {
    return undefined;
  }

  validateRange(range: vscode.Range): vscode.Range {
    return range;
  }

  validatePosition(position: vscode.Position): vscode.Position {
    return position;
  }

  offsetAt(position: vscode.Position): number {
    const lines = this._text.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    offset += position.character;
    return offset;
  }

  positionAt(offset: number): vscode.Position {
    const lines = this._text.split('\n');
    let currentOffset = 0;
    for (let line = 0; line < lines.length; line++) {
      if (currentOffset + lines[line].length >= offset) {
        return new vscode.Position(line, offset - currentOffset);
      }
      currentOffset += lines[line].length + 1; // +1 for newline
    }
    return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
  }

  lineAt(line: number): vscode.TextLine;
  lineAt(position: vscode.Position): vscode.TextLine;
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

describe('CSSParser', () => {
  describe('parseDocument', () => {
    test('should parse simple CSS rules', () => {
      const cssText = `
        .button {
          color: red;
        }
        
        #main {
          background: blue;
        }
      `;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      expect(rules[0].selector).toBe('.button');
      expect(rules[1].selector).toBe('#main');
    });

    test('should parse complex selectors', () => {
      const cssText = `
        .container .button:hover {
          color: red;
        }
        
        div > p + span[data-role="tooltip"] {
          background: blue;
        }
      `;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      expect(rules[0].selector).toBe('.container .button:hover');
      expect(rules[1].selector).toBe('div > p + span[data-role="tooltip"]');
    });

    test('should handle multi-line selectors', () => {
      const cssText = `
        .nav-item,
        .nav-link,
        .nav-button {
          display: block;
        }
      `;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(1);
      expect(rules[0].selector).toBe('.nav-item, .nav-link, .nav-button');
    });

    test('should skip @rules', () => {
      const cssText = `
        @media (max-width: 768px) {
          .mobile {
            display: block;
          }
        }
        
        @keyframes slideIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .button {
          color: red;
        }
      `;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(1);
      expect(rules[0].selector).toBe('.button');
    });

    test('should handle nested rules in SCSS', () => {
      const cssText = `
        .container {
          padding: 10px;
          
          .button {
            color: red;
          }
        }
      `;
      
      const document = new MockTextDocument(cssText, 'scss');
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      expect(rules[0].selector).toBe('.container');
      expect(rules[1].selector).toBe('.button');
    });

    test('should handle selectors with comments', () => {
      const cssText = `
        /* Main button style */
        .button /* primary button */ {
          color: red;
        }
        
        .container {
          /* Container styles */
          background: blue;
        }
      `;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      expect(rules[0].selector).toBe('.button');
      expect(rules[1].selector).toBe('.container');
    });

    test('should handle empty CSS', () => {
      const cssText = '';
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(0);
    });

    test('should handle CSS with only comments', () => {
      const cssText = `
        /* This is just a comment */
        /* Another comment */
      `;
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(0);
    });

    test('should provide correct line numbers', () => {
      const cssText = `/* Line 0 */
.first-rule { /* Line 1 */
  color: red;
}

.second-rule { /* Line 5 */
  color: blue;
}`;
      
      const document = new MockTextDocument(cssText);
      const rules = CSSParser.parseDocument(document);
      
      expect(rules).toHaveLength(2);
      expect(rules[0].line).toBe(1);
      expect(rules[1].line).toBe(5);
    });
  });

  describe('isCSSFile', () => {
    test('should return true for CSS files', () => {
      const document = new MockTextDocument('', 'css');
      expect(CSSParser.isCSSFile(document)).toBe(true);
    });

    test('should return true for SCSS files', () => {
      const document = new MockTextDocument('', 'scss');
      expect(CSSParser.isCSSFile(document)).toBe(true);
    });

    test('should return true for Sass files', () => {
      const document = new MockTextDocument('', 'sass');
      expect(CSSParser.isCSSFile(document)).toBe(true);
    });

    test('should return true for Less files', () => {
      const document = new MockTextDocument('', 'less');
      expect(CSSParser.isCSSFile(document)).toBe(true);
    });

    test('should return false for non-CSS files', () => {
      const document = new MockTextDocument('', 'javascript');
      expect(CSSParser.isCSSFile(document)).toBe(false);
    });

    test('should return false for TypeScript files', () => {
      const document = new MockTextDocument('', 'typescript');
      expect(CSSParser.isCSSFile(document)).toBe(false);
    });
  });

  describe('cleanSelector', () => {
    test('should remove comments from selector', () => {
      const selector = '.button /* comment */ .active';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('.button .active');
    });

    test('should normalize multiple spaces', () => {
      const selector = '.button    .active';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('.button .active');
    });

    test('should standardize comma separation', () => {
      const selector = '.btn,.active  ,  .disabled';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('.btn, .active, .disabled');
    });

    test('should trim whitespace', () => {
      const selector = '   .button .active   ';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('.button .active');
    });

    test('should handle complex cleaning', () => {
      const selector = '  .btn /* comment */  ,  .active   /* another */ ';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('.btn, .active');
    });

    test('should handle empty selector', () => {
      const selector = '';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('');
    });

    test('should handle selector with only comments', () => {
      const selector = '/* just a comment */';
      const cleaned = CSSParser.cleanSelector(selector);
      expect(cleaned).toBe('');
    });
  });
});
