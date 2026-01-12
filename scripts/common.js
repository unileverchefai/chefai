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

/**
 * Video embedding utilities
 */

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
 * - /media_HASH.mp4 (DAM files that might be YouTube URLs)
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
 * Supports formats:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 * - /media_HASH.mp4 (DAM files that might be Vimeo URLs)
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
 * Check if a URL is a video link and return the embed iframe if it is
 * Returns null if not a video link
 * @param {string} url The URL to check (can be YouTube, Vimeo, or DAM link)
 * @returns {HTMLIFrameElement|null} The iframe element or null
 */
export function createVideoEmbed(url) {
  if (!url) return null;

  let videoId;
  let embedUrl;

  // YouTube (including Shorts)
  videoId = getYouTubeVideoId(url);
  if (videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'YouTube video player');
    iframe.setAttribute('loading', 'lazy');
    return iframe;
  }

  // Vimeo
  videoId = getVimeoVideoId(url);
  if (videoId) {
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Vimeo video player');
    iframe.setAttribute('loading', 'lazy');
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
 * Carousel utilities
 */

/**
 * Creates a carousel controller for a given container
 * @param {Object} options Configuration options for the carousel
 * @param {Element} options.container The container element that holds carousel items
 * @param {Element} options.block The block element to append controls to
 * @param {number} options.itemCount Total number of items in the carousel
 * @param {number} [options.mobileItemsPerSlide=1] Items visible per slide on mobile
 * @param {number} [options.desktopItemsPerSlide=3] Items visible per slide on desktop
 * @param {number} [options.mobileBreakpoint=900] Breakpoint for mobile/desktop switch
 * @param {number} [options.mobileGap=16] Gap between items on mobile (in px)
 * @param {number} [options.desktopGap=24] Gap between items on desktop (in px)
 * @param {boolean} [options.disableDesktopCarousel=false] Disable carousel on desktop (mobile only)
 * @returns {Object} Carousel controller with destroy method
 * @example
 * const carousel = createCarousel({
 *   container: carouselContainer,
 *   block: blockElement,
 *   itemCount: cards.length,
 *   mobileItemsPerSlide: 1,
 *   desktopItemsPerSlide: 3
 * });
 * // Later, cleanup: carousel.destroy();
 */
export function createCarousel(options) {
  const {
    container,
    block,
    itemCount,
    mobileItemsPerSlide = 1,
    desktopItemsPerSlide = 3,
    mobileBreakpoint = 900,
    mobileGap = 16,
    desktopGap = 24,
    disableDesktopCarousel = false,
  } = options;

  // Carousel state
  let currentSlide = 0;

  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'controls';

  // Create indicators
  const indicators = document.createElement('div');
  indicators.className = 'indicators';

  // Create arrows
  const arrows = document.createElement('div');
  arrows.className = 'arrows';

  const prevArrow = document.createElement('button');
  prevArrow.className = 'arrow prev';
  prevArrow.setAttribute('aria-label', 'Previous slide');
  prevArrow.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.33 14.67L10.8 12.2L8.33 9.73L9.27 8.8L12.67 12.2L9.27 15.6L8.33 14.67Z"/>
    </svg>
  `;

  const nextArrow = document.createElement('button');
  nextArrow.className = 'arrow next';
  nextArrow.setAttribute('aria-label', 'Next slide');
  nextArrow.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.33 14.67L10.8 12.2L8.33 9.73L9.27 8.8L12.67 12.2L9.27 15.6L8.33 14.67Z"/>
    </svg>
  `;

  function updateCarousel() {
    const firstItem = container.querySelector('.card, .carousel-item');
    const itemWidth = firstItem?.offsetWidth || 0;
    const isMobile = window.innerWidth < mobileBreakpoint;
    const gap = isMobile ? mobileGap : desktopGap;
    const itemsPerSlide = isMobile ? mobileItemsPerSlide : desktopItemsPerSlide;
    const slideWidth = (itemWidth + gap) * itemsPerSlide;

    // Disable carousel transform on desktop if disableDesktopCarousel is true
    if (disableDesktopCarousel && !isMobile) {
      container.style.transform = 'translateX(0)';
    } else {
      container.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }

    // Update indicators
    indicators.querySelectorAll('.indicator').forEach((ind, idx) => {
      ind.classList.toggle('active', idx === currentSlide);
    });
  }

  function navigate(direction) {
    const isMobile = window.innerWidth < mobileBreakpoint;
    const itemsPerSlide = isMobile ? mobileItemsPerSlide : desktopItemsPerSlide;
    const total = Math.ceil(itemCount / itemsPerSlide);
    currentSlide = (currentSlide + direction + total) % total;
    updateCarousel();
  }

  function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
  }

  // Resizing must be checked, not really working as expected.
  function handleResize() {
    const isMobile = window.innerWidth < mobileBreakpoint;
    const itemsPerSlide = isMobile ? mobileItemsPerSlide : desktopItemsPerSlide;

    // If desktop carousel is disabled and we're on desktop, only show 1 slide (all items)
    const total = (disableDesktopCarousel && !isMobile) ? 1 : Math.ceil(itemCount / itemsPerSlide);

    // Rebuild indicators if count changed
    const currentIndicatorCount = indicators.querySelectorAll('.indicator').length;
    if (currentIndicatorCount !== total) {
      indicators.innerHTML = '';
      for (let i = 0; i < total; i += 1) {
        const indicator = document.createElement('button');
        indicator.className = `indicator${i === 0 ? ' active' : ''}`;
        indicator.setAttribute('aria-label', `Go to slide ${i + 1} of ${total}`);
        indicator.setAttribute('type', 'button');
        indicator.addEventListener('click', () => goToSlide(i));
        indicators.appendChild(indicator);
      }
      currentSlide = 0;
    }

    updateCarousel();
  }

  // Event listeners
  prevArrow.addEventListener('click', () => navigate(-1));
  nextArrow.addEventListener('click', () => navigate(1));

  // Assemble controls
  arrows.appendChild(prevArrow);
  arrows.appendChild(nextArrow);
  controls.appendChild(indicators);
  controls.appendChild(arrows);
  block.appendChild(controls);

  // Initial setup
  handleResize();
  window.addEventListener('resize', handleResize);

  return {
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      controls.remove();
    },
    goToSlide,
    navigate,
    getCurrentSlide: () => currentSlide,
  };
}
