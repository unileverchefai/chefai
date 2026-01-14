import { createVideoEmbed, findVideoLink } from '../../scripts/common.js';

function openVideoModal(videoUrl) {
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('video-modal-overlay');

  // modal content container
  const modalContent = document.createElement('div');
  modalContent.classList.add('video-modal-content');

  // close button
  const closeButton = document.createElement('button');
  closeButton.classList.add('video-modal-close');
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '×';

  // video embed
  const videoEmbed = createVideoEmbed(videoUrl);

  if (videoEmbed) {
    // dd autoplay parameter to URL for better UX
    const currentSrc = videoEmbed.getAttribute('src');
    videoEmbed.setAttribute('src', `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}autoplay=1`);

    modalContent.appendChild(videoEmbed);
  }

  modalOverlay.appendChild(closeButton);
  modalOverlay.appendChild(modalContent);
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

  if (children.length < 2) return false;

  const mediaSection = children[0];
  const mediaSectionContent = mediaSection.querySelector('div');
  if (!mediaSectionContent) return false;

  // Required: picture element
  if (!mediaSectionContent.querySelector('picture')) return false;

  // Required: h2 with title text (not just picture/link)
  const allH2s = mediaSectionContent.querySelectorAll('h2');
  if (allH2s.length === 0) return false;

  let hasTitleText = false;
  allH2s.forEach((h2) => {
    const textNodes = Array.from(h2.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join('');
    const hasOnlyText = !h2.querySelector('picture, a') && h2.textContent.trim();
    if (textNodes || hasOnlyText) hasTitleText = true;
  });
  if (!hasTitleText) return false;

  // Required: paragraph text
  const textContent = mediaSectionContent.querySelector('p');
  if (!textContent || !textContent.textContent.trim()) return false;

  // Required: 3 USP cards
  const cards = children.slice(1);
  if (cards.length !== 3) return false;

  // Validate each card
  for (let i = 0; i < cards.length; i += 1) {
    const innerDiv = cards[i].querySelector('div');
    if (!innerDiv) return false;

    const cardTitle = innerDiv.querySelector('h4');
    const cardDescription = innerDiv.querySelector('p');
    const cardIcon = cardTitle?.querySelector('picture');

    if (!cardTitle || !cardTitle.textContent.trim()) return false;
    if (!cardDescription || !cardDescription.textContent.trim()) return false;
    if (!cardIcon) return false;
  }

  return true;
}

export default function decorate(block) {
  // check if required elements are present
  if (!validateRequiredElements(block)) {
    // if not, remove the block entirely
    console.warn('One or more elements are missing. Please review the content source');
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
        const thumbnailWrapper = document.createElement('div');
        thumbnailWrapper.classList.add('video-thumbnail-wrapper');

        const pictureClone = picture.cloneNode(true);
        thumbnailWrapper.appendChild(pictureClone);

        const playButton = document.createElement('button');
        playButton.classList.add('video-play-button');
        playButton.setAttribute('aria-label', 'Play video');
        playButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
            <path d="M3.94065e-06 15.1908V1.60474C-0.000117323 1.02682 0.310579 0.493498 0.813367 0.208563C1.31616 -0.076373 1.93333 -0.0688865 2.42906 0.228161L13.7497 7.02118C14.2337 7.31095 14.53 7.83363 14.53 8.39776C14.53 8.96189 14.2337 9.48457 13.7497 9.77433L2.42906 16.5674C1.93284 16.8647 1.31497 16.8719 0.811969 16.5862C0.308965 16.3004 -0.00127526 15.7661 3.94065e-06 15.1876V15.1908Z" fill="white"/>
          </svg>
        `;

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
    const cardsTextSection = document.createElement('div');
    cardsTextSection.classList.add('cards-text');

    textCards.forEach((card) => {
      const innerDiv = card.querySelector('div');
      if (innerDiv) {
        const h4 = innerDiv.querySelector('h4');
        const p = innerDiv.querySelector('p');
        const picture = h4?.querySelector('picture');

        if (h4 && picture) {
          const textWrapper = document.createElement('div');

          picture.remove();
          textWrapper.appendChild(h4);

          if (p) {
            textWrapper.appendChild(p);
          }

          innerDiv.innerHTML = '';

          const h4Wrapper = document.createElement('h4');
          h4Wrapper.appendChild(picture);

          innerDiv.appendChild(h4Wrapper);
          innerDiv.appendChild(textWrapper);
        }
      }

      cardsTextSection.appendChild(card);
    });

    block.appendChild(cardsTextSection);
  }
}
