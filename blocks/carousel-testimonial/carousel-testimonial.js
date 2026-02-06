import { createElement, findVideoLink } from '@scripts/common.js';
import createCarousel from '@helpers/carousel/carousel.js';
import openVideoModal from '../../scripts/custom/modal-video.js';

/**
 * Parse a row from DA to determine if it's a video item or card item
 * @param {Element} row - The row element (direct child of carousel-testimonial block)
 * @returns {Object|null} - Parsed item data or null if invalid
 */
function parseItem(row) {
  const cell = row.children[0];
  if (!cell) return null;

  // Check if it's a video card
  const videoLink = findVideoLink(cell);

  if (videoLink) {
    const thumbnail = cell.querySelector('picture');
    if (!thumbnail) return null;

    const title = cell.querySelector('h2');
    if (!title?.textContent.trim()) return null;

    const avatarContainer = cell.querySelector('h3');
    return {
      type: 'video',
      videoUrl: videoLink.getAttribute('href'),
      thumbnail,
      title: title?.textContent.trim() || '',
      avatar: avatarContainer?.querySelector('picture'),
      handle: avatarContainer?.textContent.trim() || '',
    };
  }

  // Check if it's a quotes card
  const richText = cell.querySelector('p em, p i');
  if (!richText) return null;

  const firstParagraph = cell.querySelector('p');
  const quote = richText.textContent.trim();
  const authorName = firstParagraph?.querySelector('strong')?.textContent.trim() || '';
  const avatarIcon = firstParagraph?.querySelector('picture');
  const allParagraphs = cell.querySelectorAll('p');
  const jobTitle = allParagraphs.length > 1 ? allParagraphs[1].textContent.trim() : '';

  return {
    type: 'card',
    quote,
    authorName,
    avatarIcon,
    jobTitle,
  };
}

/**
 * Create a video card element
 * @param {Object} videoData - Parsed video data from parseItem()
 * @returns {Element} - The video card <li> element
 */
function createVideoItem(videoData) {
  const {
    videoUrl,
    thumbnail,
    title,
    avatar,
    handle,
  } = videoData;

  const item = createElement('li', {
    className: 'carousel-video-item',
  });

  const thumbnailContainer = createElement('div', {
    className: 'video-thumbnail',
  });

  if (thumbnail) {
    const clonedThumbnail = thumbnail.cloneNode(true);
    const img = clonedThumbnail.querySelector('img');
    if (img) {
      img.alt = ''; // Decorative, title provides context!!
    }
    thumbnailContainer.appendChild(clonedThumbnail);
  }

  const playIcon = createElement('div', {
    className: 'play-icon',
    properties: {
      'aria-hidden': 'true',
    },
  });
  thumbnailContainer.appendChild(playIcon);

  thumbnailContainer.setAttribute('role', 'button');
  thumbnailContainer.setAttribute('tabindex', '0');
  thumbnailContainer.setAttribute('aria-label', `Play video: ${title}`);
  thumbnailContainer.dataset.videoUrl = videoUrl;

  const titleElement = createElement('h3', {
    className: 'video-title',
    innerContent: title,
  });

  const authorInfo = createElement('div', {
    className: 'video-author',
  });

  if (avatar) {
    const avatarContainer = createElement('div', {
      className: 'author-avatar',
    });
    const clonedAvatar = avatar.cloneNode(true);
    const img = clonedAvatar.querySelector('img');
    if (img) {
      img.alt = ''; // Decorative, handle provides context
    }
    avatarContainer.appendChild(clonedAvatar);
    authorInfo.appendChild(avatarContainer);
  }

  if (handle) {
    const handleElement = createElement('span', {
      className: 'author-handle',
      innerContent: handle,
    });
    authorInfo.appendChild(handleElement);
  }

  item.appendChild(thumbnailContainer);
  item.appendChild(titleElement);
  if (authorInfo.children.length > 0) {
    item.appendChild(authorInfo);
  }

  return item;
}

