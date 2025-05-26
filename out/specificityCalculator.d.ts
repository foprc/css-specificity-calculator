/**
 * CSS Selector Specificity Calculator
 */
export interface SpecificityResult {
    specificity: [number, number, number, number];
    weight: number;
    formatted: string;
}
export declare class SpecificityCalculator {
    /**
     * Calculate CSS selector specificity
     * @param selector CSS selector string
     * @returns Specificity result
     */
    static calculate(selector: string): SpecificityResult;
    /**
     * Calculate specificity for a single selector
     */
    private static calculateSingleSelector;
    /**
     * Compare two specificities
     * @returns 1 if a > b, -1 if a < b, 0 if equal
     */
    private static compareSpecificity;
}
//# sourceMappingURL=specificityCalculator.d.ts.map