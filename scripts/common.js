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
 * @param {Object} params The parameters object.
 * @param {string} params.blockName The base name of the block.
 * @param {string} params.variantName The name of the variant.
 * @param {string} [params.modifierName=''] An optional modifier name.
 * @param {string} [params.variantClass=''] An optional BEM base name override.
 * @return {string} The BEM formatted template name.
 * @example
 * // Generate BEM template name for block 'hero' and variant 'countdown'
 * const templateName = getBEMTemplateName({ blockName: 'hero', variantName: 'countdown' });
 * // Result: 'hero__countdown'
 * @example
 * // Generate BEM template name with modifier
 * const templateNameWithModifier = getBEMTemplateName({
 *   blockName: 'button',
 *   variantName: 'primary',
 *   modifierName: 'large'
 * });
 * // Result: 'button__primary--large'
 * @example
 * // Generate BEM template name using custom variant class as base name
 * const templateNameCustom = getBEMTemplateName({
 *   variantClass: 'btn__custom',
 *   modifierName: 'active'
 * });
 * // Result: 'btn__custom--active'
 */
export function getBEMTemplateName({
  blockName, variantName, modifierName = '', variantClass = '',
}) {
  const baseName = variantClass || `${blockName}__${variantName}`;
  return `${baseName}${modifierName ? `--${modifierName}` : ''}`;
}

/**
 * Creates a DOM element with specified options.
 * @param {string} tag The HTML tag name for the element. [Mandatory]
 * @param {Object} [options={}] The options for creating the element.
 * @param {string|string[]} [options.className=''] The class name(s) to add to the element.
 * Can be a single class, space-separated, comma-separated, or an array.
 * @param {Object} [options.properties={}] The properties to set on the element.
 * @param {string} [options.textContent=''] The text content of the element.
 * @param {string} [options.fragment=''] The HTML fragment to append to the element.
 * @return {Element} The created DOM element.
 * @example
 * // Single class
 * const element = createElement('div', { className: 'container' });
 * // Result: <div class="container"></div>
 * @example
 * // Space-separated classes
 * const element = createElement('div', { className: 'container large' });
 * // Result: <div class="container large"></div>
 * @example
 * // Comma-separated classes
 * const element = createElement('div', { className: 'container,large,primary' });
 * // Result: <div class="container large primary"></div>
 * @example
 * // Array of classes
 * const element = createElement('div', { className: ['container', 'large', 'primary'] });
 * // Result: <div class="container large primary"></div>
 * @example
 * // With properties and text content
 * const element = createElement('div', {
 *   className: 'container large',
 *   properties: { id: 'main' },
 *   textContent: 'Hello World'
 * });
 * // Result: <div class="container large" id="main">Hello World</div>
 * @example
 * // With HTML fragment
 * const element = createElement('div', {
 *   className: 'container',
 *   fragment: '<p>Nested content</p>'
 * });
 * // Result: <div class="container"><p>Nested content</p></div>
*/
export function createElement(tag, options = {}) {
  const {
    className = '', properties = {}, textContent = '', fragment = '',
  } = options;
  const element = document.createElement(tag);
  const isString = typeof className === 'string' || className instanceof String;
  if (className || (isString && className !== '') || (!isString && className.length > 0)) {
    const classes = isString ? className.split(/[\s,]+/).filter(Boolean) : className;
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
    const fragmentNode = document.createRange().createContextualFragment(fragment);
    element.appendChild(fragmentNode);
  }

  return element;
}

/**
 * Loads a variant script dynamically based on block and variant names.
 * @param {Object} params The parameters object.
 * @param {string} params.blockName The name of the block.
 * @param {string} params.variantName The name of the variant.
 * @return {Promise<void>} A promise that resolves when the script is loaded
 * , or logs an error if loading fails.
 * @example
 * // Load the countdown variant script for the hero block
 * await loadVariantScript({ blockName: 'hero', variantName: 'countdown' });
 */
export async function loadVariantScript({ blockName, variantName }) {
  if (!blockName || !variantName) {
    console.error('Both %cblockName%c and %cvariantName%c are required to load a variant script.', 'color: red;', '', 'color: red;', '');
    return;
  }

  const scriptPath = `/blocks/${blockName}/variants/${variantName}.js`;
  if (document.querySelector(`script[src="${scriptPath}"]`)) {
    // Script already loaded
    return;
  }

  try {
    await loadScript(scriptPath, { type: 'module', charset: 'utf-8', nonce: 'aem' });
  } catch (error) {
    console.error(`Error loading variant script: %c${scriptPath}`, 'color: red;', error);
  }
}

/** Retrieves placeholder text based on key and optional prefix.
 * @param {string} key The placeholder key
 * @param {string} [prefix='default'] The optional prefix for placeholder categories
 * @returns {string} The corresponding placeholder text or an empty string if not found
 */
export function getPlaceholderText({ key, prefix = 'default' } = {}) {
  try {
    const placeholders = window.placeholders[prefix] || {};
    return placeholders[key] || '';
  } catch (e) {
    return null;
  }
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders, _default_ or custom prefix.
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders({ prefix = 'default' } = {}) {
  window.placeholders = window.placeholders || {};
  if (window.placeholders[prefix]) {
    return window.placeholders[prefix];
  }

  window.placeholders[prefix] = new Promise((resolve) => {
    const pathname = prefix === 'default' ? '' : `/${prefix.toLowerCase()}`;
    const url = new URL(
      window.location.origin,
    );
    url.pathname = `${pathname}/placeholders.json`;
    fetch(url.href)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP error! status: %c${resp.status}`, 'color: red;');
        }
        return resp.json();
      })
      .then((json) => {
        const placeholders = {};
        json.data
          .filter((item) => item.key)
          .forEach((item) => {
            placeholders[item.key] = item.text;
          });
        window.placeholders[prefix] = placeholders;
        resolve(window.placeholders[prefix]);
      })
      .catch((error) => {
        console.error('Error loading placeholders:', { error });
        window.placeholders[prefix] = {};
        resolve(window.placeholders[prefix]);
      });
  });
  return window.placeholders[prefix];
}
