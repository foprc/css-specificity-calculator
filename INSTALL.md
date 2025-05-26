# Installation and Usage Guide

## Manual Plugin Installation

1. Copy the entire project folder to the VS Code extensions directory:
   - macOS: `~/.vscode/extensions/`
   - Windows: `%USERPROFILE%\.vscode\extensions\`
   - Linux: `~/.vscode/extensions/`

2. Restart VS Code

3. Open any CSS, SCSS, Sass, or Less file, and the plugin will automatically display the specificity weight of selectors

## Development Mode

1. Open the project folder in VS Code
2. Press `F5` to start debug mode, which will open a new VS Code window
3. In the new window, open the test file `test.css` to see the effect

## Feature Demo

Open the `test.css` file, and you will see specificity comments displayed after each CSS rule:

```css
.button { /* Specificity: (0,0,1,0) = 10 */
  background-color: gray;
}

.container .button { /* Specificity: (0,0,2,0) = 20 */
  background-color: blue;
}

#sidebar .button { /* Specificity: (0,1,1,0) = 110 */
  background-color: green;
}
```

## Configuration Options

Search for "CSS Specificity" in VS Code settings to find the following configurations:

- `cssSpecificity.enabled`: Enable/disable the feature
- `cssSpecificity.showInlineComments`: Whether to display inline comments

## Commands

- `Ctrl+Shift+P` (or `Cmd+Shift+P`) to open the command palette
- Search for "Toggle CSS Specificity Display" to toggle the display switch
