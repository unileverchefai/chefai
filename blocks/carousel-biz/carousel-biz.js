import { createCarousel } from '../../scripts/common.js';

export default function decorate(block) {
  // Parse the block content - each div > div is a trend card
  const cards = [...block.children].map((row) => {
    const cell = row.children[0];

    // Extract trend name (h3)
    const h3 = cell.querySelector('h3');
    const trendName = h3 ? h3.textContent.trim() : '';

    // Extract background image (first p with picture)
    const paragraphs = cell.querySelectorAll('p');
    let bgImage = null;
    let description = '';
    let link = null;

    // First paragraph might contain the background image
    if (paragraphs.length > 0) {
      const firstPicture = paragraphs[0].querySelector('picture img');
      if (firstPicture) {
        bgImage = firstPicture.getAttribute('src');
      } else {
        // If no picture, it's the description text
        description = paragraphs[0].textContent.trim();
      }
    }

    // Extract stat/insight (h2)
    const h2 = cell.querySelector('h2');
    const stat = h2 ? h2.textContent.trim() : '';

    // Find description paragraph (first p without picture, after image if present)
    const descParagraph = [...paragraphs].find((p) => !p.querySelector('picture') && !p.querySelector('a'));
    if (descParagraph) {
      description = descParagraph.textContent.trim();
    }

    // Extract CTA link (p with anchor and arrow icon)
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

    return {
      trendName,
      stat,
      description,
      link,
      bgImage,
    };
  }).filter((cardData) => cardData.trendName); // Trend name is mandatory

  // Validate minimum items
  const MIN_ITEMS = 3;
  if (cards.length < MIN_ITEMS) {
    block.remove();
    return;
  }

  block.innerHTML = '';

  // Create filter dropdown (optional - can be removed if not needed)
  const filterContainer = document.createElement('div');
  filterContainer.className = 'carousel-biz-filter';

  const dropdown = document.createElement('select');
  dropdown.className = 'biz-dropdown';
  dropdown.setAttribute('aria-label', 'Filter by business type');

  const defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.textContent = 'All business types';
  dropdown.appendChild(defaultOption);

  filterContainer.appendChild(dropdown);
  block.appendChild(filterContainer);

  // Create carousel container
  const carouselContainer = document.createElement('ul');
  carouselContainer.className = 'carousel-biz-container';

  cards.forEach((cardData) => {
    const card = document.createElement('li');
    card.className = 'trend-card';
    card.setAttribute('data-trend', cardData.trendName.toLowerCase().replace(/\s+/g, '-'));

    // Determine card type based on trend name
    let trendClass = '';
    const trendLower = cardData.trendName.toLowerCase();
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

    if (trendClass) {
      card.classList.add(trendClass);
    }

    // Set background image if available
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

      // Add arrow icon (SVG) - simple right arrow
      const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrowSvg.setAttribute('class', 'cta-arrow');
      arrowSvg.setAttribute('width', '20');
      arrowSvg.setAttribute('height', '20');
      arrowSvg.setAttribute('viewBox', '0 0 20 20');
      arrowSvg.setAttribute('fill', 'none');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M4 10H16M16 10L11 5M16 10L11 15');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');

      arrowSvg.appendChild(path);
      cta.appendChild(arrowSvg);

      content.appendChild(cta);
    }

    card.appendChild(content);
    carouselContainer.appendChild(card);
  });

  block.appendChild(carouselContainer);

  // Create carousel
  try {
    const carousel = createCarousel({
      container: carouselContainer,
      block,
      itemCount: cards.length,
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

    // Store carousel instance for cleanup
    block.carouselInstance = carousel;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize carousel-biz:', error);
  }
}
