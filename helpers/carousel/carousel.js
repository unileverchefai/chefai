import { createElement } from '@scripts/common.js';

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
 * Easing function for deceleration (used in momentum)
 * @param {number} t Progress value between 0 and 1
 * @returns {number} Eased value
 */
function easeOutQuart(t) {
  return 1 - ((1 - t) ** 4);
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
 * @property {boolean} [swipeOnDesktop=false] - Enable mouse drag/swipe on desktop
 * @property {boolean} [hideArrows=false] - Hide navigation arrows
 * @property {boolean} [enableMomentum=true] - Enable momentum scrolling
 * @property {number} [momentumMultiplier=2] - Momentum strength (1-5)
 * @property {number} [snapThreshold=0.3] - Swipe threshold to trigger slide change
 * @property {number} [minSwipeDistance=50] - Minimum swipe distance (px)
 * @property {number} [maxMomentumDuration=800] - Max momentum animation duration (ms)
 * @property {boolean} [disableSnap=false] - Disable snap to slide on drag end
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
export default function createCarousel(options) {
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
    swipeOnDesktop = false,
    hideArrows = false,
    enableMomentum = true,
    momentumMultiplier = 2,
    snapThreshold = 0.3,
    minSwipeDistance = 50,
    maxMomentumDuration = 800,
    disableSnap = false,
  } = options;

  // Carousel state
  let currentSlide = 0;
  let lastItemsPerSlide = null;
  let freeScrollOffset = null; // Track actual pixel offset for free scrolling

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
    velocityHistory: [],
    touchId: null,
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

  // Create arrows (only if not hidden)
  let arrows = null;
  let prevArrow = null;
  let nextArrow = null;

  if (!hideArrows) {
    arrows = createElement('div', { className: 'arrows' });

    prevArrow = createElement('button', {
      className: 'arrow prev',
      attributes: { 'aria-label': 'Previous slide' },
      innerContent: `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.67 14.67L13.2 12.2L15.67 9.73L14.73 8.8L11.33 12.2L14.73 15.6L15.67 14.67Z"/>
        </svg>
      `,
    });

    nextArrow = createElement('button', {
      className: 'arrow next',
      attributes: { 'aria-label': 'Next slide' },
      innerContent: `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.33 14.67L10.8 12.2L8.33 9.73L9.27 8.8L12.67 12.2L9.27 15.6L8.33 14.67Z"/>
        </svg>
      `,
    });
  }

  /**
   * Calculates carousel metrics based on current viewport and settings
   * @returns {Object} Metrics including:
   * itemWidth, isMobile, gap, itemsPerSlide, slideWidth, totalSlides
  */
  function getCarouselMetrics() {
    const firstItem = container.querySelector('.card, .carousel-item, .trend-card');

    // const firstItem = container.querySelector('.carousel-video-item, .carousel-card-item,
    //  .card, .carousel-item, .trend-card'); ??
    // Maybe a less generic approach like const firstItem = container.firstElementChild;??

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
   * @param {number} customOffset Optional custom offset to use instead of slide-based positioning
   */
  function updateCarousel(immediate = false, customOffset = null) {
    const { isMobile, slideWidth, totalSlides } = getCarouselMetrics();

    // Disable carousel transform on desktop if disableDesktopCarousel is true
    if (disableDesktopCarousel && !isMobile) {
      container.style.transform = 'translateX(0)';
    } else {
      const offset = customOffset !== null ? customOffset : -currentSlide * slideWidth;
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

    // Update indicators (only when we have at least 3 slides)
    const indicatorButtons = indicators.querySelectorAll('.indicator');
    indicatorButtons.forEach((ind, idx) => {
      ind.classList.toggle('active', idx === currentSlide);
    });

    // Enable/disable arrows based on number of slides
    if (!hideArrows && arrows && prevArrow && nextArrow) {
      const disableArrows = totalSlides <= 1;
      [prevArrow, nextArrow].forEach((arrowButton) => {
        arrowButton.disabled = disableArrows;
        arrowButton.classList.toggle('disabled', disableArrows);
      });
    }

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
    freeScrollOffset = null; // Reset free scroll when navigating with arrows
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
    freeScrollOffset = null; // Reset free scroll when programmatically navigating
    updateCarousel(immediate);
  }

  /**
   * Calculates average velocity from velocity history for smoother momentum
   * @returns {number} Average velocity
   */
  function getAverageVelocity() {
    if (interactionState.velocityHistory.length === 0) return 0;
    const recent = interactionState.velocityHistory.slice(-5);
    return recent.reduce((sum, v) => sum + v, 0) / recent.length;
  }

  /**
   * Calculates momentum for swipe gestures with improved physics
   * @param {number} velocity The swipe velocity
   * @param {number} dragDistance The distance dragged
   * @returns {Object} Contains slideOffset and duration for the momentum animation
   */
  function calculateMomentum(velocity, dragDistance) {
    const { slideWidth, totalSlides } = getCarouselMetrics();
    const avgVelocity = getAverageVelocity();
    const effectiveVelocity = Math.abs(avgVelocity) > 0.1 ? avgVelocity : velocity;

    const absVelocity = Math.abs(effectiveVelocity);
    const minDuration = 200;
    const maxDuration = maxMomentumDuration;
    const calculatedDuration = absVelocity * momentumMultiplier * 80;
    const duration = Math.max(minDuration, Math.min(calculatedDuration, maxDuration));

    const deceleration = 0.0015;
    const distance = (effectiveVelocity * effectiveVelocity) / (2 * deceleration);
    const finalPosition = dragDistance + (effectiveVelocity > 0 ? distance : -distance);
    const slideOffset = Math.round((-finalPosition) / slideWidth);

    const maxOffset = totalSlides - 1 - currentSlide;
    const minOffset = -currentSlide;
    const clampedOffset = Math.max(minOffset, Math.min(maxOffset, slideOffset));

    return { slideOffset: clampedOffset, duration };
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
      const eased = easeOutQuart(progress);

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
    interactionState.velocityHistory = [];

    container.classList.add('is-dragging');
  }

  /**
   * Calculates resistance at edges (bounce effect)
   * @param {number} offset The current offset
   * @param {number} slideWidth Width of one slide
   * @param {number} totalSlides Total number of slides
   * @returns {number} Adjusted offset with resistance
   */
  function applyEdgeResistance(offset, slideWidth, totalSlides) {
    const minOffset = 0;
    const maxOffset = -(totalSlides - 1) * slideWidth;
    const resistance = 0.3;

    if (offset > minOffset) {
      return minOffset + (offset - minOffset) * resistance;
    }
    if (offset < maxOffset) {
      return maxOffset + (offset - maxOffset) * resistance;
    }
    return offset;
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
      const instantVelocity = deltaX / deltaTime;
      interactionState.velocityX = instantVelocity;

      interactionState.velocityHistory.push(instantVelocity);
      if (interactionState.velocityHistory.length > 10) {
        interactionState.velocityHistory.shift();
      }
    }

    interactionState.currentX = clientX;
    interactionState.lastX = clientX;
    interactionState.lastTime = currentTime;

    const dragDistance = clientX - interactionState.startX;
    interactionState.dragOffset = dragDistance;

    const { slideWidth, isMobile, totalSlides } = getCarouselMetrics();

    if (disableDesktopCarousel && !isMobile) return;

    // Use freeScrollOffset as base if available, otherwise use slide-based positioning
    const baseOffset = disableSnap && freeScrollOffset !== null
      ? freeScrollOffset
      : -currentSlide * slideWidth;
    let offset = baseOffset + dragDistance;

    offset = applyEdgeResistance(offset, slideWidth, totalSlides);

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

    if (Math.abs(dragDistance) < minSwipeDistance && dragDuration < 300) {
      updateCarousel();
      return;
    }

    let targetSlide = currentSlide;
    const avgVelocity = getAverageVelocity();
    const absVelocity = Math.abs(avgVelocity);

    if (disableSnap) {
      // Free scroll: preserve the exact drag position without snapping
      const baseOffset = freeScrollOffset !== null ? freeScrollOffset : -currentSlide * slideWidth;
      const finalOffset = baseOffset + dragDistance;
      const clampedOffset = Math.max(
        -(totalSlides - 1) * slideWidth,
        Math.min(0, finalOffset),
      );

      // Store the actual pixel offset for next drag
      freeScrollOffset = clampedOffset;

      // Update currentSlide approximately for indicators, but don't snap
      const approximateSlide = Math.round(-clampedOffset / slideWidth);
      currentSlide = Math.max(0, Math.min(approximateSlide, totalSlides - 1));

      // Keep the carousel at the exact dragged position
      container.style.transition = 'none';
      container.style.transform = `translateX(${clampedOffset}px)`;

      // Update indicators based on approximate position
      indicators.querySelectorAll('.indicator').forEach((ind, idx) => {
        ind.classList.toggle('active', idx === currentSlide);
      });

      interactionState.dragOffset = 0;
    } else {
      // Reset free scroll offset when snap is enabled
      freeScrollOffset = null;

      if (enableMomentum && absVelocity > 0.3) {
        const { slideOffset, duration } = calculateMomentum(
          avgVelocity,
          dragDistance,
        );
        targetSlide = Math.max(0, Math.min(currentSlide + slideOffset, totalSlides - 1));

        if (targetSlide !== currentSlide) {
          animateMomentum(targetSlide, duration);
        } else {
          updateCarousel();
        }
      } else {
        const threshold = slideWidth * snapThreshold;
        const absDistance = Math.abs(dragDistance);

        if (absDistance > threshold || (absDistance > minSwipeDistance && dragDuration < 200)) {
          targetSlide = dragDistance > 0 ? currentSlide - 1 : currentSlide + 1;
        }

        targetSlide = Math.max(0, Math.min(targetSlide, totalSlides - 1));
        goToSlide(targetSlide);
      }
    }

    interactionState.velocityHistory = [];
  }

  /**
   * Handles the start of a touch interaction
   * @param {TouchEvent} e The touch event
   */
  function handleTouchStart(e) {
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    interactionState.touchId = touch.identifier;
    handleInteractionStart(touch.clientX);
  }

  /**
   * Handles the movement during a touch interaction
   * @param {TouchEvent} e The touch event
   */
  function handleTouchMove(e) {
    if (!interactionState.isDragging) return;

    if (e.touches.length > 1) {
      handleInteractionEnd();
      return;
    }

    const touch = Array.from(e.touches).find((t) => t.identifier === interactionState.touchId);
    if (touch) {
      e.preventDefault();
      handleInteractionMove(touch.clientX);
    }
  }

  /**
   * Handles the end of a touch interaction
   */
  function handleTouchEnd() {
    handleInteractionEnd();
  }

  /**
   * Handles the start of a mouse interaction
   * @param {MouseEvent} e The mouse event
   */
  function handleMouseDown(e) {
    if (e.button !== 0 || !swipeOnDesktop) return;
    const { isMobile } = getCarouselMetrics();
    if (isMobile) return;
    e.preventDefault();
    handleInteractionStart(e.clientX);
  }

  /**
   * Handles the movement during a mouse interaction
   * @param {MouseEvent} e The mouse event
   */
  function handleMouseMove(e) {
    if (!swipeOnDesktop || !interactionState.isDragging) return;
    handleInteractionMove(e.clientX);
  }

  /**
   * Handles the end of a mouse interaction
   */
  function handleMouseUp() {
    if (!swipeOnDesktop || !interactionState.isDragging) return;
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

      // Only render bullets when there are at least 3 items AND more than 1 slide
      if (itemCount >= 3 && totalSlides > 1) {
        indicators.style.display = '';
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
      } else {
        // Hide indicators when there are fewer than 3 slides
        indicators.style.display = 'none';
        if (currentSlide >= totalSlides) {
          currentSlide = totalSlides - 1;
        }
      }
    }

    updateCarousel(true);
  }

  // Event listeners - arrows
  if (!hideArrows && prevArrow && nextArrow) {
    prevArrow.addEventListener('click', () => navigate(-1));
    nextArrow.addEventListener('click', () => navigate(1));
  }

  // Touch events
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd);
  container.addEventListener('touchcancel', handleTouchEnd);

  // Mouse events for desktop dragging (only if enabled)
  if (swipeOnDesktop) {
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Keyboard navigation
  container.setAttribute('tabindex', '0');
  container.addEventListener('keydown', handleKeyDown);

  // Debounced resize handler
  const debouncedResize = debounce(handleResize, 150);

  // Assemble controls
  controls.append(indicators);
  if (!hideArrows && arrows && prevArrow && nextArrow) {
    arrows.append(prevArrow, nextArrow);
    controls.append(arrows);
  }
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
      if (swipeOnDesktop) {
        container.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
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
