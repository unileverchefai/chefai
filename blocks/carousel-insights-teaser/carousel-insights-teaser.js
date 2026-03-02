import { createElement, validateTheme } from '@scripts/common.js';
import { getMetadata } from '@scripts/aem.js';
import createCarousel from '@helpers/carousel/carousel.js';
import createModal from '@helpers/modal/index.js';
import openCookieAgreementModal from '@helpers/cookie-agreement/index.js';
import openPersonalizedHub from '@helpers/personalized-hub/personalized-hub.js';
import createDropdown from '@helpers/dropdown/dropdown.js';

/**
 * Parses card data from an authored row
 * @param {Element} row The row element
 * @param {boolean} isLive Whether this is the live phase
 * @returns {Object|null} Parsed card data or null if invalid
 */
function parseCardData(row, isLive) {
  const cells = [...row.children];
  if (cells.length < 1) return null;

  const contentCell = cells[0];
  const header = contentCell.querySelector('h2');
  const stat = contentCell.querySelector('h3');
  const description = contentCell.querySelector('p');
  const cta = contentCell.querySelector('a');

  if (!header || !description) return null;

  const MAX_DESCRIPTION_LENGTH = 120;
  const descText = description.textContent.trim();
  const truncatedDesc = descText.length > MAX_DESCRIPTION_LENGTH
    ? `${descText.slice(0, MAX_DESCRIPTION_LENGTH)}…`
    : descText;

  const cardData = {
    header: header.textContent.trim(),
    stat: stat ? stat.textContent.trim() : null,
    description: truncatedDesc,
    ctaLabel: null,
    ctaHref: null,
    businessTypes: [],
    expandedContent: null,
  };

  if (!isLive) {
    return cardData;
  }

  const businessTypesList = cells[1]?.querySelector('ul');
  if (businessTypesList) {
    const items = businessTypesList.querySelectorAll('li');
    cardData.businessTypes = [...items].map((item) => item.textContent.trim());
  }

  if (cta) {
    cardData.ctaLabel = cta.textContent.trim();
    cardData.ctaHref = cta.getAttribute('href');
  }

  if (cells[2]) {
    cardData.expandedContent = cells[2].innerHTML.trim();
  }

  return cardData;
}

/**
 * Parses dropdown configuration from the first row (LIVE only)
 * @param {Element} row The first row element
 * @returns {Object} Dropdown configuration
 */
function parseDropdownConfig(row) {
  const cells = [...row.children];
  const defaultLabel = cells[0]?.textContent.trim() || 'All business types';
  const optionsList = cells[1]?.querySelector('ul');
  const options = [];

  if (optionsList) {
    const items = optionsList.querySelectorAll('li');
    items.forEach((item) => {
      options.push(item.textContent.trim());
    });
  }

  return { defaultLabel, options };
}

/**
 * Creates a single insight card element
 * @param {Object} cardData The card data
 * @param {number} index The card index
 * @param {boolean} isLive Whether this is live phase
 * @returns {Element} The card element
 */
function createInsightCard(cardData, index, isLive) {
  const hasStat = !!cardData.stat;
  const cardClasses = ['insight-card'];
  if (hasStat) cardClasses.push('insight-card--has-stat');
  else cardClasses.push('insight-card--text-only');

  const card = createElement('li', {
    className: cardClasses,
    attributes: {
      'data-card-index': index,
      'data-business-types': cardData.businessTypes.join(','),
    },
  });

  const header = createElement('span', {
    className: 'insight-card-header',
    innerContent: cardData.header,
  });
  card.appendChild(header);

  const content = createElement('div', {
    className: 'insight-card-content',
  });

  if (hasStat) {
    const stat = createElement('span', {
      className: 'insight-card-stat',
      innerContent: cardData.stat,
    });
    content.appendChild(stat);
  }

  const description = createElement('p', {
    className: 'insight-card-description',
    innerContent: cardData.description,
  });
  content.appendChild(description);
  card.appendChild(content);

  if (isLive && cardData.ctaLabel) {
    const ctaButton = createElement('a', {
      className: 'insight-card-cta',
      attributes: {
        href: cardData.ctaHref || '#',
        role: 'button',
      },
      innerContent: cardData.ctaLabel,
    });
    card.appendChild(ctaButton);
  }

  return card;
}

/**
 * Filters cards based on selected business type
 * @param {Element} container The cards container
 * @param {string} selectedType The selected business type
 * @returns {number} Number of visible cards
 */
function filterCards(container, selectedType) {
  const cards = container.querySelectorAll('.insight-card');
  let visibleCount = 0;

  cards.forEach((card) => {
    const businessTypes = card.getAttribute('data-business-types').split(',');
    const isVisible = selectedType === 'All business types'
      || businessTypes.includes(selectedType);

    if (isVisible) {
      card.style.display = '';
      visibleCount += 1;
    } else {
      card.style.display = 'none';
    }
  });

  return visibleCount;
}

/**
 * Shows loading skeleton state on the cards container
 * (matches carousel-biz-api pattern: class-driven shimmer overlay)
 * @param {Element} container The cards container
 */
function showLoadingSkeleton(container) {
  container.classList.add('is-loading');
  container.querySelectorAll('.insight-card').forEach((card) => {
    let loadingText = card.querySelector('.loading-text');
    if (!loadingText) {
      loadingText = createElement('div', {
        className: 'loading-text',
        innerContent: 'Customising insights',
      });
      card.appendChild(loadingText);
    }
  });
}

