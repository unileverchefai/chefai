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
  const controls = document.createElement('div');
  controls.className = 'controls';

  // Create ARIA live region for screen readers
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  block.appendChild(liveRegion);

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

  function navigate(direction) {
    const { totalSlides } = getCarouselMetrics();
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateCarousel();
  }

  function goToSlide(index, immediate = false) {
    const { totalSlides } = getCarouselMetrics();
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    updateCarousel(immediate);
  }

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

  function animateMomentum(targetSlide, duration) {
    const { slideWidth } = getCarouselMetrics();
    const startSlide = currentSlide;
    const startOffset = interactionState.dragOffset;
    const startTime = performance.now();

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

  function handleTouchStart(e) {
    handleInteractionStart(e.touches[0].clientX);
  }

  function handleTouchMove(e) {
    handleInteractionMove(e.touches[0].clientX);
  }

  function handleTouchEnd() {
    handleInteractionEnd();
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigate(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigate(1);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(getCarouselMetrics().totalSlides - 1);
        break;
      default:
        break;
    }
  }

  function handleResize() {
    const { itemsPerSlide, totalSlides } = getCarouselMetrics();

    // Only rebuild indicators if itemsPerSlide changed (not just window width)
    if (lastItemsPerSlide !== itemsPerSlide) {
      lastItemsPerSlide = itemsPerSlide;

      indicators.innerHTML = '';
      for (let i = 0; i < totalSlides; i += 1) {
        const indicator = document.createElement('button');
        indicator.className = `indicator${i === 0 ? ' active' : ''}`;
        indicator.setAttribute('aria-label', `Go to slide ${i + 1} of ${totalSlides}`);
        indicator.setAttribute('type', 'button');
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
  arrows.appendChild(prevArrow);
  arrows.appendChild(nextArrow);
  controls.appendChild(indicators);
  controls.appendChild(arrows);
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
