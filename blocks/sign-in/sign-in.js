import openSignInModal from '../../components/signin/index.js';
import { createElement } from '../../scripts/common.js';

/**
 * Sign In Block
 * Adds a "Sign in" link that opens the sign-in modal when clicked
 */
export default function decorate(block) {
  block.textContent = '';

  // Create sign-in link
  const signInLink = createElement('a', {
    className: 'sign-in-link',
    textContent: 'Sign in',
    properties: {
      href: '#',
      'aria-label': 'Sign in',
    },
  });

  // Click handler
  signInLink.addEventListener('click', (e) => {
    e.preventDefault();
    openSignInModal();
  });

  block.appendChild(signInLink);
}
