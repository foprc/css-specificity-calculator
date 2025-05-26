import * as vscode from 'vscode';
import { CSSParser, CSSRule } from './cssParser';
import { SpecificityCalculator } from './specificityCalculator';

/**
 * VS Code extension main entry
 */
export function activate(context: vscode.ExtensionContext) {
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
    } else {
      clearDecorations();
    }
  });

  // Listen for active editor changes
  const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(() => {
    updateDecorations();
  });

  // Listen for document changes
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
    if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
      updateDecorations();
    }
  });

  // Listen for configuration changes
  const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('cssSpecificity')) {
      updateDecorations();
    }
  });

  // Initialize
  updateDecorations();

  context.subscriptions.push(
    toggleCommand,
    onDidChangeActiveEditor,
    onDidChangeTextDocument,
    onDidChangeConfiguration,
    decorationType
  );

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
    if (!CSSParser.isCSSFile(document)) {
      clearDecorations();
      return;
    }

    try {
      const rules = CSSParser.parseDocument(document);
      const decorations: vscode.DecorationOptions[] = [];

      for (const rule of rules) {
        const result = SpecificityCalculator.calculate(rule.selector);
        
        // Get the text of the line containing the selector
        const line = document.lineAt(rule.line);
        const selectorEndPos = line.text.indexOf('{');
        // Position the decoration AFTER the opening brace, not before it
        const endPosition = selectorEndPos !== -1 ? selectorEndPos + 1 : line.text.length;
        
        const decoration: vscode.DecorationOptions = {
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
    } catch (error) {
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

/**
 * Called when extension is deactivated
 */
export function deactivate() {
  console.log('CSS Specificity Calculator extension deactivated');
}