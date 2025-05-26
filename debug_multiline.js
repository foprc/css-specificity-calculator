const selectorText = '.nav-item,\n        .nav-link,\n        .nav-button';
console.log('Original selector:', JSON.stringify(selectorText));

// Check if it passes validation (simulation of isValidCSSSelector)
function isValidCSSSelector(selector) {
  const trimmed = selector.trim();
  
  // Skip empty selectors
  if (!trimmed) return false;
  
  // Skip keyframe steps
  if (trimmed === 'from' || trimmed === 'to' || /^\d+%$/.test(trimmed)) return false;
  
  // Skip @rules
  if (trimmed.startsWith('@')) return false;
  
  // Skip lines that are clearly CSS properties (word: value;)
  if (/^[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/.test(trimmed)) return false;
  
  return true;
}

const isValid = isValidCSSSelector(selectorText);
console.log('Is valid selector:', isValid);

if (isValid) {
  // Clean selector (simulation of cleanSelector)
  function cleanSelector(selector) {
    return selector
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Merge spaces
      .replace(/\s*,\s*/g, ', ') // Standardize comma separation
      .trim();
  }
  
  const cleaned = cleanSelector(selectorText);
  console.log('Cleaned selector:', JSON.stringify(cleaned));
  console.log('Expected:', '.nav-item, .nav-link, .nav-button');
  console.log('Match:', cleaned === '.nav-item, .nav-link, .nav-button');
}
