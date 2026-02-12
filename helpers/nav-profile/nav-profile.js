import { createElement } from '@scripts/common.js';
import { hasToken } from '@auth/tokenManager.js';
import { logout } from '@auth/authService.js';
import { loadCSS } from '@scripts/aem.js';
import openSignInModal from '@helpers/signin/index.js';

loadCSS(`${window.hlx.codeBasePath}/helpers/nav-profile/nav-profile.css`);

export default function createProfileSection() {
  const isLoggedIn = hasToken();

  const profile = createElement('div', { className: 'nav-profile' });
  const profileButton = createElement('button', {
    className: 'nav-profile-button',
    attributes: {
      type: 'button',
      'aria-label': isLoggedIn ? 'My account' : 'Sign in',
    },
  });

  if (isLoggedIn) {
    const profileIcon = createElement('span', {
      className: 'nav-profile-icon',
      innerContent: `
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="currentColor" stroke-width="2"/>
            <path d="M16 16c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" fill="currentColor"/>
          </svg>
        `,
    });
    profileButton.appendChild(profileIcon);

    const accountText = createElement('span', {
      className: 'nav-profile-text',
      innerContent: 'My account',
    });
    profileButton.appendChild(accountText);

    const dropdown = createElement('div', {
      className: 'nav-profile-dropdown',
    });

    const accountLink = createElement('a', {
      className: 'nav-profile-dropdown-item',
      innerContent: 'My account',
      attributes: {
        href: '/account',
      },
    });

    const logoutButton = createElement('button', {
      className: 'nav-profile-dropdown-item',
      innerContent: 'Logout',
      attributes: {
        type: 'button',
      },
    });

    logoutButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      await logout();
      window.location.href = '/';
    });

    dropdown.append(accountLink, logoutButton);
    profile.appendChild(dropdown);

    profileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('nav-profile-dropdown--active');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('nav-profile-dropdown--active');
    });
  } else {
    const signInText = createElement('span', {
      className: 'nav-profile-text nav-profile-text--signin',
    });

    const desktopPrefix = createElement('span', {
      className: 'nav-profile-text-prefix',
      innerContent: 'Already registered? ',
    });

    const signInLink = createElement('span', {
      className: 'nav-profile-text-link',
      innerContent: 'Sign in',
    });

    signInText.append(desktopPrefix, signInLink);
    profileButton.appendChild(signInText);

    profileButton.addEventListener('click', () => {
      openSignInModal();
    });
  }

  profile.appendChild(profileButton);

  return profile;
}
