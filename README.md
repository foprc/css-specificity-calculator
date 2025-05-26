# CSS Specificity Calculator

A VS Code extension for displaying CSS selector specificity weights.

## Features

- 🎯 **Real-time Specificity Calculation**: Automatically calculates and displays CSS selector specificity weights
- 📊 **Detailed Weight Information**: Shows detailed breakdown of (inline, ID, class/attribute/pseudo-class, element)
- 🎨 **Inline Comment Display**: Displays specificity information directly after selectors
- 🔧 **Multi-language Support**: Supports CSS, SCSS, Sass, Less, and other stylesheet files
- ⚙️ **Configurable Options**: Supports enabling/disabling features and display mode configuration

## Usage

1. After installing the extension, open any CSS-related file
2. The extension will automatically display specificity comments after each CSS rule selector
3. Specificity format: `// Specificity: (inline,ID,class,element) = total weight`

## Examples

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

#main .container .button.active { /* Specificity: (0,1,3,0) = 130 */
  background-color: red;
}
```

## CSS Specificity Rules

CSS specificity is calculated according to the following rules:

1. **Inline styles** (style attribute): weight 1000
2. **ID selectors** (#id): weight 100  
3. **Class selectors** (.class), **attribute selectors** ([attr]), **pseudo-classes** (:hover): weight 10
4. **Element selectors** (div), **pseudo-elements** (::before): weight 1

Final weight = inline count × 1000 + ID count × 100 + class count × 10 + element count × 1

## Configuration Options

- `cssSpecificity.enabled`: Enable/disable specificity calculation display
- `cssSpecificity.showInlineComments`: Whether to display inline comments

## Commands

- `CSS Specificity: Toggle`: Toggle specificity display switch

## Supported File Types

- CSS (`.css`)
- SCSS (`.scss`) 
- Sass (`.sass`)
- Less (`.less`)

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

## License

MIT License