import { createElement } from '@scripts/common.js';
import { getMetadata } from '@scripts/aem.js';
import createCarousel from '@helpers/carousel/carousel.js';
import createModal from '@helpers/modal/index.js';
import openCookieAgreementModal from '@helpers/cookie-agreement/index.js';
import openPersonalizedHub from '@helpers/personalized-hub/personalized-hub.js';

/**
 * Validates the theme and returns the trend class name
 * @param {string} theme The theme from metadata (t1, t2, t3, t4)
 * @returns {string|null} The valid trend class or null
 */
function validateTheme(theme) {
  const themeMap = {
    t1: 'borderless-cuisine',
    t2: 'street-food-couture',
    t3: 'diner-designed',
    t4: 'culinary-roots',
    // Also support full names for backwards compatibility
    'borderless-cuisine': 'borderless-cuisine',
    'street-food-couture': 'street-food-couture',
    'diner-designed': 'diner-designed',
    'culinary-roots': 'culinary-roots',
  };

  return themeMap[theme] || null;
}

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

  const cardData = {
    header: header.textContent.trim(),
    stat: stat ? stat.textContent.trim() : null,
    description: description.textContent.trim(),
    ctaLabel: null,
    ctaHref: null,
    businessTypes: [],
    expandedContent: null,
  };

  if (isLive) {
    // Parse business types from column 2
    if (cells[1]) {
      const businessTypesList = cells[1].querySelector('ul');
      if (businessTypesList) {
        const items = businessTypesList.querySelectorAll('li');
        cardData.businessTypes = [...items].map((item) => item.textContent.trim());
      }
    }

    // Get CTA info
    if (cta) {
      cardData.ctaLabel = cta.textContent.trim();
      cardData.ctaHref = cta.getAttribute('href');
    }

    // Store expanded content HTML from column 3
    if (cells[2]) {
      cardData.expandedContent = cells[2].innerHTML.trim();
    }
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
 * Creates the dropdown filter element
 * @param {Object} config Dropdown configuration
 * @returns {Element} The dropdown filter element
 */
function createDropdownFilter(config) {
  const filter = createElement('div', {
    className: 'insights-teaser-filter',
  });

  const button = createElement('button', {
    className: 'insights-teaser-dropdown',
    attributes: {
      'aria-label': `Filter by ${config.defaultLabel}`,
      'aria-expanded': 'false',
      'aria-haspopup': 'listbox',
    },
    innerContent: `
      <span class="insights-teaser-dropdown-text">${config.defaultLabel}</span>
      <svg class="insights-teaser-dropdown-arrow" width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L6 5L11 1" stroke="#131313" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
  });

  filter.appendChild(button);

  const menu = createElement('div', {
    className: 'insights-teaser-dropdown-menu',
    attributes: {
      role: 'listbox',
      'aria-hidden': 'true',
    },
  });

  config.options.forEach((option, index) => {
    const optionElement = createElement('div', {
      className: 'insights-teaser-dropdown-option',
      attributes: {
        role: 'option',
        'aria-selected': index === 0 ? 'true' : 'false',
        'data-value': option,
      },
      innerContent: option,
    });
    if (index === 0) optionElement.classList.add('active');
    menu.appendChild(optionElement);
  });

  filter.appendChild(menu);

  return filter;
}

/**
 * Sets up dropdown behavior
 * @param {Element} filter The filter element
 * @param {Function} onSelectionChange Callback when selection changes
 */
function setupDropdownBehavior(filter, onSelectionChange) {
  const button = filter.querySelector('.insights-teaser-dropdown');
  const menu = filter.querySelector('.insights-teaser-dropdown-menu');
  const options = menu.querySelectorAll('.insights-teaser-dropdown-option');
  let isOpen = false;

  const toggleDropdown = () => {
    isOpen = !isOpen;
    filter.classList.toggle('open', isOpen);
    button.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
  };

  const closeDropdown = () => {
    if (isOpen) {
      isOpen = false;
      filter.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  };

  const selectOption = (option) => {
    const value = option.getAttribute('data-value');
    const text = option.textContent;

    options.forEach((opt) => {
      opt.classList.remove('active');
      opt.setAttribute('aria-selected', 'false');
    });
    option.classList.add('active');
    option.setAttribute('aria-selected', 'true');

    button.querySelector('.insights-teaser-dropdown-text').textContent = text;

    closeDropdown();
    onSelectionChange(value);
  };

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  options.forEach((option) => {
    option.addEventListener('click', () => selectOption(option));
  });

  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!filter.contains(e.target)) {
      closeDropdown();
    }
  });
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
 * Creates shimmer loading cards
 * @param {number} count Number of shimmer cards
 * @returns {Element} Container with shimmer cards
 */
function createShimmerCards(count) {
  const shimmerContainer = createElement('ul', {
    className: 'insights-teaser-cards shimmer-loading',
  });

  for (let i = 0; i < count; i += 1) {
    const shimmerCard = createElement('li', {
      className: 'insight-card shimmer-card',
      innerContent: '<div class="shimmer-content"></div>',
    });
    shimmerContainer.appendChild(shimmerCard);
  }

  return shimmerContainer;
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

    // Validate "All business types" exists
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

  // Add dropdown filter for LIVE phase (if more than just "All business types")
  if (isLive && dropdownConfig.options.length > 1) {
    const filter = createDropdownFilter(dropdownConfig);
    block.appendChild(filter);

    setupDropdownBehavior(filter, async (selectedType) => {
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.3s ease';

      // Wait for fade out + artificial delay
      await new Promise((resolve) => { setTimeout(resolve, 400); });

      const shimmerCards = createShimmerCards(4);
      shimmerCards.style.opacity = '0';
      block.appendChild(shimmerCards);

      await new Promise((resolve) => {
        setTimeout(() => {
          shimmerCards.style.opacity = '1';
          shimmerCards.style.transition = 'opacity 0.3s ease';
          resolve();
        }, 50);
      });

      // Wait for artificial loading delay
      await new Promise((resolve) => { setTimeout(resolve, 400); });

      shimmerCards.remove();
      const visibleCount = filterCards(container, selectedType);

      container.style.opacity = '1';

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
    });
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
