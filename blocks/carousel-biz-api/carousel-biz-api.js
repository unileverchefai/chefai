import createCarousel from '@helpers/carousel/carousel.js';
import openChatbotModal from '@helpers/chatbot/openChatbotModal.js';
import { decorateIcons } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import {
  setCookie,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  getAnonymousUserId,
  createThreadWithRecommendation,
} from '@scripts/custom/utils.js';
import fetchRecommendations from './fetchRecommendations.js';

const MIN_ITEMS = 3;
const LOADING_CARD_COUNT = 4;

/**
 * Mapping from API trend name → CSS class and background image.
 * Used as fallback when the API does not return image_url for a recommendation.
 *
 * CTA links and labels are also mocked.
 * TODO: When the API provides CTA data (href + label) per recommendation,
 *       replace the hardcoded MOCK_CTA values with the API-provided ones.
 */
const TREND_MAP = {
  'Borderless Cuisine': {
    class: 'borderless-cuisine',
    image: '/icons/borderless-cuisine.jpg',
  },
  'Street Food Couture': {
    class: 'street-food-couture',
    image: '/icons/street-food-couture.jpg',
  },
  'Diner Designed': {
    class: 'diner-designed',
    image: '/icons/diner-designed.jpg',
  },
  'Culinary Roots': {
    class: 'culinary-roots',
    image: '/icons/culinary-roots.jpg',
  },
  'Cross-Trend': {
    class: 'cross-trend',
    image: '/icons/cross-trend.jpg',
  },
};

/**
 * Hardcoded CTA used while the API does not yet return CTA data.
 * TODO: Remove MOCK_CTA and read href/text from the API response instead.
 */
const MOCK_CTA = {
  href: 'https://www.unilever.com',
  text: 'Show me the trend',
};

/**
 * Strip basic markdown bold markers (**text**) so descriptions render cleanly
 * as plain text inside card elements.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

/**
 * Derive the stat and description from a raw title string using these rules:
 *
 * - First word starts with a digit          → V3 (number stat, big glowing number)
 * - First word is 1–10 characters           → V1 (word stat, neon glow word)
 * - First word is more than 10 characters   → V2 (no stat, full title as description)
 *
 * @param {string} rawTitle
 * @returns {{ stat: string|null, description: string|null }}
 */
function parseTitleIntoStatAndDescription(rawTitle) {
  const title = stripMarkdown(rawTitle);
  const firstSpaceIndex = title.indexOf(' ');

  // Single-word title — treat the whole thing as the stat
  if (firstSpaceIndex === -1) {
    return { stat: title, description: null };
  }

  const firstWord = title.slice(0, firstSpaceIndex);
  const rest = title.slice(firstSpaceIndex + 1);

  // V3: number stat
  if (/^\d/.test(firstWord)) {
    return { stat: firstWord, description: rest };
  }

  // V1: short word stat (≤10 chars) with neon glow
  if (firstWord.length <= 10) {
    return { stat: firstWord, description: rest };
  }

  // V2: long first word — no stat, full title is the description
  return { stat: null, description: title };
}

/**
 * Map a single API recommendation object to the card data shape expected by
 * renderCards(). Returns null if the item cannot be rendered (missing trend).
 *
 * @param {Object} item - Raw recommendation from the API.
 * @returns {Object|null}
 */
function mapApiItemToCard(item) {
  const firstTrend = item.trends?.[0];
  if (!firstTrend) return null;

  const trendInfo = TREND_MAP[firstTrend];
  const { stat, description } = item.title
    ? parseTitleIntoStatAndDescription(item.title)
    : { stat: null, description: null };

  return {
    trendName: firstTrend,
    trendClass: trendInfo?.class ?? firstTrend.toLowerCase().replace(/\s+/g, '-'),
    bgImage: item.image_url ?? trendInfo?.image ?? null,
    description,
    stat,
    // TODO: Replace href and text with API-provided CTA data when available.
    link: MOCK_CTA,
    recommendationId: item.id ?? item.recommendation_id ?? null,
  };
}

/**
 * Sets the chef-ai-thread-id cookie so the chatbot modal opens with this thread.
 */
async function ensureBizApiThread(recommendationId) {
  const storageKey = `chefai-biz-api-thread-${recommendationId}`;

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
  sessionStorage.setItem(`chefai-biz-api-headline-${threadId}`, displayText);

  return {
    threadId,
    displayText: displayText ?? '',
    isNew: true,
  };
}

/**
 * Render card elements into the carousel container.
 * Mirrors the carousel-biz renderCards implementation.
 *
 * @param {HTMLUListElement} container
 * @param {Array} cards
 */
