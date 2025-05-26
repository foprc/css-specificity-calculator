/**
 * CSS Selector Specificity Calculator
 */

export interface SpecificityResult {
  // Inline styles, ID selectors, class selectors, element selectors
  specificity: [number, number, number, number];
  // Calculated total weight
  weight: number;
  // Formatted string
  formatted: string;
}

export class SpecificityCalculator {
  /**
   * Calculate CSS selector specificity
   * @param selector CSS selector string
   * @returns Specificity result
   */
  static calculate(selector: string): SpecificityResult {
    // Remove comments and extra spaces
    const cleanSelector = selector
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Merge spaces
      .trim();

    let inline = 0;     // Inline styles (style attribute)
    let ids = 0;        // ID selectors (#id)
    let classes = 0;    // Class selectors (.class), attribute selectors ([attr]), pseudo-classes (:hover)
    let elements = 0;   // Element selectors (div, p), pseudo-elements (::before)

    // Split selectors, handle comma-separated multiple selectors
    const selectors = cleanSelector.split(',');
    
    // For multiple selectors, calculate the one with highest specificity
    let maxSpecificity: [number, number, number, number] = [0, 0, 0, 0];
    
    for (const singleSelector of selectors) {
      const result = this.calculateSingleSelector(singleSelector.trim());
      if (this.compareSpecificity(result, maxSpecificity) > 0) {
        maxSpecificity = result;
      }
    }

    const weight = maxSpecificity[0] * 1000 + maxSpecificity[1] * 100 + maxSpecificity[2] * 10 + maxSpecificity[3];
    const formatted = `(${maxSpecificity.join(',')}) = ${weight}`;

    return {
      specificity: maxSpecificity,
      weight,
      formatted
    };
  }

  /**
   * Calculate specificity for a single selector
   */
  private static calculateSingleSelector(selector: string): [number, number, number, number] {
    let inline = 0;
    let ids = 0;
    let classes = 0;
    let elements = 0;

    // Remove string content to avoid false matches
    let processedSelector = selector.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');

    // Handle :not() pseudo-class FIRST (before processing its contents separately)
    const notMatches = processedSelector.match(/:not\(([^)]+)\)/g);
    if (notMatches) {
      for (const match of notMatches) {
        const notContent = match.slice(5, -1); // Remove :not( and )
        const notResult = this.calculateSingleSelector(notContent);
        ids += notResult[1];
        classes += notResult[2];
        elements += notResult[3];
      }
      processedSelector = processedSelector.replace(/:not\([^)]+\)/g, '');
    }

    // Calculate ID selectors (#id) - including unicode characters
    const idMatches = processedSelector.match(/#[\w\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]+/g);
    if (idMatches) {
      ids += idMatches.length;
      // Remove matched ID selectors
      processedSelector = processedSelector.replace(/#[\w\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]+/g, '');
    }

    // Calculate class selectors (.class) - including unicode characters
    const classMatches = processedSelector.match(/\.[\w\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]+/g);
    if (classMatches) {
      classes += classMatches.length;
      processedSelector = processedSelector.replace(/\.[\w\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]+/g, '');
    }

    // Calculate attribute selectors ([attr], [attr=value], [attr^=value], etc.)
    const attrMatches = processedSelector.match(/\[[^\]]+\]/g);
    if (attrMatches) {
      classes += attrMatches.length;
      processedSelector = processedSelector.replace(/\[[^\]]+\]/g, '');
    }

    // Calculate pseudo-elements FIRST (::before, ::after, ::first-line, etc.)
    const pseudoElementMatches = processedSelector.match(/::[a-zA-Z\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff][a-zA-Z0-9\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]*/g);
    if (pseudoElementMatches) {
      elements += pseudoElementMatches.length;
      processedSelector = processedSelector.replace(/::[a-zA-Z\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff][a-zA-Z0-9\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]*/g, '');
    }

    // Calculate pseudo-classes (:hover, :active, :nth-child(), etc.)
    // Note: :not() doesn't count, but selectors inside :not() do count
    const pseudoClassMatches = processedSelector.match(/:(?!not\()[a-zA-Z\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff][a-zA-Z0-9\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]*(\([^)]*\))?/g);
    if (pseudoClassMatches) {
      classes += pseudoClassMatches.length;
      processedSelector = processedSelector.replace(/:(?!not\()[a-zA-Z\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff][a-zA-Z0-9\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]*(\([^)]*\))?/g, '');
    }

    // Calculate element selectors (div, p, span, etc.)
    // Remove combinators and universal selector
    processedSelector = processedSelector.replace(/[>+~\s]/g, ' ').replace(/\*/g, '');
    const elementParts = processedSelector.split(/\s+/).filter(part => part.trim() && part !== '*');
    
    for (const part of elementParts) {
      if (part.match(/^[\w\u00a0-\u9fff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff-]+$/)) {
        elements++;
      }
    }

    return [inline, ids, classes, elements];
  }

  /**
   * Compare two specificities
   * @returns 1 if a > b, -1 if a < b, 0 if equal
   */
  private static compareSpecificity(a: [number, number, number, number], b: [number, number, number, number]): number {
    for (let i = 0; i < 4; i++) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
  }
}