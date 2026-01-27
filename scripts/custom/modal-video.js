import { createElement, createVideoEmbed } from '../common.js';

export default function openVideoModal(videoUrl) {
  const modalOverlay = createElement('div', {
    className: 'video-modal-overlay',
  });

  // modal content container
  const modalContent = createElement('div', {
    className: 'video-modal-content',
  });

  // close button
  const closeButton = createElement('button', {
    className: 'video-modal-close',
    attributes: {
      'aria-label': 'Close video',
    },
    innerContent: '×',
  });

  // video embed
  const videoEmbed = createVideoEmbed(videoUrl);

  if (videoEmbed) {
    // add autoplay parameter to URL for better UX
    const currentSrc = videoEmbed.getAttribute('src');
    videoEmbed.setAttribute('src', `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}autoplay=1`);

    modalContent.appendChild(videoEmbed);
  } else {
    console.warn('Invalid video %cURL%c provided, modal will not display video content', 'color: red;', '');
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
