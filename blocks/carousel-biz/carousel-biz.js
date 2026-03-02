import createCarousel from '@helpers/carousel/carousel.js';
import { decorateIcons } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import createDropdown from '@helpers/dropdown/dropdown.js';

/**
 * Trend code to CSS class and display name mapping
 * Authors use simple codes (T1, T2, etc.) in Document Authoring
 */
const TREND_CODE_MAP = {
  T1: { class: 'borderless-cuisine', name: 'Borderless Cuisine' },
  T2: { class: 'street-food-couture', name: 'Street Food Couture' },
  T3: { class: 'diner-designed', name: 'Diner Designed' },
  T4: { class: 'culinary-roots', name: 'Culinary Roots' },
  TX: { class: 'cross-trend', name: 'Cross-Trend' },
};

/**
 * Normalize trend code input from authors
 * Handles case insensitivity and whitespace
 * @param {string} input - Raw input from author (e.g., "t1", "T 1", " T1 ")
 * @returns {string} Normalized code (e.g., "T1")
 */
function normalizeTrendCode(input) {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

/**
 * Parse dropdown options from first row
 * @param {HTMLElement} firstRow - First row containing dropdown data
 * @returns {Object} Dropdown label and options array
 */
function parseDropdownData(firstRow) {
  const cells = firstRow.children;
  if (cells.length < 2) return null;

  const label = cells[0].textContent.trim();
  const optionsList = cells[1].querySelector('ul');

  if (!optionsList) return null;

  const options = [...optionsList.querySelectorAll('li')].map((li) => li.textContent.trim());

  return { label, options };
}

/**
 * Parse authored block content into card data with restaurant types
 * @param {HTMLElement} block - The block element with authored content
 * @returns {Array} Array of card data objects
 */
function parseAuthoredContent(block) {
  const rows = [...block.children];
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
      // look for paragraph with text content, excluding the first one (bg image)
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

    // extract assigned restaurant types from second column
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
    console.error('Failed to initialize carousel-biz:', error);
  }
}

export default function decorate(block) {
  const MIN_ITEMS = 3;

  const firstRow = block.children[0];
  const dropdownData = parseDropdownData(firstRow);

  const cards = parseAuthoredContent(block);

  if (cards.length < MIN_ITEMS) {
    block.remove();
    return;
  }

  const allCards = cards;
  block.innerHTML = '';

  // Carousel container must be created before filterCards (closure needs carouselContainer)
  const carouselWrapper = createElement('div', {
    className: 'carousel-biz-carousel-wrapper',
  });

  const carouselContainer = createElement('ul', {
    className: 'carousel-biz-container',
  });

  carouselWrapper.appendChild(carouselContainer);

  const filterCards = async (restaurantType) => {
    const filteredCards = restaurantType === 'all'
      ? allCards
      : allCards.filter((card) => card.restaurantTypes.includes(restaurantType));

    carouselContainer.classList.add('fade-out');
    await new Promise((resolve) => { setTimeout(resolve, 300); });
    carouselContainer.classList.remove('fade-out');

    carouselContainer.classList.add('is-loading');
    carouselContainer.querySelectorAll('.trend-card').forEach((card) => {
      if (!card.querySelector('.loading-text')) {
        card.appendChild(createElement('div', {
          className: 'loading-text',
          innerContent: 'Customising insights',
        }));
      }
    });

    await new Promise((resolve) => { setTimeout(resolve, 500); });

    carouselContainer.classList.remove('is-loading');
    carouselContainer.querySelectorAll('.loading-text').forEach((el) => el.remove());

    if (filteredCards.length === 0) {
      if (block.carouselInstance?.destroy) block.carouselInstance.destroy();
      carouselContainer.innerHTML = '<li class="empty-state">No insights available for this selection.</li>';
      const controls = block.querySelector('.controls');
      if (controls) controls.style.display = 'none';
      return;
    }

    const controls = block.querySelector('.controls');
    if (controls) controls.style.display = '';

    renderCards(carouselContainer, filteredCards);
    initializeCarousel(block, carouselContainer, filteredCards.length);

    carouselContainer.classList.add('fade-in');
    await new Promise((resolve) => { setTimeout(resolve, 400); });
    carouselContainer.classList.remove('fade-in');
  };

  const dropdownOptions = [
    { label: dropdownData?.label ?? 'All business types', value: 'all' },
    ...(dropdownData?.options ?? []).map((opt) => ({ label: opt, value: opt })),
  ];

  const { element: filterContainer } = createDropdown({
    options: dropdownOptions,
    onSelect: filterCards,
    classes: {
      filter: 'carousel-biz-filter',
      button: 'biz-dropdown',
      text: 'biz-dropdown-text',
      arrow: 'biz-dropdown-arrow',
      menu: 'biz-dropdown-menu',
      option: 'biz-dropdown-option',
    },
  });

  block.appendChild(filterContainer);
  block.appendChild(carouselWrapper);

  renderCards(carouselContainer, allCards);
  initializeCarousel(block, carouselContainer, allCards.length);
}
