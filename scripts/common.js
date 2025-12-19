import { loadScript } from './aem.js';

/**
 * Converts variant classes to BEM notation and updates the block's class list accordingly.
 * @param {Object} params The parameters object.
 * @param {DOMTokenList} params.blockClassList The class list of the block element.
 * @param {Object} params.variantClasses An object where keys are variant class names.
 * @param {string} params.blockName The base name of the block.
 * @return {void}
 * @example
 * // Given a block with class 'hero large' and variantClasses { large: 'large', dark: 'dark' }
 * // and blockName 'hero', the function will update the class list to 'hero hero__large hero__dark'
 * variantClassesToBEM({
 *   blockClassList: blockElement.classList,
 *   variantClasses: { large: 'large', dark: 'dark' },
 *   blockName: 'hero'
 * });
 * // Resulting class list: 'hero hero__large hero__dark'
 */
export function variantClassesToBEM({ blockClassList = '', variantClasses = {}, blockName = '' }) {
  const variants = [...Object.keys(variantClasses)];
  variants.forEach((variant) => {
    if (blockClassList.contains(variant)) {
      blockClassList.remove(variant);
      blockClassList.add(`${blockName}__${variant}`);
    }
  });
}

/**
 * Generates a BEM template name for a given block and variant.
 * @param {string} blockName The base name of the block.
 * @param {string} variantName The name of the variant.
 * @param {string} [modifierName=''] An optional modifier name.
 * @return {string} The BEM formatted template name.
 * @example
 * // Generate BEM template name for block 'hero' and variant 'countdown'
 * const templateName = getBEMTemplateName('hero', 'countdown');
 * // Result: 'hero__countdown'
 * @example
 * // Generate BEM template name for block 'button', variant 'primary', and modifier 'large'
 * const templateNameWithModifier = getBEMTemplateName('button', 'primary', 'large');
 * // Result: 'button__primary--large'
 */
export function getBEMTemplateName(blockName, variantName, modifierName = '') {
  return `${blockName}__${variantName}${modifierName ? `--${modifierName}` : ''}`;
}

/**
 * Creates a DOM element with specified options.
 * @param {string} tag The HTML tag name for the element.
 * @param {Object} [options={}] The options for creating the element.
 * @param {string|string[]} [options.className=''] The class name(s) to add to the element.
 * @param {Object} [options.properties={}] The properties to set on the element.
 * @param {string} [options.textContent=''] The text content of the element.
 * @param {string} [options.fragment=''] The HTML fragment to append to the element.
 * @return {Element} The created DOM element.
 * @example
 * // Create a div element with class 'container', id 'main', and text content 'Hello World'
 * const element = createElement('div', {
 *   className: 'container',
 *   properties: { id: 'main' },
 *   textContent: 'Hello World'
 * });
 * // Resulting element: <div class="container" id="main">Hello World</div>
 * @example
 * // Create a div with an HTML fragment
 * const element = createElement('div', {
 *   className: 'container',
 *   fragment: '<p>Nested content</p>'
 * });
 * // Resulting element: <div class="container"><p>Nested content</p></div>
*/
export function createElement(tag, options = {}) {
  const {
    className = '', properties = {}, textContent = '', fragment = '',
  } = options;
  const element = document.createElement(tag);
  const isString = typeof className === 'string' || className instanceof String;
  if (className || (isString && className !== '') || (!isString && className.length > 0)) {
    const classes = isString ? [...className] : className;
    element.classList.add(...classes);
  }
  if (!isString && className.length === 0) {
    element.removeAttribute('class');
  }

  if (properties) {
    Object.keys(properties).forEach((propName) => {
      const value = propName === properties[propName] ? '' : properties[propName];
      element.setAttribute(propName, value);
    });
  }

  if (textContent) {
    element.textContent = textContent;
  }

  if (fragment) {
    document.createRange().createContextualFragment(fragment);
    element.appendChild(fragment);
  }

  return element;
}

/**
 * Loads a variant script dynamically based on block and variant names.
 * @param {Object} params The parameters object.
 * @param {string} params.blockName The name of the block.
 * @param {string} params.variantName The name of the variant.
 * @return {Promise<void>} A promise that resolves when the script is loaded.
 * @example
 * // Load the countdown variant script for the hero block
 * await loadVariantScript({ blockName: 'hero', variantName: 'countdown' });
 * @example
 * // not existing example or something went wrong
 * await loadVariantScript({ blockName: 'footer', variantName: 'nonexistent' });
 * // Error loading variant script: /blocks/footer/variants/nonexistent.js
 */
export async function loadVariantScript({ blockName, variantName }) {
  const scriptPath = `/blocks/${blockName}/variants/${variantName}.js`;
  try {
    await loadScript(scriptPath, { type: 'module', charset: 'utf-8', nonce: 'aem' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading variant script: %c${scriptPath}`, 'color: red;', error);
  }
}
