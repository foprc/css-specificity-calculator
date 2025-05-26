import { SpecificityCalculator, SpecificityResult } from '../src/specificityCalculator';

describe('SpecificityCalculator', () => {
  describe('Basic Selectors', () => {
    test('universal selector should have zero specificity', () => {
      const result = SpecificityCalculator.calculate('*');
      expect(result.specificity).toEqual([0, 0, 0, 0]);
      expect(result.weight).toBe(0);
    });

    test('element selector should count as 1 element', () => {
      const result = SpecificityCalculator.calculate('div');
      expect(result.specificity).toEqual([0, 0, 0, 1]);
      expect(result.weight).toBe(1);
    });

    test('class selector should count as 1 class', () => {
      const result = SpecificityCalculator.calculate('.button');
      expect(result.specificity).toEqual([0, 0, 1, 0]);
      expect(result.weight).toBe(10);
    });

    test('ID selector should count as 1 ID', () => {
      const result = SpecificityCalculator.calculate('#main');
      expect(result.specificity).toEqual([0, 1, 0, 0]);
      expect(result.weight).toBe(100);
    });
  });

  describe('Attribute Selectors', () => {
    test('simple attribute selector should count as 1 class', () => {
      const result = SpecificityCalculator.calculate('[data-role]');
      expect(result.specificity).toEqual([0, 0, 1, 0]);
      expect(result.weight).toBe(10);
    });

    test('attribute selector with value should count as 1 class', () => {
      const result = SpecificityCalculator.calculate('[type="text"]');
      expect(result.specificity).toEqual([0, 0, 1, 0]);
      expect(result.weight).toBe(10);
    });

    test('multiple attribute selectors should count separately', () => {
      const result = SpecificityCalculator.calculate('input[type="text"][required]');
      expect(result.specificity).toEqual([0, 0, 2, 1]);
      expect(result.weight).toBe(21);
    });

    test('attribute selector with complex value should work', () => {
      const result = SpecificityCalculator.calculate('[data-role="tooltip-button"]');
      expect(result.specificity).toEqual([0, 0, 1, 0]);
      expect(result.weight).toBe(10);
    });
  });

  describe('Pseudo-classes', () => {
    test('simple pseudo-class should count as 1 class', () => {
      const result = SpecificityCalculator.calculate('a:hover');
      expect(result.specificity).toEqual([0, 0, 1, 1]);
      expect(result.weight).toBe(11);
    });

    test('multiple pseudo-classes should count separately', () => {
      const result = SpecificityCalculator.calculate('a:hover:focus');
      expect(result.specificity).toEqual([0, 0, 2, 1]);
      expect(result.weight).toBe(21);
    });

    test('functional pseudo-class should count as 1 class', () => {
      const result = SpecificityCalculator.calculate('li:nth-child(2n+1)');
      expect(result.specificity).toEqual([0, 0, 1, 1]);
      expect(result.weight).toBe(11);
    });

    test('complex functional pseudo-class should work', () => {
      const result = SpecificityCalculator.calculate('tr:nth-of-type(odd)');
      expect(result.specificity).toEqual([0, 0, 1, 1]);
      expect(result.weight).toBe(11);
    });
  });

  describe('Pseudo-elements', () => {
    test('single pseudo-element should count as 1 element', () => {
      const result = SpecificityCalculator.calculate('p::before');
      expect(result.specificity).toEqual([0, 0, 0, 2]);
      expect(result.weight).toBe(2);
    });

    test('multiple pseudo-elements should count separately', () => {
      const result = SpecificityCalculator.calculate('p::first-line::first-letter');
      expect(result.specificity).toEqual([0, 0, 0, 3]);
      expect(result.weight).toBe(3);
    });

    test('pseudo-element with element should count both', () => {
      const result = SpecificityCalculator.calculate('div::after');
      expect(result.specificity).toEqual([0, 0, 0, 2]);
      expect(result.weight).toBe(2);
    });
  });

  describe(':not() Pseudo-class', () => {
    test(':not() with class should count the class but not :not()', () => {
      const result = SpecificityCalculator.calculate('.nav-item:not(.disabled)');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test(':not() with ID should count the ID', () => {
      const result = SpecificityCalculator.calculate('div:not(#special)');
      expect(result.specificity).toEqual([0, 1, 0, 1]);
      expect(result.weight).toBe(101);
    });

    test(':not() with element should count the element', () => {
      const result = SpecificityCalculator.calculate('.item:not(span)');
      expect(result.specificity).toEqual([0, 0, 1, 1]);
      expect(result.weight).toBe(11);
    });

    test('multiple :not() should count contents separately', () => {
      const result = SpecificityCalculator.calculate('input:not([disabled]):not(.hidden)');
      expect(result.specificity).toEqual([0, 0, 2, 1]);
      expect(result.weight).toBe(21);
    });
  });

  describe('Combination Selectors', () => {
    test('descendant combinator should count all parts', () => {
      const result = SpecificityCalculator.calculate('.container .button');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('child combinator should count all parts', () => {
      const result = SpecificityCalculator.calculate('.parent > .child');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('adjacent sibling combinator should count all parts', () => {
      const result = SpecificityCalculator.calculate('.parent + .sibling');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('general sibling combinator should count all parts', () => {
      const result = SpecificityCalculator.calculate('.parent ~ .general');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('complex combination with ID and classes', () => {
      const result = SpecificityCalculator.calculate('#sidebar .button');
      expect(result.specificity).toEqual([0, 1, 1, 0]);
      expect(result.weight).toBe(110);
    });

    test('element with class should count both', () => {
      const result = SpecificityCalculator.calculate('div.container');
      expect(result.specificity).toEqual([0, 0, 1, 1]);
      expect(result.weight).toBe(11);
    });
  });

  describe('Complex Selectors', () => {
    test('highly complex selector should count all parts correctly', () => {
      const result = SpecificityCalculator.calculate('div > p + span[data-role="tooltip"]:hover::before');
      expect(result.specificity).toEqual([0, 0, 2, 4]);
      expect(result.weight).toBe(24);
    });

    test('ID with multiple classes and pseudo-class', () => {
      const result = SpecificityCalculator.calculate('#header .nav-menu .item.active:hover');
      expect(result.specificity).toEqual([0, 1, 4, 0]);
      expect(result.weight).toBe(140);
    });

    test('deeply nested selector with multiple types', () => {
      const result = SpecificityCalculator.calculate('body .header .nav .item:nth-child(2n+1)');
      expect(result.specificity).toEqual([0, 0, 4, 1]);
      expect(result.weight).toBe(41);
    });

    test('selector with maximum complexity', () => {
      const result = SpecificityCalculator.calculate('#main .container .button.active');
      expect(result.specificity).toEqual([0, 1, 3, 0]);
      expect(result.weight).toBe(130);
    });
  });

  describe('Multiple Selectors (Comma-separated)', () => {
    test('should return highest specificity from multiple selectors', () => {
      const result = SpecificityCalculator.calculate('.btn, #special-btn, div.container');
      expect(result.specificity).toEqual([0, 1, 0, 0]); // #special-btn has highest
      expect(result.weight).toBe(100);
    });

    test('should handle mixed complexity selectors', () => {
      const result = SpecificityCalculator.calculate('div, .class, #id');
      expect(result.specificity).toEqual([0, 1, 0, 0]); // #id has highest
      expect(result.weight).toBe(100);
    });

    test('should work with complex selectors separated by commas', () => {
      const result = SpecificityCalculator.calculate('.nav .item, #main .button, body div');
      expect(result.specificity).toEqual([0, 1, 1, 0]); // #main .button has highest
      expect(result.weight).toBe(110);
    });
  });

  describe('Edge Cases', () => {
    test('empty selector should return zero specificity', () => {
      const result = SpecificityCalculator.calculate('');
      expect(result.specificity).toEqual([0, 0, 0, 0]);
      expect(result.weight).toBe(0);
    });

    test('whitespace-only selector should return zero specificity', () => {
      const result = SpecificityCalculator.calculate('   ');
      expect(result.specificity).toEqual([0, 0, 0, 0]);
      expect(result.weight).toBe(0);
    });

    test('should handle selectors with comments', () => {
      const result = SpecificityCalculator.calculate('.button /* comment */ .active');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('should handle selectors with extra spaces', () => {
      const result = SpecificityCalculator.calculate('  .container    .button  ');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });

    test('should handle malformed but parseable selectors', () => {
      const result = SpecificityCalculator.calculate('.button.active');
      expect(result.specificity).toEqual([0, 0, 2, 0]);
      expect(result.weight).toBe(20);
    });
  });

  describe('Formatted Output', () => {
    test('should format specificity correctly', () => {
      const result = SpecificityCalculator.calculate('#main .button:hover');
      expect(result.formatted).toBe('(0,1,2,0) = 120');
    });

    test('should format zero specificity correctly', () => {
      const result = SpecificityCalculator.calculate('*');
      expect(result.formatted).toBe('(0,0,0,0) = 0');
    });

    test('should format complex specificity correctly', () => {
      const result = SpecificityCalculator.calculate('div.container#main:hover::before');
      expect(result.formatted).toBe('(0,1,2,2) = 122');
    });
  });
});
