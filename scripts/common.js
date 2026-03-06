import openPersonalizedHub from '@helpers/personalized-hub/personalized-hub.js';
import hasSavedBusinessName from '@helpers/personalized-hub/hasSavedBusinessName.js';
import openChatbotModal from '@helpers/chatbot/view/openChatbotModal.js';
import { BASE_FOLDER } from './custom/locale.js';
import {
  loadCSS, loadScript, toClassName, getMetadata,
} from './aem.js';

/**
 * Validates the theme and returns the trend class name
 * @param {string} theme The theme from metadata (t1, t2, t3, t4)
 * @returns {string|null} The valid trend class or null
 */
export function validateTheme(theme) {
  const themeMap = {
    t1: 'borderless-cuisine',
    t2: 'street-food-couture',
    t3: 'diner-designed',
    t4: 'culinary-roots',
    // Also support full names for backwards compatibility
    'borderless-cuisine': 'borderless-cuisine',
    'street-food-couture': 'street-food-couture',
    'diner-designed': 'diner-designed',
    'culinary-roots': 'culinary-roots',
  };

  return themeMap[theme] || null;
}

/**
 * Checks if the current host is a development environment.
 * @returns {boolean} True if the host is a development environment, false otherwise.
 */
export function isDevHost() {
  const devHosts = ['localhost', '127.0.0.1', 'aem.page', 'aem.live', 'dev.ufs.com', 'stage.ufs.com'];
  return devHosts.some((url) => window.location.host.includes(url));
}

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
 * @param {string} [options.innerContent=''] Can be plain text or an HTML fragment.
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
 *   attributes: { id: 'main' },
 *   innerContent: 'Hello World'
 * });
 * // Result: <div class="container large" id="main">Hello World</div>
 * @example
 * // With HTML fragment
 * const element = createElement('div', {
 *   className: 'container',
 *   innerContent: '<p>Nested content</p>'
 * });
 * // Result: <div class="container"><p>Nested content</p></div>
