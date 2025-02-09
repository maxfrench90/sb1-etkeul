/**
 * Default accessibility rules configuration
 */
export const DEFAULT_RULES = [
  { id: 'color-contrast', enabled: true },
  { id: 'aria-required-attr', enabled: true },
  { id: 'aria-roles', enabled: true },
  { id: 'button-name', enabled: true },
  { id: 'image-alt', enabled: true },
  { id: 'label', enabled: true },
  { id: 'link-name', enabled: true }
];

/**
 * Default check configurations
 */
export const DEFAULT_CHECKS = [
  { id: 'color-contrast', options: { noScroll: true } }
];

/**
 * Merges custom rules with default rules
 * @param {any[]} customRules - Optional custom rules to merge
 * @returns {any[]} Combined rules array
 */
export function mergeRules(customRules?: any[]) {
  return [...DEFAULT_RULES, ...(customRules || [])];
}