import { createElement } from 'react';
import { createVideoEmbed, findVideoLink } from '../../scripts/common.js';

function openVideoModal(videoUrl) {
  const modalOverlay = createElement('div', { className: 'video-modal-overlay' });

  // modal content container
  const modalContent = createElement('div', { className: 'video-modal-content' });
  // close button
  const closeButton = createElement('button', {
    className: 'video-modal-close',
    attributes: { 'aria-label': 'Close video' },
    innerContent: '×',
  });

  // video embed
  const videoEmbed = createVideoEmbed(videoUrl);

  if (videoEmbed) {
    // dd autoplay parameter to URL for better UX
    const currentSrc = videoEmbed.getAttribute('src');
    videoEmbed.setAttribute('src', `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}autoplay=1`);

    modalContent.appendChild(videoEmbed);
  } else {
    console.warn('media-text-cards: %cInvalid%c video URL provided, modal will %cnot%c display video content', 'color: red;', '', 'color: red;', '');
  }

  modalOverlay.append(closeButton, modalContent);
  document.body.appendChild(modalOverlay);

  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    modalOverlay.classList.add('visible');
  }, 10);

  const closeModal = () => {
    modalOverlay.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(modalOverlay);
      document.body.style.overflow = '';
    }, 300);
  };

  closeButton.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function validateRequiredElements(block) {
  const children = Array.from(block.children);

  if (children.length < 2) {
    console.warn('media-text-cards: Block %cmust%c have at least a %cmedia section%c and %cUSP cards section%c', 'color: red;', '', 'color: red;', '', 'color: red;', '');
    return false;
  }

  const mediaSection = children[0];
  const mediaSectionContent = mediaSection.querySelector('div');
  if (!mediaSectionContent) {
    console.warn('media-text-cards: Media section is %cmissing%c content wrapper', 'color: red;', '');
    return false;
  }

  // Required: picture element
  if (!mediaSectionContent.querySelector('picture')) {
    console.warn('media-text-cards: Media section is %cmissing%c picture/image', 'color: red;', '');
    return false;
  }

  // Check if there's a video link to determine validation rules
  const hasVideoLink = !!findVideoLink(mediaSectionContent);

  // H2 with title text is only required when there's a video
  if (hasVideoLink) {
    const allH2s = mediaSectionContent.querySelectorAll('h2');
    if (allH2s.length === 0) {
      console.warn('media-text-cards: Media section with %cvideo%c is %cmissing%c h2 title', 'color: red;', '', 'color: red;', '');
      return false;
    }

    let hasTitleText = false;
    allH2s.forEach((h2) => {
      const textNodes = Array.from(h2.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join('');
      const hasOnlyText = !h2.querySelector('picture, a') && h2.textContent.trim();
      if (textNodes || hasOnlyText) hasTitleText = true;
    });
    if (!hasTitleText) {
      console.warn('media-text-cards: Media section h2 %cmust%c contain title text when %cvideo%c is present', 'color: red;', '', 'color: red;', '');
      return false;
    }
  }

  // Required: paragraph text
  const textContent = mediaSectionContent.querySelector('p');
  if (!textContent || !textContent.textContent.trim()) {
    console.warn('media-text-cards: Media section is %cmissing%c paragraph text', 'color: red;', '');
    return false;
  }

  // Required: 3 USP cards
  const cards = children.slice(1);
  if (cards.length !== 3) {
    console.warn(`media-text-cards: %cExpected%c 3 USP cards, %cfound%c ${cards.length}`, 'color: red;', '', 'color: red;', '');
    return false;
  }

  // Validate each card
  for (let i = 0; i < cards.length; i += 1) {
    const innerDiv = cards[i].querySelector('div');
    if (!innerDiv) {
      console.warn(`media-text-cards: %cCard ${i + 1}%c is %cmissing%c content wrapper`, 'color: red;', '', 'color: red;', '');
      return false;
    }

    const cardTitle = innerDiv.querySelector('h4');
    const cardDescription = innerDiv.querySelector('p');
    const cardIcon = cardTitle?.querySelector('picture');

    if (!cardTitle || !cardTitle.textContent.trim()) {
      console.warn(`media-text-cards: %cCard ${i + 1}%c is %cmissing%c h4 title`, 'color: red;', '', 'color: red;', '');
      return false;
    }
    if (!cardDescription || !cardDescription.textContent.trim()) {
      console.warn(`media-text-cards: %cCard ${i + 1}%c is %cmissing%c description text`, 'color: red;', '', 'color: red;', '');
      return false;
    }
    if (!cardIcon) {
      console.warn(`media-text-cards: %cCard ${i + 1}%c is %cmissing%c icon in title`, 'color: red;', '', 'color: red;', '');
      return false;
    }
  }

  return true;
}

export default function decorate(block) {
  // check if required elements are present
  if (!validateRequiredElements(block)) {
    // if not, remove the block entirely (validation function already logged specific warnings)
    block.remove();
    return;
  }

  const children = Array.from(block.children);

  // media section
  const mediaSection = children[0];
  if (mediaSection) {
    mediaSection.classList.add('media-title');

    // check if there's a video link
    const videoLink = findVideoLink(mediaSection);

    if (videoLink) {
      const videoUrl = videoLink.getAttribute('href');

      const picture = mediaSection.querySelector('picture');

      if (picture) {
        const thumbnailWrapper = createElement('div', { className: 'video-thumbnail-wrapper' });

        const pictureClone = picture.cloneNode(true);
        thumbnailWrapper.appendChild(pictureClone);

        const playButton = createElement('button', {
          className: 'video-play-button',
          attributes: { 'aria-label': 'Play video' },
          innerContent: `
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
              <path d="M3.94065e-06 15.1908V1.60474C-0.000117323 1.02682 0.310579 0.493498 0.813367 0.208563C1.31616 -0.076373 1.93333 -0.0688865 2.42906 0.228161L13.7497 7.02118C14.2337 7.31095 14.53 7.83363 14.53 8.39776C14.53 8.96189 14.2337 9.48457 13.7497 9.77433L2.42906 16.5674C1.93284 16.8647 1.31497 16.8719 0.811969 16.5862C0.308965 16.3004 -0.00127526 15.7661 3.94065e-06 15.1876V15.1908Z" fill="white"/>
            </svg>
          `,
        });

        thumbnailWrapper.appendChild(playButton);
        mediaSection.insertBefore(thumbnailWrapper, mediaSection.firstChild);
        picture.remove();

        // Add click handler to open modal
        thumbnailWrapper.addEventListener('click', () => {
          openVideoModal(videoUrl, block);
        });

        // Make it keyboard accessible
        thumbnailWrapper.setAttribute('role', 'button');
        thumbnailWrapper.setAttribute('tabindex', '0');
        thumbnailWrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openVideoModal(videoUrl, block);
          }
        });
      }

      const linkParent = videoLink.closest('h1, h2, h3, h4, h5, h6, p, div');
      if (linkParent) {
        linkParent.remove();
      }
    } else {
      // if no video link, check for image only
      const h2 = mediaSection.querySelector('h2');
      const picture = h2?.querySelector('picture');
      if (picture) {
        const pictureClone = picture.cloneNode(true);
        mediaSection.insertBefore(pictureClone, mediaSection.firstChild);

        picture.remove();
      }
    }
  }

  // cards-text section
  const textCards = children.slice(1);

  if (textCards.length > 0) {
    // wrapper for text cards
    const cardsTextSection = createElement('div', { className: 'cards-text' });

    textCards.forEach((card) => {
      const innerDiv = card.querySelector('div');
      if (innerDiv) {
        const h4 = innerDiv.querySelector('h4');
        const p = innerDiv.querySelector('p');
        const picture = h4?.querySelector('picture');

        if (h4 && picture) {
          const textWrapper = createElement('div');

          picture.remove();
          textWrapper.appendChild(h4);

          if (p) {
            textWrapper.appendChild(p);
          }

          innerDiv.innerHTML = '';

          const h4Wrapper = createElement('h4');
          h4Wrapper.appendChild(picture);

          innerDiv.appendChild(h4Wrapper);
          innerDiv.appendChild(textWrapper);
        } else if (h4 && !picture) {
          console.warn('media-text-cards: Card %cmissing%c icon - display may be %cincorrect%c', 'color: red;', '', 'color: red;', '');
        }
      }

      cardsTextSection.appendChild(card);
    });

    block.appendChild(cardsTextSection);
  }
}
