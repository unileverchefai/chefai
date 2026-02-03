import { createElement } from '@scripts/common.js';
import { initCarouselCards } from '../carousel-cards/carousel-cards.js';
import { fetchPaginatedData } from './constants/api.js';

/**
 * Render a card item in the carousel
 * @param {Object} item - Item data
 * @param {number} index - Item index
 * @param {number} offset - API offset number for this card
 * @returns {HTMLElement} Card element
 */
function renderCard(item, index, offset) {
  const card = createElement('li', {
    className: 'card',
    attributes: {
      'data-item-id': item.thread_id ?? item.id ?? `item-${index}`,
      'data-node-id': `card-${index}`,
      'data-thread-id': item.thread_id ?? '',
      'data-offset': offset.toString(),
    },
  });

  // Use same structure as carousel-cards
  if (item.display_text ?? item.title) {
    const title = createElement('div', { className: 'cards-card-title' });
    title.textContent = item.display_text ?? item.title ?? `Item ${index + 1}`;
    card.appendChild(title);
  }

  // Card body with date, ID, and offset
  const cardBody = createElement('div', { className: 'cards-card-body' });
  
  // Display offset number
  const offsetEl = createElement('p', { style: 'font-size: 12px; opacity: 0.7; font-weight: 500;' });
  offsetEl.textContent = `Offset: ${offset}`;
  cardBody.appendChild(offsetEl);
  
  if (item.updated_at) {
    const date = createElement('p', {});
    const dateObj = new Date(item.updated_at);
    date.textContent = `Updated: ${dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}`;
    cardBody.appendChild(date);
  }

  if (item.thread_id) {
    const id = createElement('p', { style: 'font-size: 11px; opacity: 0.5; font-family: monospace;' });
    id.textContent = `ID: ${item.thread_id.substring(0, 8)}...`;
    cardBody.appendChild(id);
  }

  if (cardBody.children.length > 0) {
    card.appendChild(cardBody);
  }

  return card;
}

/**
 * Initialize carousel with current items
 * Uses the same pattern as carousel-cards for consistent behavior
 * @param {HTMLElement} block - Block element
 * @param {HTMLElement} container - Carousel container
 * @param {number} itemCount - Total item count
 * @param {Object} options - Carousel options
 */
function initializeCarousel(block, container, itemCount, options = {}) {
  if (block.carouselInstance?.destroy) {
    block.carouselInstance.destroy();
  }

  // Ensure block has carousel-cards class for proper styling and behavior
  if (!block.classList.contains('carousel-cards')) {
    block.classList.add('carousel-cards');
  }

  try {
    const carousel = initCarouselCards(block, container, itemCount, {
      disableDesktopCarousel: false, // Enable carousel on desktop for AJAX loading
      ...options,
    });

    block.carouselInstance = carousel;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize carousel:', error);
    // Fallback: show all cards in static layout
    block.classList.add('carousel-cards-static');
  }
}

/**
 * Check if user is on the previous-to-last slide (trigger preload)
 * @param {HTMLElement} block - Block element
 * @returns {boolean} True if user is on previous-to-last slide or earlier
 */
function isNearEnd(block) {
  const carousel = block.carouselInstance;
  if (!carousel || !carousel.getCurrentSlide) {
    return false;
  }

  const currentSlide = carousel.getCurrentSlide();
  
  // Get carousel metrics to calculate total slides
  const container = block.querySelector('.carousel-cards-container');
  if (!container) {
    return false;
  }

  const firstItem = container.querySelector('.card');
  if (!firstItem) {
    return false;
  }

  const itemWidth = firstItem.offsetWidth || 0;
  const isMobile = window.innerWidth < 900;
  const itemsPerSlide = isMobile ? 1 : 3;
  const totalItems = container.querySelectorAll('.card').length;
  const totalSlides = Math.ceil(totalItems / itemsPerSlide);

  // Trigger load when user is on the previous-to-last slide (2 slides from end)
  // This gives us time to load before they reach the end
  const triggerSlide = Math.max(0, totalSlides - 2);

  return currentSlide >= triggerSlide;
}

/**
 * Load more items and append to carousel
 * @param {HTMLElement} block - Block element
 * @param {HTMLElement} container - Carousel container
 * @param {Object} state - Current state
 */
