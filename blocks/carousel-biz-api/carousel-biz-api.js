import createCarousel from '@helpers/carousel/carousel.js';
import { decorateIcons } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import { fetchTimeBasedRecommendations, fetchBusinessTypes } from '@api/recommendations.js';

/**
 * Default trend to use when API doesn't provide trend data
 */
const DEFAULT_TREND = { class: 'borderless-cuisine', name: 'Borderless Cuisine', image: '/icons/borderless-cuisine.jpg' };

/**
 * Load trend mappings from JSON file
 * @returns {Promise<Object>} Trend mapping object
 */
async function loadTrendConfig() {
  try {
    const response = await fetch('/blocks/carousel-biz-api/mock-data/trends.json');
    if (!response.ok) {
      throw new Error(`Failed to load trends.json: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load trend config:', error);
    return {};
  }
}

/**
 * Extract a short summary from description for card display
 * @param {string} description - Full description text
 * @param {number} maxLength - Maximum length for summary
 * @returns {string} Truncated summary
 */
function extractSummary(description, maxLength = 150) {
  if (!description) return '';

  const plainText = description.replace(/\*\*/g, '').replace(/\n/g, ' ').trim();

  if (plainText.length <= maxLength) return plainText;

  // find the last sentence that fits
  const truncated = plainText.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastPeriod > maxLength * 0.6) {
    return truncated.substring(0, lastPeriod + 1);
  }

  return `${truncated.substring(0, lastSpace)}...`;
}

/**
 * Parse title to extract neon text and determine display type
 * @param {string} title - Full title from API
 * @returns {Object} Object with neonText, remainingText, and type
 */
function parseTitleForNeonEffect(title) {
  if (!title) return { neonText: null, remainingText: '', type: 'none' };

  const words = title.split(/\s+/);
  const firstWord = words[0];

  // Check if first word is numeric (contains any digit)
  const isNumeric = /\d/.test(firstWord);

  // Neon Number version
  if (isNumeric) {
    return {
      neonText: firstWord,
      remainingText: words.slice(1).join(' '),
      type: 'number',
    };
  }

  // Neon Word version
  if (firstWord.length <= 10) {
    return {
      neonText: firstWord,
      remainingText: words.slice(1).join(' '),
      type: 'word',
    };
  }

  // No neon version - word flows into description
  return {
    neonText: null,
    remainingText: title,
    type: 'none',
  };
}

/**
 * Map API recommendation to card data structure
 * @param {Object} recommendation - API recommendation object
 * @param {Object} trendConfig - Trend mapping object
 * @returns {Object} Card data object
 */
function mapRecommendationToCard(recommendation, trendConfig) {
  // Get trend from API or use default
  let trendStyle;
  if (recommendation.trends && recommendation.trends.length > 0) {
    const apiTrendName = recommendation.trends[0]; // Use first trend
    trendStyle = trendConfig[apiTrendName];

    // Fallback...
    if (!trendStyle) {
      trendStyle = DEFAULT_TREND;
    } else {
      trendStyle = { ...trendStyle, name: apiTrendName };
    }
  } else {
    trendStyle = DEFAULT_TREND;
  }

  const titleParsed = parseTitleForNeonEffect(recommendation.title);

  return {
    id: recommendation.id,
    trendName: trendStyle.name,
    trendClass: trendStyle.class,
    neonText: titleParsed.neonText,
    neonType: titleParsed.type,
    titleRemainder: titleParsed.remainingText,
    description: extractSummary(recommendation.description, 180),
    link: null, // API doesn't provide link data
    bgImage: trendStyle.image,
    painPoints: recommendation.pain_points || [],
    type: recommendation.type,
    isSneakPeek: recommendation.is_sneakpeek || false,
    validFrom: recommendation.valid_from,
    validTo: recommendation.valid_to,
  };
}

/**
 * Render carousel cards from card data ......doubts here, not in design ...
 * @param {HTMLElement} container - The carousel container element
 * @param {Array} cards - Array of card data objects
 */
function renderCards(container, cards) {
  container.innerHTML = '';

  cards.forEach((cardData) => {
    const {
      trendClass,
      trendName,
      bgImage,
      description,
      link,
      neonText,
      neonType,
      titleRemainder,
    } = cardData;

    const card = createElement('li', {
      className: `trend-card ${trendClass}`,
      attributes: {
        'data-trend': trendClass,
        'data-id': cardData.id,
      },
    });

    if (bgImage) {
      card.style.backgroundImage = `url('${bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    // Card header (trend name)
    const header = createElement('div', {
      className: 'trend-header',
      innerContent: trendName.toUpperCase(),
    });
    card.appendChild(header);

    // Card content wrapper
    const content = createElement('div', {
      className: 'trend-content',
    });

    // Insight container
    const insightContainer = createElement('div', {
      className: 'trend-insight',
    });

    // Render based on neon type - different gaps!
    if (neonType === 'number' && neonText) {
      insightContainer.classList.add('insight-gap-number');
      const neonElement = createElement('div', {
        className: 'trend-stat stat-number',
        innerContent: neonText,
      });
      insightContainer.appendChild(neonElement);

      if (titleRemainder) {
        const remainder = createElement('p', {
          className: 'trend-description',
          innerContent: titleRemainder,
        });
        insightContainer.appendChild(remainder);
      }
    } else if (neonType === 'word' && neonText) {
      insightContainer.classList.add('insight-gap-word');
      const neonElement = createElement('div', {
        className: 'trend-stat stat-word',
        innerContent: neonText,
      });
      insightContainer.appendChild(neonElement);

      if (titleRemainder) {
        const remainder = createElement('p', {
          className: 'trend-description',
          innerContent: titleRemainder,
        });
        insightContainer.appendChild(remainder);
      }
    } else {
      insightContainer.classList.add('insight-gap-word');
      if (titleRemainder) {
        const fullText = createElement('p', {
          className: 'trend-description',
          innerContent: titleRemainder,
        });
        insightContainer.appendChild(fullText);
      }
    }

    // Add secondary description if exists
    if (description && neonType !== 'none') {
      const desc = createElement('p', {
        className: 'trend-description trend-description-secondary',
        innerContent: description,
      });
      insightContainer.appendChild(desc);
    }

    content.appendChild(insightContainer);

    // CTA or spacer
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
    console.error('Failed to initialize carousel-biz-api:', error);
  }
}

export default async function decorate(block) {
  const MIN_ITEMS = 3;

  // Get user ID from session storage if available
  const userId = sessionStorage.getItem('chefai_user_id') || 'staging-user';

  // Clear block content
  block.innerHTML = '';

  // Show loading state
  const loadingState = createElement('div', {
    className: 'carousel-biz-api-loading',
    innerContent: 'Loading personalized insights...',
  });
  block.appendChild(loadingState);

  try {
    // Fetch recommendations from API
    const [recommendations, trendConfig] = await Promise.all([
      fetchTimeBasedRecommendations({
        userId,
        limit: 10,
      }),
      loadTrendConfig(),
    ]);

    // Remove loading state
    loadingState.remove();

    // Validate minimum items
    if (!recommendations || recommendations.length < MIN_ITEMS) {
      const emptyState = createElement('div', {
        className: 'carousel-biz-api-empty',
        innerContent: 'No personalized insights available at the moment.',
      });
      block.appendChild(emptyState);
      return;
    }

    // Map API data to card structure
    const allCards = recommendations.map((rec) => mapRecommendationToCard(rec, trendConfig));

    // Fetch business types for dropdown
    const businessTypes = await fetchBusinessTypes();

    // Create filter dropdown
    const filterContainer = createElement('div', {
      className: 'carousel-biz-api-filter',
    });

    // Custom dropdown button
    const dropdownButton = createElement('button', {
      className: 'biz-dropdown',
      attributes: {
        'aria-label': 'Filter by business type',
        'aria-expanded': 'false',
        'aria-haspopup': 'listbox',
      },
    });

    const dropdownText = createElement('span', {
      className: 'biz-dropdown-text',
      innerContent: 'All business types',
    });

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

    const dropdownMenu = createElement('div', {
      className: 'biz-dropdown-menu',
      attributes: {
        role: 'listbox',
        'aria-hidden': 'true',
      },
    });

    const allOption = createElement('div', {
      className: 'biz-dropdown-option active',
      attributes: {
        role: 'option',
        'aria-selected': 'true',
        'data-value': '',
      },
      innerContent: 'All business types',
    });
    dropdownMenu.appendChild(allOption);

    // Add business type options
    if (businessTypes && businessTypes.length > 0) {
      businessTypes.forEach((bt) => {
        const option = createElement('div', {
          className: 'biz-dropdown-option',
          attributes: {
            role: 'option',
            'aria-selected': 'false',
            'data-value': bt.business_type_id || bt.id || bt.name,
          },
          innerContent: bt.business_type_name || bt.name,
        });
        dropdownMenu.appendChild(option);
      });
    }

    filterContainer.appendChild(dropdownButton);
    filterContainer.appendChild(dropdownMenu);
    block.appendChild(filterContainer);

    // Create carousel wrapper
    const carouselWrapper = createElement('div', {
      className: 'carousel-biz-api-carousel-wrapper',
    });

    // Create carousel container
    const carouselContainer = createElement('ul', {
      className: 'carousel-biz-api-container',
    });

    carouselWrapper.appendChild(carouselContainer);
    block.appendChild(carouselWrapper);

    // Render initial cards
    renderCards(carouselContainer, allCards);
    initializeCarousel(block, carouselContainer, allCards.length);

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

    const selectOption = (option) => {
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

      // Filter cards (currently showing all since API doesn't provide business type data)
      // In future, this could filter based on user preference or fetch filtered data
      const filteredCards = allCards;

      if (filteredCards.length < MIN_ITEMS) {
        carouselContainer.innerHTML = '';
        const emptyState = createElement('li', {
          className: 'empty-state',
          innerContent: 'No insights available for this business type.',
        });
        carouselContainer.appendChild(emptyState);

        const controls = block.querySelector('.controls');
        if (controls) {
          controls.style.display = 'none';
        }
        return;
      }

      const controls = block.querySelector('.controls');
      if (controls) {
        controls.style.display = '';
      }

      renderCards(carouselContainer, filteredCards);
      initializeCarousel(block, carouselContainer, filteredCards.length);
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load carousel-biz-api:', error);

    // Remove loading state if present
    if (loadingState.parentNode) {
      loadingState.remove();
    }

    const errorState = createElement('div', {
      className: 'carousel-biz-api-error',
      innerContent: 'Failed to load insights. Please try again later.',
    });
    block.appendChild(errorState);
  }
}
