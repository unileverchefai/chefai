import { createElement } from '@scripts/common.js';
import createCarousel from '@helpers/carousel/carousel.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@scripts/custom/utils.js';

const DEFAULT_LIMIT = 10;
const DEFAULT_TYPE = 'main';

async function fetchInsights({ userId, limit, type }) {
  const payload = {
    user_id: userId,
    limit,
    type,
  };

  const endpoint = `${ENDPOINTS.recommendations}/`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to load insights: ${response.status}`);
  }

  const data = await response.json();
  return data.recommendations ?? data.data?.recommendations ?? [];
}

/**
 * Render a single insight card (title + optional description + CTA button).
 */
function renderCard(item, index) {
  return createElement('li', {
    className: 'card',
    attributes: {
      'data-item-id': item.id ?? `item-${index}`,
      'data-node-id': `card-${index}`,
    },
    innerContent: `
      <h2 class="cards-card-title">
        ${item.display_text ?? item.title ?? `Conversation ${index + 1}`}
      </h2>
      ${
  item.description
    ? `<div class="carousel-insights-description">${item.description}</div>`
    : ''
}
      <button class="btn carousel-insights-btn">
        ${item.button_text ?? item.cta_label ?? 'Show me the details'}
      </button>
    `,
  });
}

function initializeCarousel(block, list, itemsLength) {
  const carousel = createCarousel({
    container: list,
    block,
    itemCount: itemsLength,
    mobileItemsPerSlide: 1,
    desktopItemsPerSlide: 3,
    mobileBreakpoint: 900,
    mobileGap: 16,
    desktopGap: 24,
    disableDesktopCarousel: false,
  });

  // Expose instance for potential teardown/debug
  // eslint-disable-next-line no-param-reassign
  block.carouselInstance = carousel;
}

export default async function decorate(block) {
  block.classList.add('carousel-insights');

  const userId = getUserIdFromCookie();
  if (!userId) {
    return;
  }

  const limit = parseInt(block.dataset.limit ?? `${DEFAULT_LIMIT}`, 10);

  // Clear authored content and create container
  block.innerHTML = '';
  const list = createElement('ul', {
    className: 'carousel-cards-container',
  });
  block.appendChild(list);

  try {
    const items = await fetchInsights({ userId, limit, type: DEFAULT_TYPE });

    if (!items || items.length === 0) {
      return;
    }

    items.forEach((item, index) => {
      list.appendChild(renderCard(item, index));
    });

    initializeCarousel(block, list, items.length);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load recommendations:', error);
    const errorState = createElement('div', { className: 'carousel-insights-error' });
    errorState.textContent = 'Failed to load insights.';
    block.appendChild(errorState);
  }
}
