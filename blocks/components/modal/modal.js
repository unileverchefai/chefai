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
    ariaLabel,
    ariaLabelledBy,
  } = options;

  let modalOverlay = null;
  let modalContent = null;
  let closeButton = null;
  let modalHandle = null;
  let escapeHandler = null;
  let focusTrapHandler = null;
  let previousActiveElement = null;
  let isOpen = false;
  let isAnimating = false;

  /**
   * Creates the modal overlay element
   */
  function createOverlay() {
    if (modalOverlay) return modalOverlay;

    const overlayAttributes = {
      role: 'dialog',
      'aria-modal': 'true',
    };

    if (ariaLabel) {
      overlayAttributes['aria-label'] = ariaLabel;
    } else if (ariaLabelledBy) {
      overlayAttributes['aria-labelledby'] = ariaLabelledBy;
    } else {
      overlayAttributes['aria-labelledby'] = 'modal-title';
    }

    modalOverlay = createElement('div', {
      className: overlayClass,
      attributes: overlayAttributes,
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
      attributes: {
        id: 'modal-title',
      },
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

      if (focusTrapHandler) {
        document.removeEventListener('keydown', focusTrapHandler);
        focusTrapHandler = null;
      }

      // Restore focus to the element that opened the modal
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        try {
          previousActiveElement.focus();
        } catch (err) {
          // Element might not be focusable anymore, ignore
        }
      }
      previousActiveElement = null;

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
   * Gets all focusable elements within the modal
   */
  function getFocusableElements() {
    if (!modalContent) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(modalContent.querySelectorAll(focusableSelectors))
      .filter((el) => {
        // Filter out hidden elements
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  }

  /**
   * Handles focus trap - keeps focus within the modal
   */
  function handleFocusTrap(e) {
    if (!isOpen || !modalContent) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If Tab is pressed
    if (e.key === 'Tab') {
      // If Shift+Tab on first element, move to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        // If Tab on last element, move to first
        e.preventDefault();
        firstElement.focus();
      }
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

    // Setup focus trap
    focusTrapHandler = handleFocusTrap;
    document.addEventListener('keydown', focusTrapHandler);
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
      const temp = createElement('div', { innerContent: contentParam });
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

    // Store the previously active element for focus restoration
    previousActiveElement = document.activeElement;

    // Trigger open animation
    setTimeout(() => {
      if (modalOverlay) {
        modalOverlay.classList.add('visible');
      }

      // Focus the first input field after animation
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          // Find first input field (input, textarea, select)
          const firstInput = focusableElements.find((el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');

          if (firstInput) {
            firstInput.focus();
          } else {
            // If no input found, focus first focusable element (excluding close button)
            const firstElement = focusableElements.find(
              (el) => el !== closeButton,
            ) ?? focusableElements[0];
            firstElement.focus();
          }
        } else if (modalContent) {
          // If no focusable elements, make content focusable temporarily
          modalContent.setAttribute('tabindex', '-1');
          modalContent.focus();
        }
      }, animationDuration);
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

    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }

    if (modalOverlay && modalOverlay.parentNode) {
      document.body.removeChild(modalOverlay);
    }

    document.body.style.overflow = '';

    // Restore focus if needed
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      try {
        previousActiveElement.focus();
      } catch (err) {
        // Element might not be focusable anymore, ignore
      }
    }

    modalOverlay = null;
    modalContent = null;
    closeButton = null;
    modalHandle = null;
    previousActiveElement = null;
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
