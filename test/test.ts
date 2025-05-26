import { SpecificityCalculator } from '../src/specificityCalculator';

// 简单测试函数
function test(selector: string, expected: [number, number, number, number]) {
  const result = SpecificityCalculator.calculate(selector);
  const passed = JSON.stringify(result.specificity) === JSON.stringify(expected);
  console.log(`${passed ? '✓' : '✗'} "${selector}" => ${result.formatted} ${passed ? '' : `(expected: (${expected.join(',')}))`}`);
  return passed;
}

console.log('CSS 优先级计算测试\n');

let passedTests = 0;
let totalTests = 0;

function runTest(selector: string, expected: [number, number, number, number]) {
  totalTests++;
  if (test(selector, expected)) {
    passedTests++;
  }
}

// 基础选择器测试
console.log('=== 基础选择器测试 ===');
runTest('*', [0, 0, 0, 0]);  // 通配符
runTest('div', [0, 0, 0, 1]);  // 元素选择器
runTest('.button', [0, 0, 1, 0]);  // 类选择器
runTest('#main', [0, 1, 0, 0]);  // ID选择器

// 组合选择器测试
console.log('\n=== 组合选择器测试 ===');
runTest('.container .button', [0, 0, 2, 0]);  // 两个类
runTest('#sidebar .button', [0, 1, 1, 0]);  // ID + 类
runTest('div.container', [0, 0, 1, 1]);  // 元素 + 类
runTest('#main .container .button.active', [0, 1, 3, 0]);  // ID + 三个类

// 属性选择器测试
console.log('\n=== 属性选择器测试 ===');
runTest('[data-role]', [0, 0, 1, 0]);  // 属性选择器
runTest('input[type="text"]', [0, 0, 1, 1]);  // 元素 + 属性
runTest('input[type="text"][required]', [0, 0, 2, 1]);  // 元素 + 两个属性

// 伪类测试
console.log('\n=== 伪类测试 ===');
runTest('a:hover', [0, 0, 1, 1]);  // 元素 + 伪类
runTest('a:hover:focus', [0, 0, 2, 1]);  // 元素 + 两个伪类
runTest('li:nth-child(2n+1)', [0, 0, 1, 1]);  // 带参数的伪类

// 伪元素测试
console.log('\n=== 伪元素测试 ===');
runTest('p::before', [0, 0, 0, 2]);  // 元素 + 伪元素
runTest('p::first-line::first-letter', [0, 0, 0, 3]);  // 元素 + 两个伪元素

// :not() 伪类测试
console.log('\n=== :not() 伪类测试 ===');
runTest('.nav-item:not(.disabled)', [0, 0, 2, 0]);  // 类 + not(类)
runTest('div:not(#special)', [0, 1, 0, 1]);  // 元素 + not(ID)
runTest('input:not([disabled]):not(.hidden)', [0, 0, 2, 1]);  // 复杂not

// 复杂选择器测试
console.log('\n=== 复杂选择器测试 ===');
runTest('div > p + span[data-role="tooltip"]:hover::before', [0, 0, 2, 3]);
runTest('#header .nav-menu .item.active:hover', [0, 1, 3, 0]);
runTest('body .header .nav .item:nth-child(2n+1)', [0, 0, 4, 2]);

// 多选择器测试（逗号分隔）
console.log('\n=== 多选择器测试 ===');
runTest('.btn, #special-btn, div.container', [0, 1, 0, 0]);  // 应该取最高的
runTest('div, .class, #id', [0, 1, 0, 0]);  // 应该取ID的权重

// 组合符测试
console.log('\n=== 组合符测试 ===');
runTest('.parent > .child', [0, 0, 2, 0]);  // 子选择器
runTest('.parent + .sibling', [0, 0, 2, 0]);  // 相邻兄弟选择器
runTest('.parent ~ .general', [0, 0, 2, 0]);  // 通用兄弟选择器

console.log(`\n=== 测试结果 ===`);
console.log(`通过: ${passedTests}/${totalTests}`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 所有测试通过！');
} else {
  console.log('❌ 部分测试失败，需要检查计算逻辑');
}
