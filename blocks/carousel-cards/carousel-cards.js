import { createElement } from '@scripts/common.js';
import createCarousel from '@helpers/carousel/carousel.js';

export function initCarouselCards(block, carouselContainer, itemCount, options = {}) {
  const isStaticDesktop = typeof options.disableDesktopCarousel === 'boolean'
    ? options.disableDesktopCarousel
    : false; // Default to false - enable carousel on desktop

  if (isStaticDesktop) {
    block.classList.add('carousel-cards-static');
  }

  if (options.hideArrows) {
    block.classList.add('carousel-cards-no-arrows');
  }

  return createCarousel({
    container: carouselContainer,
    block,
    itemCount,
    mobileItemsPerSlide: 1,
    desktopItemsPerSlide: 3,
    mobileBreakpoint: 900,
    mobileGap: 16,
    desktopGap: 24,
    disableDesktopCarousel: isStaticDesktop,
    ...options,
  });
}

export default function decorate(block) {
  // Parse the block content - each row is a card
  const cards = [...block.children].map((row) => {
    const cell = row.children[0];

    // Look for h2 as title
    const h2 = cell.querySelector('h2');
    const title = h2 ? h2.textContent.trim() : '';

    // Get the text content (everything else)
    let textHTML = '';
    if (h2) {
      // Remove h2 and get remaining content
      const clone = cell.cloneNode(true);
      const h2Clone = clone.querySelector('h2');
      if (h2Clone) h2Clone.remove();
      textHTML = clone.innerHTML.trim();
    } else {
      textHTML = cell.innerHTML.trim();
    }

    return {
      title,
      textHTML,
    };
  }).filter((cardData) => cardData.textHTML); // Text is mandatory (title is optional!)

  // Validate minimum 3 items requirement (specs requirement)
  const MIN_ITEMS = 3;
  if (cards.length < MIN_ITEMS) {
    block.remove();
    return;
  }

  block.innerHTML = '';

  // Carousel with cards is a list
  const carouselContainer = createElement('ul', { className: 'carousel-cards-container' });

  cards.forEach((cardData, index) => {
    const card = createElement('li', { className: 'card', attributes: { 'data-node-id': `card-${index}` } });

    if (cardData.title) {
      const title = createElement('div', { className: 'cards-card-title' });

      // Add small class for text titles (not percentage titles)
      const isPercentage = /^\d+%$/.test(cardData.title);
      if (!isPercentage) {
        title.classList.add('small');
      }

      title.textContent = cardData.title;
      card.appendChild(title);
    }

    if (cardData.textHTML) {
      const text = createElement('div', { className: 'cards-card-body' });

      const htmlContent = cardData.textHTML.replace(/<u>(.*?)<\/u>/gi, '<span class="highlight">$1</span>');

      text.innerHTML = htmlContent;
      card.appendChild(text);
    }

    carouselContainer.appendChild(card);
  });

  block.appendChild(carouselContainer);

  // If exactly 3 items, display as static layout (no carousel on desktop)
  // Mobile always uses carousel :)
  const STATIC_LAYOUT_COUNT = 3;
  const isStaticDesktop = cards.length === STATIC_LAYOUT_COUNT;

  try {
    const carousel = initCarouselCards(block, carouselContainer, cards.length, {
      disableDesktopCarousel: isStaticDesktop,
    });

    // Store carousel instance for cleanup
    block.carouselInstance = carousel;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize carousel:', error);
    // Fallback: show all cards in static layout
    block.classList.add('carousel-cards-static');
  }
}

/**
 * Cleanup function to destroy carousel instance
 * @param {Element} block The carousel block element
 */
export function destroy(block) {
  if (block.carouselInstance) {
    block.carouselInstance.destroy();
    block.carouselInstance = null;
  }
}
