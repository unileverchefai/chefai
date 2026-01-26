import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';

/**
 * Creates a generic, reusable modal component
 * @param {Object} options - Configuration options for the modal
 * @param {HTMLElement|Function|string} options.content - The content to display in the modal
 * @param {boolean} [options.showCloseButton=true] - Whether to show the default close button
 * @param {boolean} [options.closeOnClickOutside=true] - Whether to close when clicking outside
 * @param {boolean} [options.closeOnEscape=true] - Whether to close when pressing Escape key
 * @param {number} [options.animationDuration=300] - Animation duration in milliseconds
 * @param {string} [options.overlayClass='modal-overlay'] - CSS class for the overlay
 * @param {string} [options.contentClass='modal-content'] - CSS class for the content container
 * @param {string} [options.closeButtonClass='modal-close'] - CSS class for the close button
 * @param {Function} [options.onClose] - Callback function called when modal closes
 * @param {Function} [options.onOpen] - Callback function called when modal opens
 * @param {HTMLElement} [options.customCloseButton] - Custom close button element
 * @param {string} [options.closeButtonLabel='Close'] - Aria label for close button
 * @param {string} [options.closeButtonText='×'] - Text content for close button
 * @param {string} [options.overlayBackground] - Custom overlay background color
 * @returns {Object} Modal instance with methods: open, close, destroy, getOverlay, getContent
 * @example
 * const modal = createModal({
 *   content: document.createElement('div'),
 *   onClose: () => console.log('Modal closed')
 * });
 * modal.open();
 */
export default function createModal(options = {}) {
  const {
    content,
    showCloseButton = true,
    closeOnClickOutside = true,
    closeOnEscape = true,
    animationDuration = 300,
    overlayClass = 'modal-overlay',
    contentClass = 'modal-content',
    closeButtonClass = 'modal-close',
    onClose,
    onOpen,
    customCloseButton,
    closeButtonLabel = 'Close',
    overlayBackground,
  } = options;

  let modalOverlay = null;
  let modalContent = null;
  let closeButton = null;
  let modalHandle = null;
  let escapeHandler = null;
  let isOpen = false;
  let isAnimating = false;

  /**
   * Creates the modal overlay element
   */
  function createOverlay() {
    if (modalOverlay) return modalOverlay;

    modalOverlay = createElement('div', {
      className: overlayClass,
    });

    if (overlayBackground) {
      modalOverlay.style.background = overlayBackground;
    }

    return modalOverlay;
  }

  /**
   * Creates the modal content container
   */
  function createContentContainer() {
    if (modalContent) return modalContent;

    modalContent = createElement('div', {
      className: contentClass,
    });

    return modalContent;
  }

  /**
   * Creates the modal handle (for mobile)
   */
  function createModalHandle() {
    if (modalHandle) return modalHandle;

    modalHandle = createElement('div', {
      className: 'modal-handle',
    });

    return modalHandle;
  }

  /**
   * Creates the close button
   */
  function createCloseButton() {
    if (closeButton) return closeButton;

    if (customCloseButton) {
      closeButton = customCloseButton;
    } else {
      // Always create close button (CSS will handle desktop/mobile visibility)
      closeButton = createElement('button', {
        className: closeButtonClass,
        attributes: {
          'aria-label': closeButtonLabel,
          type: 'button',
        },
      });
      closeButton.innerHTML = '<img src="/icons/arrow-down.svg" alt="Close" width="15" height="9">';

      // Add class to control visibility if showCloseButton is false
      // CSS will still show it on desktop via media query
      if (!showCloseButton) {
        closeButton.classList.add('modal-close-hidden');
      }
    }

    return closeButton;
  }

  /**
   * Handles the close action
   */
  function handleClose() {
    if (isAnimating || !isOpen) return;

    isAnimating = true;

    // Trigger close animation
    if (modalOverlay) {
      modalOverlay.classList.remove('visible');
    }

    setTimeout(() => {
      if (modalOverlay && modalOverlay.parentNode) {
        document.body.removeChild(modalOverlay);
      }
      document.body.style.overflow = '';
      isOpen = false;
      isAnimating = false;

      if (escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
      }

      if (onClose) {
        onClose();
      }
    }, animationDuration);
  }

  /**
   * Handles escape key press
   */
  function handleEscape(e) {
    if (e.key === 'Escape' && closeOnEscape) {
      handleClose();
    }
  }

  /**
   * Sets up event listeners
   */
  function setupEventListeners() {
    if (closeButton) {
      closeButton.addEventListener('click', handleClose);
    }

    if (closeOnClickOutside && modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          handleClose();
        }
      });
    }

    if (closeOnEscape) {
      escapeHandler = handleEscape;
      document.addEventListener('keydown', escapeHandler);
    }
  }

  /**
   * Processes the content parameter and returns an element
   */
  function processContent(contentParam) {
    if (!contentParam) return null;

    if (typeof contentParam === 'function') {
      return contentParam();
    }

    if (typeof contentParam === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = contentParam;
      return temp.firstElementChild || temp;
    }

    if (contentParam instanceof HTMLElement) {
      return contentParam;
    }

    return null;
  }

  /**
   * Opens the modal
   */
  function open() {
    if (isOpen || isAnimating) return;

    // Load modal CSS if not already loaded
    loadCSS(`${window.hlx.codeBasePath}/blocks/components/modal/modal.css`).catch(() => {
      // CSS loading error handled silently
    });

    // Create overlay
    createOverlay();

    // Create content container
    createContentContainer();

    // Process and add content
    const contentElement = processContent(content);
    if (contentElement) {
      modalContent.appendChild(contentElement);
    }

    // Create and add modal handle (always shown on mobile)
    createModalHandle();
    if (modalHandle) {
      modalContent.appendChild(modalHandle);
    }

    // Create and add close button (always created, CSS handles desktop/mobile visibility)
    createCloseButton();
    if (closeButton) {
      modalContent.appendChild(closeButton);
    } else {
      // Always create close button for desktop view, but hide it if showCloseButton is false
      createCloseButton();
      if (closeButton) {
        closeButton.style.display = 'none';
        modalContent.appendChild(closeButton);
      }
    }

    // Add content to overlay
    modalOverlay.appendChild(modalContent);

    // Add overlay to body
    document.body.appendChild(modalOverlay);
    document.body.style.overflow = 'hidden';

    // Setup event listeners
    setupEventListeners();

    // Trigger open animation
    setTimeout(() => {
      if (modalOverlay) {
        modalOverlay.classList.add('visible');
      }
    }, 10);

    isOpen = true;

    if (onOpen) {
      onOpen();
    }
  }

  /**
   * Closes the modal
   */
  function close() {
    handleClose();
  }

  /**
   * Destroys the modal and cleans up
   */
  function destroy() {
    if (escapeHandler) {
      document.removeEventListener('keydown', escapeHandler);
      escapeHandler = null;
    }

    if (modalOverlay && modalOverlay.parentNode) {
      document.body.removeChild(modalOverlay);
    }

    document.body.style.overflow = '';
    modalOverlay = null;
    modalContent = null;
    closeButton = null;
    modalHandle = null;
    isOpen = false;
    isAnimating = false;
  }

  /**
   * Gets the overlay element
   */
  function getOverlay() {
    return modalOverlay;
  }

  /**
   * Gets the content container element
   */
  function getContent() {
    return modalContent;
  }

  return {
    open,
    close,
    destroy,
    getOverlay,
    getContent,
  };
}
