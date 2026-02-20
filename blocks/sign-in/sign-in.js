import openSignInModal from '@helpers/signin/index.js';
import { createElement } from '@scripts/common.js';
import { getUrl } from '@scripts/custom/redirect.js';

/**
 * Sign In Block
 * Adds a "Sign in" link that opens the sign-in modal when clicked
 */
export default function decorate(block) {
  block.textContent = '';

  // Create sign-in link
  const signInLink = createElement('a', {
    className: 'sign-in-link',
    innerContent: 'Sign in',
    attributes: {
      href: getUrl('personalized-hub'),
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
