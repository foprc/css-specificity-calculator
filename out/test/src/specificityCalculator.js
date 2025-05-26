"use strict";
/**
 * CSS 选择器优先级计算器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificityCalculator = void 0;
class SpecificityCalculator {
    /**
     * 计算 CSS 选择器的优先级
     * @param selector CSS 选择器字符串
     * @returns 优先级结果
     */
    static calculate(selector) {
        // 移除注释和多余空格
        const cleanSelector = selector
            .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
            .replace(/\s+/g, ' ') // 合并空格
            .trim();
        let inline = 0; // 内联样式 (style属性)
        let ids = 0; // ID选择器 (#id)
        let classes = 0; // 类选择器 (.class)、属性选择器 ([attr])、伪类 (:hover)
        let elements = 0; // 元素选择器 (div, p)、伪元素 (::before)
        // 分割选择器，处理逗号分隔的多个选择器
        const selectors = cleanSelector.split(',');
        // 对于多个选择器，计算最高优先级的那个
        let maxSpecificity = [0, 0, 0, 0];
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
     * 计算单个选择器的优先级
     */
    static calculateSingleSelector(selector) {
        let inline = 0;
        let ids = 0;
        let classes = 0;
        let elements = 0;
        // 移除字符串内容避免误匹配
        let processedSelector = selector.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');
        // 计算 ID 选择器 (#id)
        const idMatches = processedSelector.match(/#[a-zA-Z][\w-]*/g);
        if (idMatches) {
            ids += idMatches.length;
            // 移除已匹配的ID选择器
            processedSelector = processedSelector.replace(/#[a-zA-Z][\w-]*/g, '');
        }
        // 计算类选择器 (.class)
        const classMatches = processedSelector.match(/\.[a-zA-Z][\w-]*/g);
        if (classMatches) {
            classes += classMatches.length;
            processedSelector = processedSelector.replace(/\.[a-zA-Z][\w-]*/g, '');
        }
        // 计算属性选择器 ([attr], [attr=value], [attr^=value], etc.)
        const attrMatches = processedSelector.match(/\[[^\]]+\]/g);
        if (attrMatches) {
            classes += attrMatches.length;
            processedSelector = processedSelector.replace(/\[[^\]]+\]/g, '');
        }
        // 计算伪类 (:hover, :active, :nth-child(), etc.)
        // 注意：:not() 不算在内，但 :not() 内的选择器要算
        const pseudoClassMatches = processedSelector.match(/:(?!not\()[a-zA-Z][a-zA-Z0-9-]*(\([^)]*\))?/g);
        if (pseudoClassMatches) {
            classes += pseudoClassMatches.length;
            processedSelector = processedSelector.replace(/:(?!not\()[a-zA-Z][a-zA-Z0-9-]*(\([^)]*\))?/g, '');
        }
        // 处理 :not() 伪类
        const notMatches = processedSelector.match(/:not\(([^)]+)\)/g);
        if (notMatches) {
            for (const match of notMatches) {
                const notContent = match.slice(5, -1); // 去掉 :not( 和 )
                const notResult = this.calculateSingleSelector(notContent);
                ids += notResult[1];
                classes += notResult[2];
                elements += notResult[3];
            }
            processedSelector = processedSelector.replace(/:not\([^)]+\)/g, '');
        }
        // 计算伪元素 (::before, ::after, ::first-line, etc.)
        const pseudoElementMatches = processedSelector.match(/::[a-zA-Z][a-zA-Z0-9-]*/g);
        if (pseudoElementMatches) {
            elements += pseudoElementMatches.length;
            processedSelector = processedSelector.replace(/::[a-zA-Z][a-zA-Z0-9-]*/g, '');
        }
        // 计算元素选择器 (div, p, span, etc.)
        // 移除组合符和通配符
        processedSelector = processedSelector.replace(/[>+~\s]/g, ' ').replace(/\*/g, '');
        const elementParts = processedSelector.split(/\s+/).filter(part => part.trim() && part !== '*');
        for (const part of elementParts) {
            if (part.match(/^[a-zA-Z][a-zA-Z0-9-]*$/)) {
                elements++;
            }
        }
        return [inline, ids, classes, elements];
    }
    /**
     * 比较两个优先级
     * @returns 1 如果 a > b, -1 如果 a < b, 0 如果相等
     */
    static compareSpecificity(a, b) {
        for (let i = 0; i < 4; i++) {
            if (a[i] > b[i])
                return 1;
            if (a[i] < b[i])
                return -1;
        }
        return 0;
    }
}
exports.SpecificityCalculator = SpecificityCalculator;
