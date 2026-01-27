import { loadCSS, loadScript } from './aem.js';

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
 * Carousel utilities
 */

/**
 * Debounce utility function
 * @param {Function} fn Function to debounce
 * @param {number} delay Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Easing function for smooth momentum scrolling
 * @param {number} t Progress value between 0 and 1
 * @returns {number} Eased value
 */
function easeOutCubic(t) {
  return 1 - ((1 - t) ** 3);
}

/**
 * Creates a carousel controller for a given container
 * @typedef {Object} CarouselOptions
 * @property {Element} container - Container with carousel items
 * @property {Element} block - Block element for controls
 * @property {number} itemCount - Total items
 * @property {number} [mobileItemsPerSlide=1] - Items per slide (mobile)
 * @property {number} [desktopItemsPerSlide=3] - Items per slide (desktop)
 * @property {number} [mobileBreakpoint=900] - Mobile breakpoint (px)
 * @property {number} [mobileGap=16] - Gap between items (mobile, px)
 * @property {number} [desktopGap=24] - Gap between items (desktop, px)
 * @property {boolean} [disableDesktopCarousel=false] - Disable on desktop
 * @property {boolean} [enableMomentum=true] - Enable momentum scrolling
 * @property {number} [momentumMultiplier=2] - Momentum strength (1-5)
 * @property {number} [snapThreshold=0.3] - Swipe threshold to trigger slide change
 * @property {number} [minSwipeDistance=50] - Minimum swipe distance (px)
 * @property {number} [maxMomentumDuration=800] - Max momentum animation duration (ms)
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
    enableMomentum = true,
    momentumMultiplier = 2,
    snapThreshold = 0.3,
    minSwipeDistance = 50,
    maxMomentumDuration = 800,
  } = options;

  // Carousel state
  let currentSlide = 0;
  let lastItemsPerSlide = null;

  // Touch/drag interaction state
  const interactionState = {
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
    velocityX: 0,
    lastX: 0,
    lastTime: 0,
    dragOffset: 0,
    animationId: null,
  };

  // Create controls container
  const controls = createElement('div', { className: 'controls' });

  // Create ARIA live region for screen readers
  const liveRegion = createElement('div', {
    className: 'sr-only',
    attributes: {
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  });
  block.appendChild(liveRegion);

  // Create indicators
  const indicators = createElement('div', { className: 'indicators' });
  // Create arrows
  const arrows = createElement('div', { className: 'arrows' });

  const prevArrow = createElement('button', {
    className: 'arrow prev',
    attributes: { 'aria-label': 'Previous slide' },
    innerContent: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.67 14.67L13.2 12.2L15.67 9.73L14.73 8.8L11.33 12.2L14.73 15.6L15.67 14.67Z"/>
      </svg>
    `,
  });

  const nextArrow = createElement('button', {
    className: 'arrow next',
    attributes: { 'aria-label': 'Next slide' },
    innerContent: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.33 14.67L10.8 12.2L8.33 9.73L9.27 8.8L12.67 12.2L9.27 15.6L8.33 14.67Z"/>
      </svg>
    `,
  });

  /**
   * Calculates carousel metrics based on current viewport and settings
   * @returns {Object} Metrics including:
   * itemWidth, isMobile, gap, itemsPerSlide, slideWidth, totalSlides
  */
  function getCarouselMetrics() {
    const firstItem = container.querySelector('.card, .carousel-item');
    const itemWidth = firstItem?.offsetWidth || 0;
    const isMobile = window.innerWidth < mobileBreakpoint;
    const gap = isMobile ? mobileGap : desktopGap;
    const itemsPerSlide = isMobile ? mobileItemsPerSlide : desktopItemsPerSlide;
    const slideWidth = (itemWidth + gap) * itemsPerSlide;
    const totalSlides = (disableDesktopCarousel && !isMobile)
      ? 1
      : Math.ceil(itemCount / itemsPerSlide);

    return {
      itemWidth, isMobile, gap, itemsPerSlide, slideWidth, totalSlides,
    };
  }

  /**
   * Updates the carousel position and UI elements
   * @param {boolean} immediate If true, updates without animation
   */
  function updateCarousel(immediate = false) {
    const { isMobile, slideWidth, totalSlides } = getCarouselMetrics();

    // Disable carousel transform on desktop if disableDesktopCarousel is true
    if (disableDesktopCarousel && !isMobile) {
      container.style.transform = 'translateX(0)';
    } else {
      const offset = -currentSlide * slideWidth;
      if (immediate) {
        container.style.transition = 'none';
        container.style.transform = `translateX(${offset}px)`;
        // Force reflow
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.style.transition = '';
      } else {
        container.style.transform = `translateX(${offset}px)`;
      }
    }

    // Update indicators
    indicators.querySelectorAll('.indicator').forEach((ind, idx) => {
      ind.classList.toggle('active', idx === currentSlide);
    });

    // Announce slide change to screen readers
    liveRegion.textContent = `Slide ${currentSlide + 1} of ${totalSlides}`;
  }

  /**
   * Navigates to the next or previous slide
   * @param {number} direction -1 for previous, 1 for next
   */
  function navigate(direction) {
    const { totalSlides } = getCarouselMetrics();
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateCarousel();
  }

  /**
   * Navigates to a specific slide
   * @param {number} index The slide index to navigate to
   * @param {boolean} immediate If true, updates without animation
   */
  function goToSlide(index, immediate = false) {
    const { totalSlides } = getCarouselMetrics();
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    updateCarousel(immediate);
  }

  /**
   * Calculates momentum for swipe gestures
   * @param {number} velocity The swipe velocity
   * @param {number} dragDistance The distance dragged
   * @returns {Object} Contains slideOffset and duration for the momentum animation
   */
  function calculateMomentum(velocity, dragDistance) {
    const { slideWidth } = getCarouselMetrics();
    const duration = Math.min(
      Math.abs(velocity) * momentumMultiplier * 100,
      maxMomentumDuration,
    );

    const finalPosition = dragDistance + ((velocity * duration) / 2);
    const slideOffset = Math.round((-finalPosition) / slideWidth);

    return { slideOffset, duration };
  }

  /**
   * Animates the carousel momentum after a swipe gesture
   * @param {number} targetSlide The target slide index
   * @param {number} duration The duration of the animation in milliseconds
   */
  function animateMomentum(targetSlide, duration) {
    const { slideWidth } = getCarouselMetrics();
    const startSlide = currentSlide;
    const startOffset = interactionState.dragOffset;
    const startTime = performance.now();

    /**
     * Performs the animation frame updates
     * @param {DOMHighResTimeStamp} time The current time
     */
    function animate(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const slideProgress = startSlide + (targetSlide - startSlide) * eased;
      const offset = -slideProgress * slideWidth + startOffset * (1 - eased);

      container.style.transition = 'none';
      container.style.transform = `translateX(${offset}px)`;

      if (progress < 1) {
        interactionState.animationId = requestAnimationFrame(animate);
      } else {
        currentSlide = targetSlide;
        interactionState.dragOffset = 0;
        updateCarousel();
      }
    }

    if (interactionState.animationId) {
      cancelAnimationFrame(interactionState.animationId);
    }

    interactionState.animationId = requestAnimationFrame(animate);
  }

  /**
   * Handles the start of an interaction (touch or mouse)
   * @param {number} clientX The X coordinate of the interaction start
   */
  function handleInteractionStart(clientX) {
    if (interactionState.animationId) {
      cancelAnimationFrame(interactionState.animationId);
      interactionState.animationId = null;
    }

    interactionState.isDragging = true;
    interactionState.startX = clientX;
    interactionState.currentX = clientX;
    interactionState.lastX = clientX;
    interactionState.startTime = performance.now();
    interactionState.lastTime = performance.now();
    interactionState.velocityX = 0;
    interactionState.dragOffset = 0;

    container.classList.add('is-dragging');
  }

  /**
   * Handles the movement during an interaction (touch or mouse)
   * @param {number} clientX The current X coordinate of the interaction
   */
  function handleInteractionMove(clientX) {
    if (!interactionState.isDragging) return;

    const currentTime = performance.now();
    const deltaX = clientX - interactionState.lastX;
    const deltaTime = currentTime - interactionState.lastTime;

    if (deltaTime > 0) {
      interactionState.velocityX = deltaX / deltaTime;
    }

    interactionState.currentX = clientX;
    interactionState.lastX = clientX;
    interactionState.lastTime = currentTime;

    const dragDistance = clientX - interactionState.startX;
    interactionState.dragOffset = dragDistance;

    const { slideWidth, isMobile } = getCarouselMetrics();

    if (disableDesktopCarousel && !isMobile) return;

    const offset = -currentSlide * slideWidth + dragDistance;
    container.style.transition = 'none';
    container.style.transform = `translateX(${offset}px)`;
  }

  /**
   * Handles the end of an interaction (touch or mouse)
   */
  function handleInteractionEnd() {
    if (!interactionState.isDragging) return;

    interactionState.isDragging = false;
    container.classList.remove('is-dragging');

    const dragDistance = interactionState.currentX - interactionState.startX;
    const dragDuration = performance.now() - interactionState.startTime;
    const { slideWidth, totalSlides } = getCarouselMetrics();

    if (Math.abs(dragDistance) < minSwipeDistance && dragDuration < 200) {
      updateCarousel();
      return;
    }

    let targetSlide = currentSlide;

    if (enableMomentum && Math.abs(interactionState.velocityX) > 0.5) {
      const { slideOffset, duration } = calculateMomentum(
        interactionState.velocityX,
        dragDistance,
      );
      targetSlide = Math.max(0, Math.min(currentSlide + slideOffset, totalSlides - 1));
      animateMomentum(targetSlide, duration);
    } else {
      const threshold = slideWidth * snapThreshold;
      if (Math.abs(dragDistance) > threshold) {
        targetSlide = dragDistance > 0 ? currentSlide - 1 : currentSlide + 1;
      }
      targetSlide = Math.max(0, Math.min(targetSlide, totalSlides - 1));
      goToSlide(targetSlide);
    }
  }

  /**
   * Handles the start of a touch interaction
   * @param {TouchEvent} e The touch event
   */
  function handleTouchStart(e) {
    handleInteractionStart(e.touches[0].clientX);
  }

  /**
   * Handles the movement during a touch interaction
   * @param {TouchEvent} e The touch event
   */
  function handleTouchMove(e) {
    handleInteractionMove(e.touches[0].clientX);
  }

  /**
   * Handles the end of a touch interaction
   */
  function handleTouchEnd() {
    handleInteractionEnd();
  }

  /**
   * Handles keyboard navigation for the carousel
   * @param {KeyboardEvent} e The keyboard event
   */
  function handleKeyDown(e) {
    const keyActions = {
      ArrowLeft: () => navigate(-1),
      ArrowRight: () => navigate(1),
      Home: () => goToSlide(0),
      End: () => goToSlide(getCarouselMetrics().totalSlides - 1),
    };

    if (keyActions[e.key]) {
      e.preventDefault();
      keyActions[e.key]();
    }
  }

  /**
   * Handles window resize events to recalculate carousel metrics
   */
  function handleResize() {
    const { itemsPerSlide, totalSlides } = getCarouselMetrics();

    // Only rebuild indicators if itemsPerSlide changed (not just window width)
    if (lastItemsPerSlide !== itemsPerSlide) {
      lastItemsPerSlide = itemsPerSlide;

      indicators.textContent = '';
      for (let i = 0; i < totalSlides; i += 1) {
        const indicator = createElement('button', {
          className: `indicator${i === 0 ? ' active' : ''}`,
          attributes: {
            'aria-label': `Go to slide ${i + 1} of ${totalSlides}`,
            type: 'button',
          },
        });
        indicator.addEventListener('click', () => goToSlide(i));
        indicators.appendChild(indicator);
      }

      if (currentSlide >= totalSlides) {
        currentSlide = totalSlides - 1;
      }
    }

    updateCarousel(true);
  }

  // Event listeners - arrows
  prevArrow.addEventListener('click', () => navigate(-1));
  nextArrow.addEventListener('click', () => navigate(1));

  // Touch events
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });
  container.addEventListener('touchend', handleTouchEnd);
  container.addEventListener('touchcancel', handleTouchEnd);

  // Keyboard navigation
  container.setAttribute('tabindex', '0');
  container.addEventListener('keydown', handleKeyDown);

  // Debounced resize handler
  const debouncedResize = debounce(handleResize, 150);

  // Assemble controls
  arrows.append(prevArrow, nextArrow);
  controls.append(indicators, arrows);
  block.appendChild(controls);

  // Initial setup
  handleResize();
  window.addEventListener('resize', debouncedResize);

  return {
    destroy: () => {
      window.removeEventListener('resize', debouncedResize);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('keydown', handleKeyDown);
      if (interactionState.animationId) {
        cancelAnimationFrame(interactionState.animationId);
      }
      controls.remove();
      liveRegion.remove();
    },
    goToSlide,
    navigate,
    getCurrentSlide: () => currentSlide,
  };
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
