import createCarousel from '@helpers/carousel/carousel.js';
import { decorateIcons, getMetadata } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import {
  TREND_CODE_MAP,
  normalizeTrendCode,
  getTrendClassFromTheme,
} from '@scripts/trends.js';

/**
 * Temporary URL implementation!!!
 * Landing Page URLs for fetching carousel-biz data
 * Can be absolute AEM URLs or relative paths.
 * Absolute URLs are converted to same-origin paths at fetch time to avoid CORS.
 */
const TEASE_LANDING_PAGE_URL = 'https://develop--chefai--unileverchefai.aem.page/';
const LIVE_LANDING_PAGE_URL = 'https://develop--chefai--unileverchefai.aem.page/';

/**
 * Resolve configured landing URL to a same-origin fetch URL.
 * This avoids browser CORS errors when local/dev runs on a different origin.
 * @param {string} configuredUrl - Configured URL (absolute or relative)
 * @returns {string} Same-origin fetch URL
 */
function getFetchableLandingUrl(configuredUrl) {
  try {
    const parsed = new URL(configuredUrl, window.location.origin);

    if (parsed.origin !== window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return configuredUrl;
  }
}

/**
 * Parse authored block content into card data with restaurant types
 * Adapted from carousel-biz to work with fetched HTML
 * @param {HTMLElement} block - The block element with authored content
 * @returns {Array} Array of card data objects
 */
function parseAuthoredContent(block) {
  const rows = [...block.children];
  // First row in carousel-biz contains dropdown data; skip it
  const cardRows = rows.slice(1);

  const cards = cardRows.map((row) => {
    const cells = row.children;
    if (cells.length < 2) return null;

    const contentCell = cells[0];
    const metaCell = cells[1];

    const h3 = contentCell.querySelector('h3');
    if (!h3) return null;

    const trendName = h3.textContent.trim();
    const paragraphs = contentCell.querySelectorAll('p');

    let bgImage = null;
    let description = '';
    let link = null;

    if (paragraphs.length > 0) {
      const firstPicture = paragraphs[0].querySelector('picture img');
      if (firstPicture) {
        bgImage = firstPicture.getAttribute('src');
      }
    }

    const h2 = contentCell.querySelector('h2');
    const stat = h2 ? h2.textContent.trim() : '';

    const linkParagraph = [...paragraphs].find((p) => p.querySelector('a'));
    if (linkParagraph) {
      const linkEl = linkParagraph.querySelector('a');
      if (linkEl) {
        link = {
          href: linkEl.getAttribute('href'),
          text: linkEl.textContent.trim(),
        };
      }
    }

    let descParagraph = [...paragraphs].find((p) => !p.querySelector('picture') && !p.querySelector('a'));

    if (!descParagraph) {
      descParagraph = [...paragraphs].slice(1).find((p) => {
        const textContent = p.textContent.trim();
        return textContent && !p.querySelector('a');
      });
    }

    if (descParagraph) {
      const clone = descParagraph.cloneNode(true);
      const br = clone.querySelector('br');
      const pic = clone.querySelector('picture');

      if (br) {
        const textNode = [...clone.childNodes].find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
        );
        description = textNode ? textNode.textContent.trim() : '';
      } else if (pic) {
        pic.remove();
        description = clone.textContent.trim();
      } else {
        description = clone.textContent.trim();
      }
    }

    const typesList = metaCell.querySelector('ul');
    const restaurantTypes = typesList
      ? [...typesList.querySelectorAll('li')].map((li) => li.textContent.trim())
      : [];

    if (!description) return null;

    const normalizedCode = normalizeTrendCode(trendName);
    const trendMapping = TREND_CODE_MAP[normalizedCode];
    const trendClass = trendMapping?.class || '';
    const trendDisplayName = trendMapping?.name || trendName;

    return {
      trendName: trendDisplayName,
      trendClass,
      stat,
      description,
      link,
      bgImage,
      restaurantTypes,
    };
  }).filter((cardData) => cardData !== null);

  return cards;
}

/**
 * Render carousel cards from card data
 * @param {HTMLElement} container - The carousel container element
 * @param {Array} cards - Array of card data objects
 */
