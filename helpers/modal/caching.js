/**
 * Keep-in-DOM close: hide overlay and clean up without removing from DOM or calling onClose.
 * Used when keepInDomOnClose is true so the same overlay can be shown again on next open().
 * @param {HTMLElement} modalOverlay - The overlay element to hide
 * @param {Object} options - Cleanup options
 * @param {Function} [options.removeListeners] - Called to remove keydown/focus-trap listeners
 * @param {HTMLElement|null} [options.previousActiveElement] - Element to restore focus to
 */
export default function performKeepInDomClose(
  modalOverlay,
  { removeListeners, previousActiveElement } = {},
) {
  if (!modalOverlay) return;
  modalOverlay.style.display = 'none';
  document.body.style.overflow = '';
  if (typeof removeListeners === 'function') {
    removeListeners();
  }
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    try {
      previousActiveElement.focus();
    } catch (err) {
      // Element might not be focusable anymore, ignore
    }
  }
}
