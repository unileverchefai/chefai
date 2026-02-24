import { createElement } from '@scripts/common.js';
import createCarousel from '@helpers/carousel/carousel.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import openChatbotModal from '@helpers/chatbot/openChatbotModal.js';
import {
  setCookie,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  getAnonymousUserId,
  createThreadWithRecommendation,
  loadThreadMessages,
  loadMarkedPurify,
} from '@scripts/custom/utils.js';

await loadMarkedPurify();

const DEFAULT_LIMIT = 10;

async function fetchInsights({ userId, limit, type }) {
  const payload = {
    user_id: userId,
    limit,
    type,
  };

  const endpoint = ENDPOINTS.recommendationsTimeBased;

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

async function ensureInsightsThread(recommendationId) {
  const storageKey = `chefai-insights-thread-${recommendationId}`;

  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed?.threadId) {
      setCookie('chef-ai-thread-id', parsed.threadId);
      return {
        threadId: parsed.threadId,
        displayText: parsed.displayText ?? '',
        isNew: false,
      };
    }
  }

  let userId = getUserIdFromCookie() ?? getAnonymousUserIdFromCookie();
  if (!userId) {
    userId = await getAnonymousUserId();
  }

  const { threadId, displayText } = await createThreadWithRecommendation(userId, recommendationId);

  sessionStorage.setItem(storageKey, JSON.stringify({
    threadId,
    displayText,
    initialized: true,
  }));
  sessionStorage.setItem(`chefai-insights-headline-${threadId}`, displayText);

  return {
    threadId,
    displayText: displayText ?? '',
    isNew: true,
  };
}

/**
 * Render a single insight card (title + optional description + CTA button).
 */
function renderCard(item, index, onActivate) {
  const card = createElement('li', {
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

  const handleActivate = () => {
    if (typeof onActivate === 'function') {
      onActivate(item);
    }
  };

  const button = card.querySelector('button');
  button.addEventListener('click', handleActivate);

  return card;
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

  const handleCardActivate = async (item) => {
    const recommendationId = item.id ?? item.recommendation_id ?? '';
    if (!recommendationId) {
      return;
    }

    let result = { isNew: false, displayText: '' };
    try {
      result = await ensureInsightsThread(recommendationId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to prepare insights thread:', error);
    }

    const messageInsight = await loadThreadMessages(result.threadId);

    openChatbotModal('insights')
      .then(() => {
        if (messageInsight && messageInsight.length > 0) {
          // 1) Markdown -> HTML
          const rawHtml = window.marked?.parse(messageInsight[0]?.text.replace(`**${item.title}**`, '').trim());
          // 2) Sanitize (important if text comes from BE)
          const sanHtml = window.DOMPurify?.sanitize(rawHtml);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chefai:insights', {
              detail: {
                headlineTitle: item.title,
                displayText: sanHtml,
                prompts: messageInsight[0].metadata?.suggested_prompts ?? [],
              },
            }));
          }, 400);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to open chatbot from quick action:', error);
      });
  };

  // Fetch insights on load
  fetchInsights({ userId, limit })
    .then((items) => {
      if (!items || items.length === 0) {
        const empty = createElement('div', { className: 'carousel-insights-empty' });
        empty.textContent = 'No insights available.';
        block.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        list.appendChild(renderCard(item, index, handleCardActivate));
      });

      items.forEach((item, index) => {
        list.appendChild(renderCard(item, index));
      });

      initializeCarousel(block, list, items.length);
    }).catch((error) => {
    // eslint-disable-next-line no-console
      console.error('Failed to load time-sensitive recommendations:', error);
      const errorState = createElement('div', { className: 'carousel-insights-error' });
      errorState.textContent = 'Nothing urgent right now. We will show time-sensitive moves as they come up.';
      block.appendChild(errorState);
    });
}
