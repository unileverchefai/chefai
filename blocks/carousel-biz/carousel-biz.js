import createCarousel from '../components/carousel/carousel.js';
import { decorateIcons } from '../../scripts/aem.js';

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
    if (trendLower.includes('borderless')) {
      trendClass = 'borderless-cuisine';
    } else if (trendLower.includes('street')) {
      trendClass = 'street-food-couture';
    } else if (trendLower.includes('dinner') || trendLower.includes('designed')) {
      trendClass = 'diner-designed';
    } else if (trendLower.includes('culinary') || trendLower.includes('roots')) {
      trendClass = 'culinary-roots';
    } else if (trendLower.includes('cross')) {
      trendClass = 'cross-trend';
    }

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
    const card = document.createElement('li');
    card.className = 'trend-card';
    card.setAttribute('data-trend', cardData.trendClass || cardData.trendName.toLowerCase().replace(/\s+/g, '-'));

    if (cardData.trendClass) {
      card.classList.add(cardData.trendClass);
    }

    if (cardData.restaurantTypes && cardData.restaurantTypes.length > 0) {
      card.setAttribute('data-restaurant-types', cardData.restaurantTypes.join('||'));
    }

    if (cardData.bgImage) {
      card.style.backgroundImage = `url('${cardData.bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    const isNumberStat = /^\d/.test(cardData.stat);
    const statClass = isNumberStat ? 'stat-number' : 'stat-word';

    const header = document.createElement('div');
    header.className = 'trend-header';
    header.textContent = cardData.trendName.toUpperCase();
    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'trend-content';

    if (cardData.stat) {
      const stat = document.createElement('div');
      stat.className = `trend-stat ${statClass}`;
      stat.textContent = cardData.stat;
      content.appendChild(stat);
    }

    if (cardData.description) {
      const desc = document.createElement('p');
      desc.className = 'trend-description';
      desc.textContent = cardData.description;
      content.appendChild(desc);
    }

    // CTA is always rendered to mantain space (next phase of the project!)
    if (cardData.link) {
      const cta = document.createElement('a');
      cta.className = 'trend-cta';
      cta.href = cardData.link.href;

      const ctaText = document.createElement('span');
      ctaText.className = 'cta-text';
      ctaText.textContent = cardData.link.text;
      cta.appendChild(ctaText);

      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon icon-arrow_right cta-arrow';
      cta.appendChild(iconSpan);
      decorateIcons(cta);

      content.appendChild(cta);
    } else {
    // CTA is always rendered to mantain space (next phase of the project!)
      const cta = document.createElement('div');
      cta.className = 'trend-cta trend-cta-spacer';
      cta.setAttribute('aria-hidden', 'true');
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
      disableDesktopCarousel: false,
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
  const filterContainer = document.createElement('div');
  filterContainer.className = 'carousel-biz-filter';

  // dropdown button
  const dropdownButton = document.createElement('button');
  dropdownButton.className = 'biz-dropdown';
  dropdownButton.setAttribute('aria-label', `Filter by ${dropdownData?.label || 'business type'}`);
  dropdownButton.setAttribute('aria-expanded', 'false');
  dropdownButton.setAttribute('aria-haspopup', 'listbox');

  const dropdownText = document.createElement('span');
  dropdownText.className = 'biz-dropdown-text';
  dropdownText.textContent = `${dropdownData?.label}`;

  const dropdownArrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  dropdownArrow.setAttribute('class', 'biz-dropdown-arrow');
  dropdownArrow.setAttribute('width', '12');
  dropdownArrow.setAttribute('height', '6');
  dropdownArrow.setAttribute('viewBox', '0 0 12 6');
  dropdownArrow.setAttribute('fill', 'none');

  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M1 1L6 5L11 1');
  arrowPath.setAttribute('stroke', '#131313');
  arrowPath.setAttribute('stroke-width', '1.5');
  arrowPath.setAttribute('stroke-linecap', 'round');
  arrowPath.setAttribute('stroke-linejoin', 'round');

  dropdownArrow.appendChild(arrowPath);
  dropdownButton.appendChild(dropdownText);
  dropdownButton.appendChild(dropdownArrow);

  // dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'biz-dropdown-menu';
  dropdownMenu.setAttribute('role', 'listbox');
  dropdownMenu.setAttribute('aria-hidden', 'true');

  // all dropdown options
  const allOption = document.createElement('div');
  allOption.className = 'biz-dropdown-option active';
  allOption.setAttribute('role', 'option');
  allOption.setAttribute('aria-selected', 'true');
  allOption.dataset.value = 'all';
  allOption.textContent = `${dropdownData?.label}`;
  dropdownMenu.appendChild(allOption);

  if (dropdownData?.options) {
    dropdownData.options.forEach((optionText) => {
      const option = document.createElement('div');
      option.className = 'biz-dropdown-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.dataset.value = optionText;
      option.textContent = optionText;
      dropdownMenu.appendChild(option);
    });
  }

  filterContainer.appendChild(dropdownButton);
  filterContainer.appendChild(dropdownMenu);
  block.appendChild(filterContainer);

  const carouselContainer = document.createElement('ul');
  carouselContainer.className = 'carousel-biz-container';
  block.appendChild(carouselContainer);

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
    let filteredCards;

    if (restaurantType === 'all') {
      filteredCards = allCards;
    } else {
      filteredCards = allCards.filter((card) => card.restaurantTypes.includes(restaurantType));
    }

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