/**
 * Create a quotes card element
 * @param {Object} cardData - Parsed card data from parseItem()
 * @param {string} colorVariant - Auto-assigned variant class (variant-1, variant-2, or variant-3)
 * @returns {Element} - The card item <li> element
 */
function createCardItem(cardData, colorVariant) {
  const {
    quote,
    authorName,
    avatarIcon,
    jobTitle,
  } = cardData;

  const item = createElement('li', {
    className: `carousel-card-item ${colorVariant}`,
  });

  const cardBody = createElement('div', {
    className: 'card-body',
  });

  const quoteElement = createElement('blockquote', {
    className: 'card-quote',
  });

  const quoteText = createElement('em', {
    innerContent: quote,
  });
  quoteElement.appendChild(quoteText);
  cardBody.appendChild(quoteElement);

  if (authorName) {
    const authorInfo = createElement('div', {
      className: 'card-author',
    });

    if (avatarIcon) {
      const iconContainer = createElement('div', {
        className: 'author-icon',
      });
      const clonedIcon = avatarIcon.cloneNode(true);
      const img = clonedIcon.querySelector('img');
      if (img) {
        img.alt = ''; // Decorative, author name provides context
      }
      iconContainer.appendChild(clonedIcon);
      authorInfo.appendChild(iconContainer);
    }

    const nameElement = createElement('strong', {
      className: 'author-name',
      innerContent: authorName,
    });
    authorInfo.appendChild(nameElement);
    cardBody.appendChild(authorInfo);
  }

  item.appendChild(cardBody);

  if (jobTitle) {
    const cardMeta = createElement('div', {
      className: 'card-meta',
      innerContent: jobTitle,
    });
    item.appendChild(cardMeta);
  }

  return item;
}

export default function decorate(block) {
  const rows = [...block.children];

  const carouselContainer = createElement('ul', {
    className: 'carousel-container',
  });
  carouselContainer.setAttribute('role', 'region');
  carouselContainer.setAttribute('aria-label', 'Testimonial carousel');

  const liveRegion = createElement('div', {
    className: 'sr-only',
    properties: {
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  });

  // auto-rotate card colors to avoid repetiton :))
  let cardCounter = 0;
  const variants = ['variant-1', 'variant-2', 'variant-3'];

  const items = [];
  rows.forEach((row) => {
    const parsedData = parseItem(row);
    if (!parsedData) return;

    let itemElement;

    if (parsedData.type === 'video') {
      itemElement = createVideoItem(parsedData);
    } else if (parsedData.type === 'card') {
      const colorVariant = variants[cardCounter % variants.length];
      itemElement = createCardItem(parsedData, colorVariant);
      cardCounter += 1;
    }

    if (itemElement) {
      carouselContainer.appendChild(itemElement);
      items.push(itemElement);
    }
  });

  block.innerHTML = '';
  block.appendChild(liveRegion);
  block.appendChild(carouselContainer);

  //  static layout on desktop if 4 or less items
  const STATIC_LAYOUT_COUNT = 4;
  const isStaticDesktop = items.length <= STATIC_LAYOUT_COUNT;

  if (isStaticDesktop) {
    block.classList.add('carousel-testimonial-static');
  }

  if (items.length > 0) {
    createCarousel({
      container: carouselContainer,
      block,
      itemCount: items.length,
      mobileItemsPerSlide: 1,
      desktopItemsPerSlide: 3,
      mobileBreakpoint: 900,
      mobileGap: 16,
      desktopGap: 24,
      swipeOnDesktop: true,
      enableMomentum: true,
      disableDesktopCarousel: isStaticDesktop,
    });
  }

  // video playback functionality
  const videoThumbnails = block.querySelectorAll('.video-thumbnail');
  videoThumbnails.forEach((thumbnail) => {
    const { videoUrl } = thumbnail.dataset;
    if (!videoUrl) return;

    thumbnail.addEventListener('click', () => {
      openVideoModal(videoUrl);
    });

    thumbnail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoModal(videoUrl);
      }
    });
  });
}
