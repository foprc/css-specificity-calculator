import * as vscode from 'vscode';

/**
 * CSS Parser for extracting CSS rules from documents
 */
export interface CSSRule {
  selector: string;
  range: vscode.Range;
  line: number;
}

export class CSSParser {
  /**
   * Parse CSS rules from document
   */
  static parseDocument(document: vscode.TextDocument): CSSRule[] {
    const rules: CSSRule[] = [];
    const text = document.getText();
    
    // Handle SCSS nested rules if document is SCSS
    if (document.languageId === 'scss') {
      return this.parseScssNestedRules(document, text);
    }
    
    // Handle Less files
    if (document.languageId === 'less') {
      return this.parseLessRules(document, text);
    }
    
    // Remove comments first
    let workingText = text.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove @rules content completely to avoid parsing their internal selectors
    workingText = workingText.replace(/@[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    
    // Use a more robust regex for CSS rules that handles multi-line selectors
    const cssRuleRegex = /([^{}]+?)\s*\{[^{}]*\}/gs;
    let match;
    
    while ((match = cssRuleRegex.exec(workingText)) !== null) {
      let selectorText = match[1].trim();
      
      // Skip empty selectors
      if (!selectorText) {
        continue;
      }
      
      // Skip @rules that might have been missed
      if (selectorText.startsWith('@')) {
        continue;
      }
      
      // Skip keyframe steps and other invalid selectors
      if (this.isValidCSSSelector(selectorText)) {
        // Clean and normalize the selector
        const cleanedSelector = this.cleanSelector(selectorText);
        if (cleanedSelector) {
          // Find the original position in the document
          const originalMatch = this.findSelectorInOriginalText(text, cleanedSelector);
          if (originalMatch) {
            const startPosition = document.positionAt(originalMatch.startOffset);
            const endPosition = document.positionAt(originalMatch.endOffset);
            
            rules.push({
              selector: cleanedSelector,
              range: new vscode.Range(startPosition, endPosition),
              line: startPosition.line  // TODO: Check if test expects 0-based or 1-based
            });
          }
        }
      }
    }
    
    return rules;
  }

  /**
   * Check if it's a CSS-related file
   */
  static isCSSFile(document: vscode.TextDocument): boolean {
    const supportedLanguages = ['css', 'scss', 'sass', 'less'];
    return supportedLanguages.includes(document.languageId);
  }

  /**
   * Clean selector string
   */
  static cleanSelector(selector: string): string {
    return selector
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Merge spaces
      .replace(/\s*,\s*/g, ', ') // Standardize comma separation
      .trim();
  }

  /**
   * Check if a selector is a valid CSS selector (not keyframe steps, etc.)
   */
  private static isValidCSSSelector(selector: string): boolean {
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
    // But be more careful to not match pseudo-selectors
    // A CSS property should be a simple word followed by colon and value, possibly ending with semicolon
    // and should NOT contain selector-like characters
    if (/^[a-zA-Z-]+\s*:\s*[^;:()[\]]+;?\s*$/.test(trimmed) && 
        !trimmed.includes('(') && 
        !trimmed.includes('[') && 
        !trimmed.includes('.') && 
        !trimmed.includes('#')) {
      return false;
    }
    
    return true;
  }

  /**
   * Parse Less rules (similar to CSS for basic cases)
   */
  private static parseLessRules(document: vscode.TextDocument, text: string): CSSRule[] {
    const rules: CSSRule[] = [];
    
    // Remove comments first (both /* */ and // style)
    let workingText = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    
    // Remove Less variable declarations (e.g., @primary-color: #333;)
    workingText = workingText.replace(/@[a-zA-Z][a-zA-Z0-9_-]*\s*:\s*[^;]+;/g, '');
    
    // Remove @rules content completely to avoid parsing their internal selectors
    workingText = workingText.replace(/@[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    
    // Use a more robust regex for CSS rules that handles multi-line selectors
    const cssRuleRegex = /([^{}]+?)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
    let match;
    
    while ((match = cssRuleRegex.exec(workingText)) !== null) {
      let selectorText = match[1].trim();
      
      // Skip empty selectors
      if (!selectorText) {
        continue;
      }
      
      // Skip @rules that might have been missed
      if (selectorText.startsWith('@')) {
        continue;
      }
      
      // Skip Less variables
      if (selectorText.includes(':') && selectorText.match(/^@[a-zA-Z][a-zA-Z0-9_-]*\s*:/)) {
        continue;
      }
      
      // Skip keyframe steps and other invalid selectors
      if (this.isValidCSSSelector(selectorText)) {
        // Clean and normalize the selector
        const cleanedSelector = this.cleanSelector(selectorText);
        if (cleanedSelector) {
          // Find the original position in the document
          const originalMatch = this.findSelectorInOriginalText(text, cleanedSelector);
          if (originalMatch) {
            const startPosition = document.positionAt(originalMatch.startOffset);
            const endPosition = document.positionAt(originalMatch.endOffset);
            
            rules.push({
              selector: cleanedSelector,
              range: new vscode.Range(startPosition, endPosition),
              line: startPosition.line
            });
          }
        }
      }
    }
    
    return rules;
  }

  /**
   * Find selector position in original text
   */
  private static findSelectorInOriginalText(text: string, selector: string): { startOffset: number; endOffset: number } | null {
    // For multi-line selectors, we need a more flexible approach
    // First, try to find each part of a comma-separated selector
    if (selector.includes(',')) {
      const parts = selector.split(',').map(part => part.trim());
      const firstPart = parts[0];
      
      // Find the first part in the original text (allowing for comments)
      const match = this.findSelectorPartInText(text, firstPart);
      if (match) {
        // Now find where this multi-line selector ends (look for the opening brace)
        const afterFirstPart = text.substring(match.startOffset);
        const braceMatch = afterFirstPart.match(/\{/);
        
        if (braceMatch && braceMatch.index !== undefined) {
          // The selector ends just before the brace
          const beforeBrace = afterFirstPart.substring(0, braceMatch.index).trim();
          return {
            startOffset: match.startOffset,
            endOffset: match.startOffset + beforeBrace.length
          };
        }
      }
    }
    
    // For single selectors, try to find the exact match allowing for comments
    return this.findSelectorPartInText(text, selector);
  }

  /**
   * Find a selector part in text, accounting for possible comments within the selector
   */
  private static findSelectorPartInText(text: string, selector: string): { startOffset: number; endOffset: number } | null {
    // Strategy 1: Look for exact match first (simple case)
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex = new RegExp(`(${escapedSelector})\\s*\\{`, 'i');
    let match = text.match(regex);
    
    if (match && match.index !== undefined) {
      return {
        startOffset: match.index,
        endOffset: match.index + match[1].length
      };
    }
    
    // Strategy 2: Handle comments within selectors by splitting around spaces
    const tokens = selector.split(/\s+/).filter(token => token.length > 0);
    if (tokens.length > 1) {
      // For multi-token selectors, create a flexible regex that allows comments between tokens
      const tokenRegexes = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const flexiblePattern = tokenRegexes.join('(?:\\s*\\/\\*[^*]*\\*\\/\\s*|\\s+)');
      regex = new RegExp(`(${flexiblePattern})\\s*\\{`, 'i');
      match = text.match(regex);
      
      if (match && match.index !== undefined) {
        // Find the actual end of the selector (before the brace)
        const beforeBrace = match[1].replace(/\s*$/, ''); // Remove trailing whitespace
        return {
          startOffset: match.index,
          endOffset: match.index + beforeBrace.length
        };
      }
    }
    
    // Strategy 3: For single-token selectors with possible inline comments
    // Look for the token followed by optional comment followed by brace
    const token = tokens[0] || selector;
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regex = new RegExp(`(${escapedToken}(?:\\s*\\/\\*[^*]*\\*\\/\\s*)?)\\s*\\{`, 'i');
    match = text.match(regex);
    
    if (match && match.index !== undefined) {
      const beforeBrace = match[1].replace(/\s*$/, ''); // Remove trailing whitespace
      return {
        startOffset: match.index,
        endOffset: match.index + beforeBrace.length
      };
    }
    
    // Strategy 4: Very flexible fallback - find any occurrence and look for brace
    regex = new RegExp(`(${escapedSelector})`, 'i');
    match = text.match(regex);
    
    if (match && match.index !== undefined) {
      // Look for the next opening brace from this position
      const afterMatch = text.substring(match.index);
      const braceMatch = afterMatch.match(/\{/);
      
      if (braceMatch && braceMatch.index !== undefined) {
        // The selector is everything between the match and the brace
        const fullSelector = afterMatch.substring(0, braceMatch.index).trim();
        return {
          startOffset: match.index,
          endOffset: match.index + fullSelector.length
        };
      }
    }
    
    return null;
  }  /**
   * Parse SCSS nested rules (simplified implementation)
   */
  private static parseScssNestedRules(document: vscode.TextDocument, text: string): CSSRule[] {
    const rules: CSSRule[] = [];
    
    // Remove comments first
    const textWithoutComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    
    // Strategy 1: Find top-level selectors (like .container)
    const topLevelRegex = /([^{}]+?)\s*\{[^{}]*\{[^{}]*\}[^{}]*\}/gs;
    let match;
    
    while ((match = topLevelRegex.exec(textWithoutComments)) !== null) {
      let selectorText = match[1].trim();
      
      if (selectorText && !selectorText.startsWith('@') && !selectorText.startsWith('$') && this.isValidCSSSelector(selectorText)) {
        const cleanedSelector = this.cleanSelector(selectorText);
        if (cleanedSelector) {
          const originalMatch = this.findSelectorInOriginalText(text, cleanedSelector);
          if (originalMatch) {
            const startPosition = document.positionAt(originalMatch.startOffset);
            const endPosition = document.positionAt(originalMatch.endOffset);
            
            rules.push({
              selector: cleanedSelector,
              range: new vscode.Range(startPosition, endPosition),
              line: startPosition.line
            });
          }
        }
      }
    }
    
    // Strategy 2: Find nested selectors (like .button inside .container)
    const nestedRegex = /\{[^{}]*?([.#][a-zA-Z][a-zA-Z0-9_-]*)\s*\{[^{}]*\}/gs;
    let nestedMatch;
    
    while ((nestedMatch = nestedRegex.exec(textWithoutComments)) !== null) {
      let nestedSelector = nestedMatch[1].trim();
      
      if (nestedSelector && !nestedSelector.startsWith('@') && !nestedSelector.startsWith('$') && this.isValidCSSSelector(nestedSelector)) {
        const cleanedSelector = this.cleanSelector(nestedSelector);
        if (cleanedSelector) {
          // Make sure we don't add duplicates
          const exists = rules.some(rule => rule.selector === cleanedSelector);
          if (!exists) {
            const originalMatch = this.findSelectorInOriginalText(text, cleanedSelector);
            if (originalMatch) {
              const startPosition = document.positionAt(originalMatch.startOffset);
              const endPosition = document.positionAt(originalMatch.endOffset);
              
              rules.push({
                selector: cleanedSelector,
                range: new vscode.Range(startPosition, endPosition),
                line: startPosition.line
              });
            }
          }
        }
      }
    }
    
    return rules;
  }
}