*/
export function createElement(tag, options = {}) {
  const {
    className = '', attributes = {}, innerContent = '',
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

  if (attributes) {
    Object.keys(attributes).forEach((propName) => {
      const value = propName === attributes[propName] ? '' : attributes[propName];
      element.setAttribute(propName, value);
    });
  }

  if (innerContent) {
    const fragmentNode = document.createRange().createContextualFragment(innerContent);
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

/**
 * Fetches placeholders from the server and returns them as an object.
 * @returns {Promise<Object>} A promise that resolves to an object containing placeholders.
 * The object structure is expected to have keys corresponding to placeholder categories,
 * each containing an array of placeholder items with 'key' and language-specific text properties.
*/
export async function getPlaceholders() {
  const url = new URL(window.location.href);
  url.pathname = '/placeholders.json';
  return fetch(url.href)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => {
      const placeholders = json || {};
      return placeholders;
    })
    .catch((error) => {
      console.error('Error loading placeholders:', { error });
      return {};
    });
}

/**
 * Format the placeholders data into a structured object for easier access.
 * @param {Object} values The raw placeholders data fetched from the server.
 * @returns {Object} An object where each key corresponds to a placeholder category,
 * and its value is an object mapping placeholder keys to their language-specific text.
 * @description The input `values` is expected to be an array of placeholder items,
 * each containing a 'key' and language-specific text properties (e.g., 'en', 'it', 'de', 'es').
 */
function formatPlaceholders(values = false) {
  const object = {};
  if (!values) {
    return {};
  }
  values.forEach((item) => {
    if (!item.key) {
      return;
    }

    const { key, ...languages } = item;
    object[key] = Object.fromEntries(
      Object.entries(languages).filter(
        ([, value]) => typeof value === 'string' && value.trim() !== '',
      ),
    );
  });

  return object;
}

const {
  signinmodal,
  signupmodal,
  validations,
  forgetpwmodal,
  herobanner,
  countdownhero,
  chatbot,
  cookies,
  data: placeholdersData,
} = await getPlaceholders() || {};

// Format placeholders for different categories and store them in constants for easy access
export const SIGNIN_MODAL_PLACEHOLDERS = formatPlaceholders(signinmodal?.data);
export const SIGNUP_MODAL_PLACEHOLDERS = formatPlaceholders(signupmodal?.data);
export const VALIDATIONS_PLACEHOLDERS = formatPlaceholders(validations?.data);
export const FORGET_PW_MODAL_PLACEHOLDERS = formatPlaceholders(forgetpwmodal?.data);
export const HERO_BANNER_PLACEHOLDERS = formatPlaceholders(herobanner?.data);
export const COUNTDOWN_HERO_PLACEHOLDERS = formatPlaceholders(countdownhero?.data);
export const CHATBOT_PLACEHOLDERS = formatPlaceholders(chatbot?.data);
export const COOKIES_PLACEHOLDERS = formatPlaceholders(cookies?.data);
export const OTHER_PLACEHOLDERS = formatPlaceholders(placeholdersData?.data);
/**
 * Extract video ID from YouTube URL
 * @param {string} url The YouTube URL
 * @returns {string|null} The extracted video ID or null if not found
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * @example
 * // Extract YouTube video ID
 * const videoId = getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 * // Result: 'dQw4w9WgXcQ'
 * @example
 * // Extract YouTube Shorts video ID
 * const shortsVideoId = getYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ');
 * // Result: 'dQw4w9WgXcQ'
*/
export function getYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#]+)/,
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract video ID from Vimeo URL
 * @param {string} url The Vimeo URL
 * @returns {string|null} The extracted video ID or null if not found
 * Supports formats:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 * - /media_HASH.mp4 (DAM files that might be Vimeo URLs)
 * @example
 * // Extract Vimeo video ID
 * const videoId = getVimeoVideoId('https://vimeo.com/123456789');
 * // Result: '123456789'
 * @example
 * // Extract Vimeo video ID from player URL
 * const playerVideoId = getVimeoVideoId('https://player.vimeo.com/video/987654321');
 * // Result: '987654321'
 */
export function getVimeoVideoId(url) {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Checks if a URL is a video link and creates an embed iframe if it is
 * if not, returns null
 * @param {string} url The URL to check (can be YouTube, Vimeo, or DAM link)
 * @returns {HTMLIFrameElement|null} The iframe element or null
 * @description Supports YouTube and Vimeo links
 */
export function createVideoEmbed(url) {
  if (!url) return null;

  let videoId;
  let embedUrl;

  // YouTube (including Shorts)
  videoId = getYouTubeVideoId(url);
  if (videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const iframe = createElement('iframe', {
      attributes: {
        src: embedUrl,
        width: '560',
        height: '315',
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: '',
        title: 'YouTube video player',
        loading: 'lazy',
      },
    });
    return iframe;
  }

  // Vimeo
  videoId = getVimeoVideoId(url);
  if (videoId) {
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
    const iframe = createElement('iframe', {
      attributes: {
        src: embedUrl,
        width: '560',
        height: '315',
        frameborder: '0',
        allow: 'autoplay; fullscreen; picture-in-picture',
        allowfullscreen: '',
        title: 'Vimeo video player',
        loading: 'lazy',
      },
    });
    return iframe;
  }

  return null;
}

/**
 * Find video link in a container element
 * @param {Element} container The container element to search within
 * @returns {Element|null} The video link element or null
 */
export function findVideoLink(container) {
  const videoLink = container.querySelector(
    'a[href*="youtube.com"], a[href*="youtu.be"], a[href*="vimeo.com"]',
  );
  return videoLink;
}

/**
 * Adds variant-specific logic by loading scripts and styles as needed.
 * @param {Object} params The parameters object.
 * @param {string} params.blockName The name of the block.
 * @param {string} params.variantName The name of the variant.
 * @param {boolean} [params.hasScript=false] Whether the variant has an associated script to load.
 * @param {boolean} [params.hasStyle=false] Whether the variant has an associated style to load.
 * @param {boolean} [params.useButtons=false] Whether to load button styles.
 * @returns {Promise<void>} A promise that resolves when all resources are loaded.
 * @example
 * // Load variant logic for the countdown variant of the hero block
 * await addVariantLogic({
 *   blockName: 'hero',
 *   variantName: 'countdown',
 *   hasScript: true,
 *   hasStyle: true,
 *   useButtons: true
 * });
 */
export async function addVariantLogic({
  blockName, variantName, hasScript = false, hasStyle = false, useButtons = false,
}) {
  if (useButtons) {
    await loadCSS(`${window.hlx.codeBasePath}/styles/buttons.css`);
  }
  if (!blockName || !variantName) {
    if (!useButtons) {
      console.error('Both %cblockName%c and %cvariantName%c are required to load a variant style.', 'color: red;', '', 'color: red;', '');
    }
    return;
  }
  if (hasScript) {
    await loadVariantScript({ blockName, variantName });
  }
  if (hasStyle) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/variants/${variantName}.css`);
  }
}

function getBasePath(url) {
  const { origin, pathname } = url;
  const pathSegments = pathname.split('/').filter(Boolean);
  const baseIndex = pathSegments.indexOf(BASE_FOLDER);
  const basePath = baseIndex !== -1 ? `/${pathSegments.slice(0, baseIndex + 1).join('/')}` : '';
  return `${origin}${basePath}`;
}

/**
 * Fetches constants values from the constants.json file.
 * @returns {Promise<Object|null>} A promise that resolves to the constants
 * object or null if fetching fails.
 */
async function getConstantsValues() {
  const currentUrl = new URL(window.location.href);
  const constantsUrl = `${getBasePath(currentUrl)}/constants.json`;
  try {
    const response = await fetch(constantsUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch %cconstants.json:', 'color:red', { error });
    return null;
  }
}

/**
 * Formats an array of name-value pairs into an object.
 * @param {Array} values An array of objects with 'name' and 'value' properties.
 * @returns {Object} An object with names as keys and corresponding values.
 */
function formatValues(values = false) {
  const obj = {};
  if (values) {
    values.forEach(({ name, value }) => {
      obj[name] = value;
    });
  }
  return obj;
}

// Fetch and format constants configuration from constants.json
const { cookieValues } = await getConstantsValues() || {};

export const COOKIE_CONFIG = formatValues(cookieValues?.data);

/**
 * Loads a template based on the 'template' metadata value, including its CSS and JS.
 *
 * This function dynamically loads page templates from the `/templates` directory in scripts.js.
 * @param {Element} main The main element to pass to the template's default function.
 * @returns {Promise<void>} A promise that resolves when the template is loaded and executed.
 */
export async function loadTemplate(main) {
  const template = toClassName(getMetadata('template'));
  if (!template) {
    return;
  }
  try {
    await loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
    const mod = await import(`${window.hlx.codeBasePath}/templates/${template}/${template}.js`);
    if (mod && typeof mod.default === 'function') {
      await mod.default(main);
    }
  } catch (error) {
    console.error(`Failed to load template ${template}:`, error);
  }
}

/**
 * This function loads and applies the theme specified in metadata with the key "`theme`".
 *
 * Any theme _**MUST**_ have a corresponding `CSS` file in the themes folder.
 * @returns {Promise<void>}
 */
export async function loadTheme() {
  const theme = toClassName(getMetadata('theme'));
  if (theme) {
    try {
      await loadCSS(`${window.hlx.codeBasePath}/themes/${theme}/${theme}.css`);
    } catch (e) {
      console.error(`failed to load theme %c${theme}`, 'color: gold', { error: e });
    }
  }
}

/**
 * Handles click events on CTA buttons, determining whether to open a registration modal,
 * personalized hub, or chatbot modal based on the button's href
 * and the user's saved business information.
 * @param {Element} button The CTA button element to attach the click handler to.
 */
export function ctaButtonHandler(button = null) {
  if (!button) {
    console.error('CTA Button Handler: No button element provided.');
    return;
  }
  const buttonHref = button.getAttribute('href');
  const shouldOpenRegistration = buttonHref.includes('#unlock-personalized-hub');
  const isLivePhase = button.closest('[class$="live"]');

  if (!isLivePhase) {
    // TODO open the registration modal
  } else {
    // Prefetch Personalized Hub assets
    import('@scripts/custom/prefetch.js')
      .then(({ default: prefetchPersonalizedHub }) => {
        if (typeof prefetchPersonalizedHub === 'function') {
          prefetchPersonalizedHub().catch(() => {});
        }
      })
      .catch(() => {});

    button.addEventListener('click', async (e) => {
      e.preventDefault();

      if (shouldOpenRegistration) {
        const { default: openSignUpReportModal } = await import('@helpers/signup/signup.js');
        openSignUpReportModal();
        return;
      }

      try {
        const hasBusiness = await hasSavedBusinessName();

        if (hasBusiness) {
          await openChatbotModal();
        } else {
          await openPersonalizedHub();
        }
      } catch (error) {
        console.error('Error handling CTA button click:', error);
      }
    });
  }
}