async function loadMoreItems(block, container, state) {
  if (state.isLoading || state.hasMore === false) {
    return;
  }

  state.isLoading = true;

  // Show loading indicator
  const loadingIndicator = block.querySelector('.ajax-carousel-loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  try {
    const newItems = await fetchPaginatedData({
      user_id: state.userId,
      limit: state.limit,
      offset: state.currentOffset,
      is_saved: state.isSaved,
    });

    if (newItems.length === 0) {
      state.hasMore = false;
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      return;
    }

    // Render and append new cards - all items from this batch use the same API offset
    const apiOffset = state.currentOffset; // Store the API offset used for this batch
    newItems.forEach((item) => {
      const card = renderCard(item, state.totalItems, apiOffset);
      container.appendChild(card);
      state.totalItems += 1;
    });

    // Update offset for next load (increment by number of items loaded)
    state.currentOffset += newItems.length;

    // Preserve current slide position before reinitializing
    const currentSlide = block.carouselInstance?.getCurrentSlide?.() ?? 0;

    // Reinitialize carousel with new item count
    initializeCarousel(block, container, state.totalItems);

    // Restore the slide position after reinitializing
    if (block.carouselInstance && currentSlide > 0) {
      // Use setTimeout to ensure carousel is fully initialized
      setTimeout(() => {
        if (block.carouselInstance?.goToSlide) {
          block.carouselInstance.goToSlide(currentSlide, true); // true = immediate (no animation)
        }
      }, 0);
    }

    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    // Check if we got fewer items than requested (end of data)
    if (newItems.length < state.limit) {
      state.hasMore = false;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load more items:', error);
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  } finally {
    state.isLoading = false;
  }
}

/**
 * Setup scroll detection for lazy loading
 * @param {HTMLElement} block - Block element
 * @param {HTMLElement} container - Carousel container
 * @param {Object} state - Current state
 */
function setupScrollDetection(block, container, state) {
  let checkTimeout;
  let lastCheckedOffset = -1; // Track the last offset we checked to prevent duplicate requests

  const checkScroll = () => {
    // Prevent concurrent requests and duplicate checks
    if (state.isLoading || state.hasMore === false) {
      return;
    }

    // Prevent checking the same offset multiple times
    if (state.currentOffset === lastCheckedOffset) {
      return;
    }

    if (isNearEnd(block)) {
      lastCheckedOffset = state.currentOffset; // Mark this offset as being checked
      loadMoreItems(block, container, state).then(() => {
        // Reset after successful load
        lastCheckedOffset = -1;
      }).catch(() => {
        // Reset on error so we can retry
        lastCheckedOffset = -1;
      });
    }
  };

  // Debounced check function
  const debouncedCheck = () => {
    clearTimeout(checkTimeout);
    checkTimeout = setTimeout(checkScroll, 300);
  };

  // Check on carousel navigation (arrow clicks, indicators)
  const controls = block.querySelector('.controls');
  if (controls) {
    controls.addEventListener('click', debouncedCheck);
  }

  // Check on touch/mouse drag end
  container.addEventListener('touchend', debouncedCheck);

  // Check periodically (fallback) - but less frequently
  const intervalId = setInterval(() => {
    if (!state.isLoading && state.hasMore && state.currentOffset !== lastCheckedOffset) {
      checkScroll();
    }
  }, 1500); // Increased interval to reduce duplicate checks

  // Store interval ID for cleanup
  block.scrollCheckInterval = intervalId;
}

/**
 * Parse initial content from server-rendered HTML
 * Supports EDS SSR - if content exists in block, use it
 * Works with table rows (from Document Authoring) or divs with data attributes
 * @param {HTMLElement} block - Block element
 * @returns {Array} Array of parsed items or empty array
 */
function parseInitialContent(block) {
  const items = [];
  const rows = [...block.children];

  // Check if block has server-rendered content
  if (rows.length > 0) {
    rows.forEach((row, index) => {
      // Skip already processed elements (carousel container, loading indicator, etc.)
      if (row.classList.contains('carousel-cards-container')
          || row.classList.contains('ajax-carousel-container')
          || row.classList.contains('ajax-carousel-loading')
          || row.classList.contains('ajax-carousel-empty')
          || row.classList.contains('ajax-carousel-error')) {
        return;
      }

      // Support table rows (from Document Authoring) or divs
      const cells = row.children;
      let title = '';
      let threadId = row.dataset.threadId;
      let displayText = row.dataset.displayText;
      let updatedAt = row.dataset.updatedAt;

      // Parse from table structure (EDS pattern)
      if (cells.length > 0) {
        const firstCell = cells[0];
        const titleEl = firstCell.querySelector('h2, h3, p') ?? firstCell;
        title = titleEl?.textContent?.trim() ?? '';
      } else {
        // Direct content in row (div with h2/h3)
        const titleEl = row.querySelector('h2, h3');
        title = titleEl?.textContent?.trim() ?? '';
      }

      // Extract from data attributes or content
      const item = {
        thread_id: threadId ?? `item-${index}`,
        display_text: displayText ?? title ?? `Item ${index + 1}`,
        updated_at: updatedAt ?? null,
      };

      if (item.display_text || item.thread_id) {
        items.push(item);
      }
    });
  }

  return items;
}

export default function decorate(block) {
  // Add carousel-cards class for proper styling and behavior
  block.classList.add('carousel-cards');

  // Parse configuration from block data attributes or content
  const userId = block.dataset.userId ?? 'user123'; // Default for testing
  const limit = parseInt(block.dataset.limit ?? '5', 10);
  const isSaved = block.dataset.isSaved === 'true';

  // Check for server-rendered content (SSR support)
  const initialServerContent = parseInitialContent(block);
  const hasServerContent = initialServerContent.length > 0;

  // Create carousel container - use same class as carousel-cards for consistency
  let carouselContainer = block.querySelector('.carousel-cards-container') 
    ?? block.querySelector('.ajax-carousel-container');

  if (!carouselContainer) {
    carouselContainer = createElement('ul', {
      className: 'carousel-cards-container',
    });

    // If we have server content, convert it to carousel structure
    if (hasServerContent) {
      // Convert existing content to carousel cards - server content uses offset 0
      const serverApiOffset = 0;
      initialServerContent.forEach((item) => {
        const card = renderCard(item, carouselContainer.children.length, serverApiOffset);
        carouselContainer.appendChild(card);
      });

      // Remove original server-rendered rows after conversion
      // (preserve only carousel container and other utility elements)
      const rowsToRemove = [...block.children].filter((child) => {
        return !child.classList.contains('carousel-cards-container')
          && !child.classList.contains('ajax-carousel-container')
          && !child.classList.contains('ajax-carousel-loading')
          && !child.classList.contains('ajax-carousel-empty')
          && !child.classList.contains('ajax-carousel-error');
      });
      rowsToRemove.forEach((row) => row.remove());

      block.insertBefore(carouselContainer, block.firstChild);
    } else {
      // No server content - clear and create fresh
      block.innerHTML = '';
      block.appendChild(carouselContainer);
    }
  }

  // Create loading indicator (only if it doesn't exist)
  let loadingIndicator = block.querySelector('.ajax-carousel-loading');
  if (!loadingIndicator) {
    loadingIndicator = createElement('div', {
      className: 'ajax-carousel-loading',
    });
    loadingIndicator.textContent = 'Loading more...';
    loadingIndicator.style.display = 'none';
    block.appendChild(loadingIndicator);
  }

  // Initialize state - ensure offset starts at 0 for API calls
  // If we have server content, we still start API calls from offset 0
  // but we need to account for server items when calculating next offset
  const state = {
    userId,
    limit,
    isSaved,
    currentOffset: hasServerContent ? initialServerContent.length : 0, // Start from server content count or 0
    totalItems: hasServerContent ? initialServerContent.length : 0,
    isLoading: false,
    hasMore: true,
  };

  // If we have server content, initialize carousel with it
  if (hasServerContent) {
    // Initialize carousel with server-rendered content
    setTimeout(() => {
      initializeCarousel(block, carouselContainer, state.totalItems);
      setupScrollDetection(block, carouselContainer, state);
    }, 0);
  } else {
    // Load initial items via AJAX (client-side only)
    fetchPaginatedData({
      user_id: userId,
      limit,
      offset: 0,
      is_saved: isSaved,
    })
      .then((initialItems) => {
        if (initialItems.length === 0) {
          const emptyState = createElement('div', {
            className: 'ajax-carousel-empty',
          });
          emptyState.textContent = 'No items found.';
          block.appendChild(emptyState);
          return;
        }

        // Render initial cards - all items from first batch use offset 0
        const initialApiOffset = 0; // First API call uses offset=0
        initialItems.forEach((item, index) => {
          const card = renderCard(item, index, initialApiOffset);
          carouselContainer.appendChild(card);
          state.totalItems += 1;
        });

        // Update offset for next load (increment by number of items loaded)
        // This ensures sequential offsets: 0, 5, 10, 15, etc.
        state.currentOffset = initialItems.length;

        // Check if there's more data
        if (initialItems.length < limit) {
          state.hasMore = false;
        }

        // Initialize carousel
        setTimeout(() => {
          initializeCarousel(block, carouselContainer, state.totalItems);
          setupScrollDetection(block, carouselContainer, state);
        }, 0);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load initial items:', error);
        const errorState = createElement('div', {
          className: 'ajax-carousel-error',
        });
        errorState.textContent = 'Failed to load items. Please try again later.';
        block.appendChild(errorState);
      });
  }
}

/**
 * Cleanup function to destroy carousel instance and intervals
 * @param {HTMLElement} block - The carousel block element
 */
export function destroy(block) {
  if (block.carouselInstance) {
    block.carouselInstance.destroy();
    block.carouselInstance = null;
  }

  if (block.scrollCheckInterval) {
    clearInterval(block.scrollCheckInterval);
    block.scrollCheckInterval = null;
  }
}
