import * as vscode from 'vscode';
/**
 * CSS Parser for extracting CSS rules from documents
 */
export interface CSSRule {
    selector: string;
    range: vscode.Range;
    line: number;
}
export declare class CSSParser {
    /**
     * Parse CSS rules from document
     */
    static parseDocument(document: vscode.TextDocument): CSSRule[];
    /**
     * Check if it's a CSS-related file
     */
    static isCSSFile(document: vscode.TextDocument): boolean;
    /**
     * Clean selector string
     */
    static cleanSelector(selector: string): string;
    /**
     * Check if a selector is a valid CSS selector (not keyframe steps, etc.)
     */
    private static isValidCSSSelector;
    /**
     * Parse Less rules (similar to CSS for basic cases)
     */
    private static parseLessRules;
    /**
     * Find selector position in original text
     */
    private static findSelectorInOriginalText;
    /**
     * Find a selector part in text, accounting for possible comments within the selector
     */
    private static findSelectorPartInText; /**
     * Parse SCSS nested rules (simplified implementation)
     */
    private static parseScssNestedRules;
}
//# sourceMappingURL=cssParser.d.ts.map