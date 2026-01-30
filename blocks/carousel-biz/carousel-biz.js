import createCarousel from '../components/carousel/carousel.js';
import { decorateIcons } from '../../scripts/aem.js';
import fetchInsights, { fetchBusinessTypes } from './fetchInsights.js';

/**
 * Render carousel cards from insights data
 * @param {HTMLElement} container - The carousel container element
 * @param {Array} cards - Array of insight card data
 */
function renderCards(container, cards) {
  container.innerHTML = '';

  cards.forEach((cardData) => {
    const card = document.createElement('li');
    card.className = 'trend-card';
    card.setAttribute('data-trend', cardData.trendClass);
    card.classList.add(cardData.trendClass);

    // Set background image
    if (cardData.bgImage) {
      card.style.backgroundImage = `url('${cardData.bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    // Determine if stat is a number or word
    const isNumberStat = /^\d/.test(cardData.stat);
    const statClass = isNumberStat ? 'stat-number' : 'stat-word';

    // Card header (trend name)
    const header = document.createElement('div');
    header.className = 'trend-header';
    header.textContent = cardData.trendName.toUpperCase();
    card.appendChild(header);

    // Card content wrapper
    const content = document.createElement('div');
    content.className = 'trend-content';

    // Stat/insight
    if (cardData.stat) {
      const stat = document.createElement('div');
      stat.className = `trend-stat ${statClass}`;
      stat.textContent = cardData.stat;
      content.appendChild(stat);
    }

    // Description
    if (cardData.description) {
      const desc = document.createElement('p');
      desc.className = 'trend-description';
      desc.textContent = cardData.description;
      content.appendChild(desc);
    }

    // CTA
    if (cardData.link) {
      const cta = document.createElement('a');
      cta.className = 'trend-cta';
      cta.href = cardData.link.href;

      // Add text
      const ctaText = document.createElement('span');
      ctaText.className = 'cta-text';
      ctaText.textContent = cardData.link.text;
      cta.appendChild(ctaText);

      // Add arrow icon from icons folder
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon icon-arrow_right cta-arrow';
      cta.appendChild(iconSpan);
      decorateIcons(cta);

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
  // Destroy existing carousel if any
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

    // Remove screen reader announcement
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

export default async function decorate(block) {
  const MIN_ITEMS = 3;

  // Clear block content
  block.innerHTML = '';

  // Create filter dropdown (custom dropdown)
  const filterContainer = document.createElement('div');
  filterContainer.className = 'carousel-biz-filter';

  // Custom dropdown button
  const dropdownButton = document.createElement('button');
  dropdownButton.className = 'biz-dropdown';
  dropdownButton.setAttribute('aria-label', 'Filter by business type');
  dropdownButton.setAttribute('aria-expanded', 'false');
  dropdownButton.setAttribute('aria-haspopup', 'listbox');

  const dropdownText = document.createElement('span');
  dropdownText.className = 'biz-dropdown-text';
  dropdownText.textContent = 'All business types';

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

  // Custom dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'biz-dropdown-menu';
  dropdownMenu.setAttribute('role', 'listbox');
  dropdownMenu.setAttribute('aria-hidden', 'true');

  filterContainer.appendChild(dropdownButton);
  filterContainer.appendChild(dropdownMenu);
  block.appendChild(filterContainer);

  // Create carousel container
  const carouselContainer = document.createElement('ul');
  carouselContainer.className = 'carousel-biz-container';
  block.appendChild(carouselContainer);

  // Fetch business types for dropdown
  const businessTypes = await fetchBusinessTypes();

  // Add "All business types" option
  const allOption = document.createElement('div');
  allOption.className = 'biz-dropdown-option active';
  allOption.setAttribute('role', 'option');
  allOption.setAttribute('aria-selected', 'true');
  allOption.dataset.value = '';
  allOption.textContent = 'All business types';
  dropdownMenu.appendChild(allOption);

  // Add business type options
  businessTypes.forEach((bt) => {
    const option = document.createElement('div');
    option.className = 'biz-dropdown-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.dataset.value = bt.business_type_id;
    option.textContent = bt.business_type_name;
    dropdownMenu.appendChild(option);
  });

  // Fetch initial insights (all business types)
  let cards = await fetchInsights();

  // Validate minimum items
  if (cards.length < MIN_ITEMS) {
    // Show empty state or remove block
    block.innerHTML = '<p>No insights available at the moment.</p>';
    return;
  }

  // Render initial cards
  renderCards(carouselContainer, cards);
  initializeCarousel(block, carouselContainer, cards.length);

  // Custom dropdown interactions
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

  const selectOption = async (option) => {
    // Update active state
    dropdownMenu.querySelectorAll('.biz-dropdown-option').forEach((opt) => {
      opt.classList.remove('active');
      opt.setAttribute('aria-selected', 'false');
    });
    option.classList.add('active');
    option.setAttribute('aria-selected', 'true');

    // Update button text
    dropdownText.textContent = option.textContent;

    // Close dropdown
    closeDropdown();

    // Fetch filtered insights
    const businessTypeId = option.dataset.value;
    carouselContainer.classList.add('loading');

    try {
      const fetchOptions = businessTypeId ? { business_type_id: businessTypeId } : {};
      cards = await fetchInsights(fetchOptions);

      if (cards.length < MIN_ITEMS) {
        carouselContainer.innerHTML = '<li class="empty-state">No insights available for this business type.</li>';
        return;
      }

      renderCards(carouselContainer, cards);
      initializeCarousel(block, carouselContainer, cards.length);
    } finally {
      carouselContainer.classList.remove('loading');
    }
  };

  // Toggle dropdown on button click
  dropdownButton.addEventListener('click', toggleDropdown);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target) && isOpen) {
      closeDropdown();
    }
  });

  // Handle option selection
  dropdownMenu.addEventListener('click', (e) => {
    const option = e.target.closest('.biz-dropdown-option');
    if (option) {
      selectOption(option);
    }
  });

  // Keyboard navigation
  dropdownButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape' && isOpen) {
      closeDropdown();
    }
  });
}