function renderCards(container, cards) {
  container.innerHTML = '';

  cards.forEach((cardData) => {
    const {
      trendClass = false,
      trendName,
      restaurantTypes = false,
      bgImage = false,
      description = false,
      link = false,
    } = cardData;

    const card = createElement('li', {
      className: `trend-card${trendClass ? ` ${trendClass}` : ''}`,
      attributes: {
        'data-trend': trendClass || trendName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    if (restaurantTypes && restaurantTypes.length > 0) {
      card.setAttribute('data-restaurant-types', restaurantTypes.join('||'));
    }

    if (bgImage) {
      card.style.backgroundImage = `url('${bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    const isNumberStat = /^\d/.test(cardData.stat);
    const statClass = isNumberStat ? 'stat-number' : 'stat-word';

    const header = createElement('div', {
      className: 'trend-header',
      innerContent: trendName.toUpperCase(),
    });
    card.appendChild(header);

    const content = createElement('div', {
      className: 'trend-content',
    });

    if (cardData.stat) {
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
        innerContent: `
          <span class="cta-text">${link.text}</span>
          <span class="icon icon-arrow_right cta-arrow"></span>
        `,
      });
      decorateIcons(cta);
      content.appendChild(cta);
    } else {
      const cta = createElement('div', {
        className: 'trend-cta trend-cta-spacer',
        attributes: { 'aria-hidden': 'true' },
      });
      content.appendChild(cta);
    }

    card.appendChild(content);
    container.appendChild(card);
  });
}

/**
 * Initialize carousel with given cards
 * @param {HTMLElement} block - The block element
 * @param {HTMLElement} container - The carousel container
 * @param {number} itemCount - Number of items
 */
function initializeCarousel(block, container, itemCount) {
  if (block.carouselInstance?.destroy) {
    block.carouselInstance.destroy();
  }

  try {
    const enableDesktopCarousel = itemCount > 3;
    block.classList.toggle('carousel-biz-desktop-carousel', enableDesktopCarousel);

    const carousel = createCarousel({
      container,
      block,
      itemCount,
      mobileItemsPerSlide: 1,
      desktopItemsPerSlide: 3,
      mobileBreakpoint: 900,
      mobileGap: 20,
      desktopGap: 20,
      enableDesktopCarousel,
    });

    const srAnnouncement = block.querySelector('[aria-live]');
    if (srAnnouncement) {
      srAnnouncement.remove();
    }

    block.carouselInstance = carousel;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize carousel-trends-remaining:', error);
  }
}

/**
 * Fetch and parse Landing Page HTML to extract carousel-biz data
 * @param {string} url - Landing Page URL
 * @returns {Promise<Array>} Array of card data objects
 */
async function fetchLandingPageCards(url) {
  try {
    const fetchableUrl = getFetchableLandingUrl(url);
    const response = await fetch(fetchableUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Landing Page: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const bizBlock = doc.querySelector('.carousel-biz');
    if (!bizBlock) {
      throw new Error('carousel-biz block not found in Landing Page HTML');
    }

    return parseAuthoredContent(bizBlock);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[carousel-trends-remaining] Error fetching Landing Page:', error);
    return [];
  }
}

/**
 * Decorate the carousel-trends-remaining block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  block.classList.add('carousel-biz');

  const isTease = block.classList.contains('tease');
  const isLive = block.classList.contains('live');

  if (!isTease && !isLive) {
    // eslint-disable-next-line no-console
    console.error('[carousel-trends-remaining] Block must have variant class "tease" or "live"');
    block.remove();
    return;
  }

  // Choose Landing Page URL based on variant (for now they are the same! future TODO: update))
  const landingPageUrl = isTease ? TEASE_LANDING_PAGE_URL : LIVE_LANDING_PAGE_URL;

  // Fetch card data from Landing Page
  let cards = await fetchLandingPageCards(landingPageUrl);

  if (cards.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[carousel-trends-remaining] No cards found in Landing Page');
    block.remove();
    return;
  }

  // here the current trend is removed
  const currentTheme = getMetadata('theme');
  if (currentTheme) {
    const currentTrendClass = getTrendClassFromTheme(currentTheme);

    if (currentTrendClass) {
      cards = cards.filter((card) => card.trendClass !== currentTrendClass);
    }
  }

  // business type filter for live variant
  if (isLive) {
    const urlParams = new URLSearchParams(window.location.search);
    const bizType = urlParams.get('biz-type');

    if (bizType) {
      cards = cards.filter((card) => card.restaurantTypes.includes(bizType));
    }
  }

  if (cards.length === 0) {
    block.remove();
    return;
  }

  block.innerHTML = '';

  const carouselWrapper = createElement('div', {
    className: 'carousel-biz-carousel-wrapper',
  });

  const carouselContainer = createElement('ul', {
    className: 'carousel-biz-container',
  });

  carouselWrapper.appendChild(carouselContainer);
  block.appendChild(carouselWrapper);

  renderCards(carouselContainer, cards);
  initializeCarousel(block, carouselContainer, cards.length);
}
