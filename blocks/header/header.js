import { createElement } from '@scripts/common.js';
import { hasToken } from '@auth/tokenManager.js';
import openSignInModal from '@components/signin/index.js';
import { getMetadata } from '@scripts/aem.js';
import { logout } from '@auth/authService.js';
import { loadFragment } from '@blocks/fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 992px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav && nav.getAttribute('aria-expanded') === 'true') {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav);
    }
  }
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const navSections = nav.querySelector('.nav-sections');

  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');

  if (navSections) {
    toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  }

  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * loads and decorates the test header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // Get campaign phase metadata (defaults to 'teaser')
  const campaignPhase = getMetadata('campaign-phase') || 'teaser';
  const isLiveMode = campaignPhase === 'live';
  const isLoggedIn = hasToken();

  // Load nav fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const nav = createElement('nav', { attributes: { id: 'nav' } });

  // Add fragment content to nav sections
  const navSections = createElement('div', { className: 'nav-sections' });
  while (fragment.firstElementChild) {
    navSections.appendChild(fragment.firstElementChild);
  }

  // Decorate nav sections
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
    navSection.addEventListener('click', () => {
      if (isDesktop.matches) {
        const expanded = navSection.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navSections);
        navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    });
  });

  // Create hamburger menu
  const hamburger = createElement('div', {
    className: 'nav-hamburger',
  });

  const hamburgerButton = createElement('button', {
    attributes: {
      type: 'button',
      'aria-controls': 'nav',
      'aria-label': 'Open navigation',
    },
  });

  const hamburgerIcon = createElement('span', {
    className: 'nav-hamburger-icon',
  });

  // Create the three lines of the hamburger
  for (let i = 0; i < 3; i += 1) {
    const line = createElement('span', {
      className: 'nav-hamburger-line',
    });
    hamburgerIcon.appendChild(line);
  }

  hamburgerButton.appendChild(hamburgerIcon);
  hamburger.appendChild(hamburgerButton);
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Prepend hamburger and append nav sections
  nav.prepend(hamburger);
  nav.appendChild(navSections);

  // Create brand/logo section
  const brand = createElement('div', { className: 'nav-brand' });
  const brandLink = createElement('a', {
    attributes: { href: '/', 'aria-label': 'Unilever Food Solutions Home' },
  });
  const logo = createElement('img', {
    attributes: {
      src: '/icons/ufs-logo.png',
      alt: 'Unilever Food Solutions',
      width: '81',
      height: '36',
    },
  });
  brandLink.appendChild(logo);
  brand.appendChild(brandLink);

  // Create elements wrapper
  const elements = createElement('div', { className: `nav-elements ${!isLiveMode ? 'nav-elements--teaser' : 'nav-elements--live'}` });

  // Create header container with hamburger and logo (always shown)
  const headerContainer = createElement('div', { className: 'nav-header' });
  headerContainer.append(brand);

  // In teaser mode, only show hamburger and logo
  if (!isLiveMode) {
    elements.append(hamburger, headerContainer);
  } else {
    // In live mode, also show profile section
    // Create profile section
    const profile = createElement('div', { className: 'nav-profile' });
    const profileButton = createElement('button', {
      className: 'nav-profile-button',
      attributes: {
        type: 'button',
        'aria-label': isLoggedIn ? 'My account' : 'Sign in',
      },
    });

    if (isLoggedIn) {
      // Logged in: show profile icon + "My account" text
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

      // Add "My account" text for desktop
      const accountText = createElement('span', {
        className: 'nav-profile-text',
        innerContent: 'My account',
      });
      profileButton.appendChild(accountText);

      // Create dropdown menu for logged-in users
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

      // Toggle dropdown on profile button click
      profileButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('nav-profile-dropdown--active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdown.classList.remove('nav-profile-dropdown--active');
      });
    } else {
      // Not logged in: show "Sign in" text
      // Mobile: Sign in text only
      // Desktop: "Already registered? Sign in" prefix + link
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
    }

    // Handle profile click
    if (!isLoggedIn) {
      profileButton.addEventListener('click', () => {
        openSignInModal();
      });
    }

    profile.appendChild(profileButton);
    headerContainer.append(profile);

    elements.append(hamburger, headerContainer);
  }

  // Add elements wrapper to nav (before nav sections)
  nav.insertBefore(elements, navSections);
  nav.setAttribute('aria-expanded', 'false');

  // Prevent mobile nav behavior on window resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  const navWrapper = createElement('div', { className: 'nav-wrapper' });
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
