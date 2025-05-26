"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const cssParser_1 = require("./cssParser");
const specificityCalculator_1 = require("./specificityCalculator");
/**
 * VS Code extension main entry
 */
function activate(context) {
    console.log('CSS Specificity Calculator extension activated');
    const decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            color: new vscode.ThemeColor('editorCodeLens.foreground'),
            fontStyle: 'italic',
            margin: '0 0 0 1em'
        }
    });
    // Register command
    const toggleCommand = vscode.commands.registerCommand('cssSpecificity.toggle', () => {
        const config = vscode.workspace.getConfiguration('cssSpecificity');
        const currentValue = config.get('enabled', true);
        config.update('enabled', !currentValue, vscode.ConfigurationTarget.Workspace);
        if (!currentValue) {
            updateDecorations();
        }
        else {
            clearDecorations();
        }
    });
    // Listen for active editor changes
    const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(() => {
        updateDecorations();
    });
    // Listen for document changes
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            updateDecorations();
        }
    });
    // Listen for configuration changes
    const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('cssSpecificity')) {
            updateDecorations();
        }
    });
    // Initialize
    updateDecorations();
    context.subscriptions.push(toggleCommand, onDidChangeActiveEditor, onDidChangeTextDocument, onDidChangeConfiguration, decorationType);
    /**
     * Update decorations
     */
    function updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const config = vscode.workspace.getConfiguration('cssSpecificity');
        const enabled = config.get('enabled', true);
        const showInlineComments = config.get('showInlineComments', true);
        if (!enabled || !showInlineComments) {
            clearDecorations();
            return;
        }
        const document = editor.document;
        if (!cssParser_1.CSSParser.isCSSFile(document)) {
            clearDecorations();
            return;
        }
        try {
            const rules = cssParser_1.CSSParser.parseDocument(document);
            const decorations = [];
            for (const rule of rules) {
                const result = specificityCalculator_1.SpecificityCalculator.calculate(rule.selector);
                // Get the text of the line containing the selector
                const line = document.lineAt(rule.line);
                const selectorEndPos = line.text.indexOf('{');
                // Position the decoration AFTER the opening brace, not before it
                const endPosition = selectorEndPos !== -1 ? selectorEndPos + 1 : line.text.length;
                const decoration = {
                    range: new vscode.Range(rule.line, endPosition, rule.line, endPosition),
                    renderOptions: {
                        after: {
                            contentText: ` // Specificity: ${result.formatted}`
                        }
                    }
                };
                decorations.push(decoration);
            }
            editor.setDecorations(decorationType, decorations);
        }
        catch (error) {
            console.error('Error parsing CSS:', error);
            clearDecorations();
        }
    }
    /**
     * Clear decorations
     */
    function clearDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.setDecorations(decorationType, []);
        }
    }
}
exports.activate = activate;
/**
 * Called when extension is deactivated
 */
function deactivate() {
    console.log('CSS Specificity Calculator extension deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map