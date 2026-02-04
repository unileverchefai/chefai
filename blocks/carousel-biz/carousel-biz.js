import createCarousel from '@components/carousel/carousel.js';
import { decorateIcons } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';

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

    // trend name
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
      // extract text before br or picture
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

    let trendClass = '';
    const trendLower = trendName.toLowerCase();
    const trendClasses = {
      borderless: 'borderless-cuisine',
      street: 'street-food-couture',
      dinner: 'diner-designed',
      designed: 'diner-designed',
      culinary: 'culinary-roots',
      roots: 'culinary-roots',
      cross: 'cross-trend',
    };
    const trendFound = Object.keys(trendClasses).find((key) => trendLower.includes(key));
    trendClass = trendClasses[trendFound] || '';

    return {
      trendName,
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
      innerContent: cardData.trendName.toUpperCase(),
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

    // TODO: CTA is always rendered to maintain space (next phase of the project!)
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
   // TODO: CTA is always rendered to maintain space (next phase of the project!)
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
    const carousel = createCarousel({
      container,
      block,
      itemCount,
      mobileItemsPerSlide: 1,
      desktopItemsPerSlide: 4,
      mobileBreakpoint: 900,
      mobileGap: 20,
      desktopGap: 20,
      disableDesktopCarousel: true,
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

  // filter dropdown
  const filterContainer = createElement('div', {
    className: 'carousel-biz-filter',
  });

  // dropdown button
  const dropdownButton = createElement('button', {
    className: 'biz-dropdown',
    attributes: {
      'aria-label': `Filter by ${dropdownData?.label || 'business type'}`,
      'aria-expanded': 'false',
      'aria-haspopup': 'listbox',
    },
    innerContent: `
      <span class="biz-dropdown-text">${dropdownData?.label}</span>
      <svg class="biz-dropdown-arrow" width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L6 5L11 1" stroke="#131313" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
  });
  const dropdownText = dropdownButton.querySelector('.biz-dropdown-text');

  // dropdown menu
  const dropdownMenu = createElement('div', {
    className: 'biz-dropdown-menu',
    attributes: {
      role: 'listbox',
      'aria-hidden': 'true',
    },
    innerContent: `
      <div class="biz-dropdown-option active" role="option" aria-selected="true" data-value="all">
        ${dropdownData?.label}
      </div>
    `,
  });

  if (dropdownData?.options) {
    dropdownData.options.forEach((optionText) => {
      const option = createElement('div', {
        className: 'biz-dropdown-option',
        attributes: {
          role: 'option',
          'aria-selected': 'false',
          'data-value': optionText,
        },
        innerContent: optionText,
      });
      dropdownMenu.appendChild(option);
    });
  }

  filterContainer.appendChild(dropdownButton);
  filterContainer.appendChild(dropdownMenu);
  block.appendChild(filterContainer);

  const carouselWrapper = createElement('div', {
    className: 'carousel-biz-carousel-wrapper',
  });

  const carouselContainer = createElement('ul', {
    className: 'carousel-biz-container',
  });

  carouselWrapper.appendChild(carouselContainer);
  block.appendChild(carouselWrapper);

  renderCards(carouselContainer, allCards);

  setTimeout(() => {
    initializeCarousel(block, carouselContainer, allCards.length);
  }, 0);

  let isOpen = false;

  const toggleDropdown = () => {
    isOpen = !isOpen;
    dropdownButton.setAttribute('aria-expanded', isOpen.toString());
    dropdownMenu.setAttribute('aria-hidden', (!isOpen).toString());
    filterContainer.classList.toggle('open', isOpen);
  };

  const closeDropdown = () => {
    isOpen = false;
    dropdownButton.setAttribute('aria-expanded', 'false');
    dropdownMenu.setAttribute('aria-hidden', 'true');
    filterContainer.classList.remove('open');
  };

  const filterCards = (restaurantType) => {
    const filteredCards = restaurantType === 'all'
      ? allCards
      : allCards.filter((card) => card.restaurantTypes.includes(restaurantType));

    if (filteredCards.length === 0) {
      if (block.carouselInstance?.destroy) {
        block.carouselInstance.destroy();
      }

      carouselContainer.innerHTML = '<li class="empty-state">No insights available for this selection.</li>';

      // hide carousel controls
      const controls = block.querySelector('.controls');
      if (controls) {
        controls.style.display = 'none';
      }
      return;
    }

    // show carousel controls
    const controls = block.querySelector('.controls');
    if (controls) {
      controls.style.display = '';
    }

    renderCards(carouselContainer, filteredCards);
    initializeCarousel(block, carouselContainer, filteredCards.length);
  };

  const selectOption = (option) => {
    dropdownMenu.querySelectorAll('.biz-dropdown-option').forEach((opt) => {
      opt.classList.remove('active');
      opt.setAttribute('aria-selected', 'false');
    });
    option.classList.add('active');
    option.setAttribute('aria-selected', 'true');

    dropdownText.textContent = option.textContent;

    closeDropdown();

    const selectedType = option.dataset.value;
    filterCards(selectedType);
  };

  dropdownButton.addEventListener('click', toggleDropdown);

  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target) && isOpen) {
      closeDropdown();
    }
  });

  dropdownMenu.addEventListener('click', (e) => {
    const option = e.target.closest('.biz-dropdown-option');
    if (option) {
      selectOption(option);
    }
  });

  dropdownButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape' && isOpen) {
      closeDropdown();
    }
  });
}