function renderCards(container, cards, onTrendCtaClick) {
  container.innerHTML = '';

  cards.forEach((cardData) => {
    const {
      trendClass,
      trendName,
      bgImage,
      description,
      link,
    } = cardData;

    const card = createElement('li', {
      className: `trend-card${trendClass ? ` ${trendClass}` : ''}`,
      attributes: {
        'data-trend': trendClass || trendName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    if (bgImage) {
      card.style.backgroundImage = `url('${bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    const header = createElement('div', {
      className: 'trend-header',
      innerContent: trendName.toUpperCase(),
    });
    card.appendChild(header);

    const content = createElement('div', { className: 'trend-content' });

    if (cardData.stat) {
      const isNumberStat = /^\d/.test(cardData.stat);
      const statClass = isNumberStat ? 'stat-number' : 'stat-word';
      const stat = createElement('div', {
        className: `trend-stat ${statClass}`,
        innerContent: `<span>${cardData.stat}</span>`,
      });
      content.appendChild(stat);
    }

    if (description) {
      const desc = createElement('p', {
        className: 'trend-description',
        innerContent: description,
      });
      content.appendChild(desc);
    }

    if (link) {
      const cta = createElement('a', {
        className: 'trend-cta',
        attributes: { href: link.href },
        innerContent: `<span class="cta-text">${link.text}</span><span class="icon icon-arrow_right cta-arrow"></span>`,
      });
      cta.addEventListener('click', (event) => {
        if (cardData.recommendationId && typeof onTrendCtaClick === 'function') {
          event.preventDefault();
          onTrendCtaClick(cardData);
        }
      });
      decorateIcons(cta);
      content.appendChild(cta);
    } else {
      const ctaSpacer = createElement('div', {
        className: 'trend-cta trend-cta-spacer',
        attributes: { 'aria-hidden': 'true' },
      });
      content.appendChild(ctaSpacer);
    }

    card.appendChild(content);
    container.appendChild(card);
  });
}

/**
 * Initialise (or re-initialise) the carousel helper.
 *
 * @param {HTMLElement} block
 * @param {HTMLUListElement} container
 * @param {number} itemCount
 */
function initializeCarousel(block, container, itemCount) {
  if (block.carouselInstance?.destroy) block.carouselInstance.destroy();

  try {
    const enableDesktopCarousel = itemCount > 3;
    block.classList.toggle('carousel-biz-api-desktop-carousel', enableDesktopCarousel);

    const carousel = createCarousel({
      container,
      block,
      itemCount,
      mobileItemsPerSlide: 1,
      desktopItemsPerSlide: 4,
      mobileBreakpoint: 900,
      mobileGap: 20,
      desktopGap: 20,
      enableDesktopCarousel,
    });

    // Remove any stale screen-reader announcement injected by a previous carousel
    const srAnnouncement = block.querySelector('[aria-live]');
    if (srAnnouncement) srAnnouncement.remove();

    block.carouselInstance = carousel;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[carousel-biz-api] Failed to initialise carousel:', error);
  }
}

/**
 * Show a skeleton loading state while data is being fetched.
 *
 * @param {HTMLUListElement} container
 */
function showLoadingSkeleton(container) {
  container.innerHTML = '';
  container.classList.add('is-loading');

  for (let i = 0; i < LOADING_CARD_COUNT; i += 1) {
    const loadingCard = createElement('li', { className: 'trend-card' });
    const loadingText = createElement('div', {
      className: 'loading-text',
      innerContent: 'Customising insights',
    });
    loadingCard.appendChild(loadingText);
    container.appendChild(loadingCard);
  }
}

export default async function decorate(block) {
  block.innerHTML = '';

  const carouselWrapper = createElement('div', {
    className: 'carousel-biz-api-carousel-wrapper',
  });
  const carouselContainer = createElement('ul', {
    className: 'carousel-biz-api-container',
  });
  carouselWrapper.appendChild(carouselContainer);
  block.appendChild(carouselWrapper);

  showLoadingSkeleton(carouselContainer);

  const recommendations = await fetchRecommendations();

  const cards = recommendations
    .map(mapApiItemToCard)
    .filter((card) => card !== null);

  if (cards.length < MIN_ITEMS) {
    block.remove();
    return;
  }

  const handleTrendCtaClick = async (cardData) => {
    const recommendationId = cardData.recommendationId ?? '';
    if (!recommendationId) {
      return;
    }

    let result = { isNew: false, displayText: '' };
    try {
      result = await ensureBizApiThread(recommendationId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[carousel-biz-api] Failed to prepare trend thread:', error);
    }

    openChatbotModal('trends')
      .then(() => {
        if (result.isNew && result.displayText) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chefai:trends', {
              detail: { displayText: result.displayText },
            }));
          }, 400);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[carousel-biz-api] Failed to open chatbot from trend CTA:', error);
      });
  };

  carouselContainer.classList.remove('is-loading');
  renderCards(carouselContainer, cards, handleTrendCtaClick);
  initializeCarousel(block, carouselContainer, cards.length);
}
