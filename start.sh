#!/bin/bash

echo "🚀 CSS Specificity Calculator Extension Startup Script"
echo "================================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script in the project root directory"
    exit 1
fi

# Compile the project
echo "📦 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed, please check the code"
    exit 1
fi

# Display next steps
echo ""
echo "🎉 Extension is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Open this project folder in VS Code"
echo "2. Press F5 to start debug mode"
echo "3. Open test.css file in the new window to see the effect"
echo ""
echo "💡 Or install manually:"
echo "1. Copy this folder to ~/.vscode/extensions/"
echo "2. Restart VS Code"
echo ""
echo "📖 For more information, see README.md and INSTALL.md"