/**
 * Removes loading skeleton state from the cards container
 * @param {Element} container The cards container
 */
function hideLoadingSkeleton(container) {
  container.classList.remove('is-loading');
  container.querySelectorAll('.loading-text').forEach((el) => el.remove());
}

/**
 * Opens the expanded modal with card details
 * @param {string} expandedContent The expanded HTML content
 * @param {string} trendClass The trend class for styling
 */
function openExpandedModal(expandedContent, trendClass) {
  const modalContent = createElement('div', {
    className: `insights-teaser-modal-content ${trendClass}`,
  });

  const description = createElement('div', {
    className: 'insights-teaser-modal-description',
    innerContent: expandedContent,
  });
  modalContent.appendChild(description);

  const ctaButton = createElement('button', {
    className: 'insights-teaser-modal-cta btn-primary',
    innerContent: 'Discover personalised insights',
  });
  modalContent.appendChild(ctaButton);

  const modal = createModal({
    content: modalContent,
    showCloseButton: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
    overlayClass: 'modal-overlay insights-teaser-modal-overlay',
  });

  ctaButton.addEventListener('click', async () => {
    modal.close();

    const hasConsent = document.cookie.includes('personalized-hub-consent=true');

    if (!hasConsent) {
      openCookieAgreementModal(
        async () => {
          // After consent, open personalized hub
          await openPersonalizedHub();
        },
        null,
        true, // required
      );
    } else {
      await openPersonalizedHub();
    }
  });

  modal.open();
}

/**
 * Main decoration function for the carousel-insights-teaser block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const isLive = block.classList.contains('live');
  const isTease = block.classList.contains('tease');

  if (!isLive && !isTease) {
    // eslint-disable-next-line no-console
    console.error('carousel-insights-teaser: Block must have either "live" or "tease" variant');
    block.remove();
    return;
  }

  const theme = getMetadata('theme');
  const trendClass = validateTheme(theme);
  if (!trendClass) {
    // eslint-disable-next-line no-console
    console.error('carousel-insights-teaser: Invalid or missing theme metadata');
    block.remove();
    return;
  }

  block.classList.add(trendClass);

  const rows = [...block.children];
  let dropdownConfig = null;
  let cardRows = rows;

  if (isLive && rows.length > 0) {
    dropdownConfig = parseDropdownConfig(rows[0]);
    cardRows = rows.slice(1);

    if (!dropdownConfig.options.includes('All business types')) {
      // eslint-disable-next-line no-console
      console.error('carousel-insights-teaser: "All business types" option is required in LIVE phase');
      block.remove();
      return;
    }
  }

  const cardsData = [];
  const expandedContentMap = new Map();

  cardRows.forEach((row, index) => {
    const cardData = parseCardData(row, isLive);
    if (cardData) {
      cardsData.push(cardData);
      if (isLive && cardData.expandedContent) {
        expandedContentMap.set(index, cardData.expandedContent);
      }
    }
  });

  if (cardsData.length === 0) {
    // eslint-disable-next-line no-console
    console.error('carousel-insights-teaser: No valid cards found');
    block.remove();
    return;
  }

  block.innerHTML = '';

  const container = createElement('ul', {
    className: 'insights-teaser-cards',
  });

  cardsData.forEach((cardData, index) => {
    const card = createInsightCard(cardData, index, isLive);
    container.appendChild(card);

    if (isLive && cardData.ctaLabel) {
      const ctaButton = card.querySelector('.insight-card-cta');
      ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        const expandedContent = expandedContentMap.get(index);
        if (expandedContent) {
          openExpandedModal(expandedContent, trendClass);
        }
      });
    }
  });

  if (isLive && dropdownConfig.options.length > 1) {
    const { element: filter } = createDropdown({
      options: dropdownConfig.options.map((opt) => ({ label: opt, value: opt })),
      onSelect: async (selectedType) => {
        container.classList.add('fade-out');
        await new Promise((resolve) => { setTimeout(resolve, 300); });
        container.classList.remove('fade-out');

        showLoadingSkeleton(container);

        await new Promise((resolve) => { setTimeout(resolve, 800); });

        hideLoadingSkeleton(container);
        const visibleCount = filterCards(container, selectedType);

        container.classList.add('fade-in');
        await new Promise((resolve) => { setTimeout(resolve, 400); });
        container.classList.remove('fade-in');

        if (block.carouselInstance) {
          block.carouselInstance.destroy();
        }

        if (visibleCount > 0) {
          block.carouselInstance = createCarousel({
            container,
            block,
            itemCount: visibleCount,
            mobileItemsPerSlide: 1,
            desktopItemsPerSlide: 4,
            disableDesktopCarousel: true,
            mobileBreakpoint: 900,
          });
        }
      },
      classes: {
        filter: 'insights-teaser-filter',
        button: 'insights-teaser-dropdown',
        text: 'insights-teaser-dropdown-text',
        arrow: 'insights-teaser-dropdown-arrow',
        menu: 'insights-teaser-dropdown-menu',
        option: 'insights-teaser-dropdown-option',
      },
    });
    block.appendChild(filter);
  }

  block.appendChild(container);

  block.carouselInstance = createCarousel({
    container,
    block,
    itemCount: cardsData.length,
    mobileItemsPerSlide: 1,
    desktopItemsPerSlide: 4,
    disableDesktopCarousel: true,
    mobileBreakpoint: 900,
  });
}
