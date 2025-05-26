import { SpecificityCalculator } from "../src/specificityCalculator";

// Simple test function
function test(selector: string, expected: [number, number, number, number]) {
  const result = SpecificityCalculator.calculate(selector);
  const passed =
    JSON.stringify(result.specificity) === JSON.stringify(expected);
  console.log(
    `${passed ? "✓" : "✗"} "${selector}" => ${result.formatted} ${
      passed ? "" : `(expected: (${expected.join(",")}))`
    }`
  );
  return passed;
}

console.log("CSS Specificity Calculation Tests\n");

let passedTests = 0;
let totalTests = 0;

function runTest(selector: string, expected: [number, number, number, number]) {
  totalTests++;
  if (test(selector, expected)) {
    passedTests++;
  }
}

// Basic selector tests
console.log("=== Basic Selector Tests ===");
runTest("*", [0, 0, 0, 0]); // Universal selector
runTest("div", [0, 0, 0, 1]); // Element selector
runTest(".button", [0, 0, 1, 0]); // Class selector
runTest("#main", [0, 1, 0, 0]); // ID selector

// Combined selector tests
console.log("\n=== Combined Selector Tests ===");
runTest(".container .button", [0, 0, 2, 0]); // Two classes
runTest("#sidebar .button", [0, 1, 1, 0]); // ID + class
runTest("div.container", [0, 0, 1, 1]); // Element + class
runTest("#main .container .button.active", [0, 1, 3, 0]); // ID + three classes

// Attribute selector tests
console.log("\n=== Attribute Selector Tests ===");
runTest("[data-role]", [0, 0, 1, 0]); // Attribute selector
runTest('input[type="text"]', [0, 0, 1, 1]); // Element + attribute
runTest('input[type="text"][required]', [0, 0, 2, 1]); // Element + two attributes

// Pseudo-class tests
console.log("\n=== Pseudo-class Tests ===");
runTest("a:hover", [0, 0, 1, 1]); // Element + pseudo-class
runTest("a:hover:focus", [0, 0, 2, 1]); // Element + two pseudo-classes
runTest("li:nth-child(2n+1)", [0, 0, 1, 1]); // Pseudo-class with parameter

// Pseudo-element tests
console.log("\n=== Pseudo-element Tests ===");
runTest("p::before", [0, 0, 0, 2]); // Element + pseudo-element
runTest("p::first-line::first-letter", [0, 0, 0, 3]); // Element + two pseudo-elements

// :not() pseudo-class tests
console.log("\n=== :not() Pseudo-class Tests ===");
runTest(".nav-item:not(.disabled)", [0, 0, 2, 0]); // Class + not(class)
runTest("div:not(#special)", [0, 1, 0, 1]); // Element + not(ID)
runTest("input:not([disabled]):not(.hidden)", [0, 0, 2, 1]); // Complex not

// Complex selector tests
console.log("\n=== Complex Selector Tests ===");
runTest('div > p + span[data-role="tooltip"]:hover::before', [0, 0, 2, 3]);
runTest("#header .nav-menu .item.active:hover", [0, 1, 3, 0]);
runTest("body .header .nav .item:nth-child(2n+1)", [0, 0, 4, 2]);

// Multiple selector tests (comma-separated)
console.log("\n=== Multiple Selector Tests ===");
runTest(".btn, #special-btn, div.container", [0, 1, 0, 0]); // Should take the highest
runTest("div, .class, #id", [0, 1, 0, 0]); // Should take ID weight

// Combinator tests
console.log("\n=== Combinator Tests ===");
runTest(".parent > .child", [0, 0, 2, 0]); // Child selector
runTest(".parent + .sibling", [0, 0, 2, 0]); // Adjacent sibling selector
runTest(".parent ~ .general", [0, 0, 2, 0]); // General sibling selector

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log("🎉 All tests passed!");
} else {
  console.log("❌ Some tests failed, need to check calculation logic");
}
