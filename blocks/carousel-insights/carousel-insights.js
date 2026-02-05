import { createElement } from '@scripts/common.js';
import createCarousel from '@helpers/carousel/carousel.js';
import { fetchInsights } from './constants/api.js';

/**
 * Render a thread card using the insights styling (title + CTA).
 */
function renderCard(item, index) {
  const card = createElement('li', {
    className: 'card',
    attributes: {
      'data-item-id': item.id ?? `item-${index}`,
      'data-node-id': `card-${index}`,
    },
  });

  const title = createElement('div', { className: 'cards-card-title' });
  title.textContent = item.display_text ?? item.title ?? `Conversation ${index + 1}`;
  card.appendChild(title);

  const buttonText = item.button_text ?? item.cta_label ?? 'Show me the details';
  const button = createElement('button', {
    className: 'btn carousel-insights-btn',
  });
  button.textContent = buttonText;
  card.appendChild(button);

  return card;
}

export default function decorate(block) {
  // Ensure base carousel styling
  block.classList.add('carousel-base');
  block.classList.add('carousel-insights');

  const userId = block.dataset.userId ?? 'staging-user';
  const limit = parseInt(block.dataset.limit ?? '3', 10);

  // Clear authored content and create container
  block.innerHTML = '';
  const list = createElement('ul', {
    className: 'carousel-cards-container',
  });
  block.appendChild(list);

  // Fetch insights on load
  fetchInsights({ user_id: userId, limit })
    .then((items) => {
      if (!items || items.length === 0) {
        const empty = createElement('div', { className: 'carousel-insights-empty' });
        empty.textContent = 'No insights available.';
        block.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        list.appendChild(renderCard(item, index));
      });

      // Initialize carousel with the loaded items
      try {
        const carousel = createCarousel({
          container: list,
          block,
          itemCount: items.length,
          mobileItemsPerSlide: 1,
          desktopItemsPerSlide: 3,
          mobileBreakpoint: 900,
          mobileGap: 16,
          desktopGap: 24,
          disableDesktopCarousel: false,
        });
        block.carouselInstance = carousel;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize carousel-insights:', error);
      }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load recommendations:', error);
      const errorState = createElement('div', { className: 'carousel-insights-error' });
      errorState.textContent = 'Failed to load insights.';
      block.appendChild(errorState);
    });
}
