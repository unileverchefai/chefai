import { welcomeModalSeen } from './custom/utils.js';
import { getLang } from './custom/locale.js';
import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';
import { getPlaceholders, loadTemplate, loadTheme } from './common.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  const isRegularBlock = h1 && h1.closest('.hero') !== null;
  if (!h1 || !picture || isRegularBlock) return;
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    const heroBlock = buildBlock('hero', { elems: [picture, h1] });
    heroBlock.classList.add('auto-block');
    section.appendChild(heroBlock);
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto block `*/fragments/*` references
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getLang();
  await getPlaceholders();
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    await loadTemplate(main);
    await loadTheme();
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */

    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * checks if header should be rendered based on metadata flags
 * @returns {boolean} true if header should be rendered, false otherwise
*/
function renderHeaderCheck() {
  const altHeader = getMetadata('alt-header'); // alternative header metadata flag
  const noHeader = getMetadata('no-header'); // no render header metadata flag
  return !altHeader && !noHeader;
}

/**
 * checks if footer should be rendered based on metadata flags
 * @returns {boolean} true if footer should be rendered, false otherwise
*/
function renderFooterCheck() {
  const noFooter = getMetadata('no-footer'); // no render footer metadata flag
  return !noFooter;
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  const header = doc.querySelector('header');
  const footer = doc.querySelector('footer');

  if (header && renderHeaderCheck()) {
    loadHeader(header);
  }

  if (footer && renderFooterCheck()) {
    loadFooter(footer);
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // Initialize subscription flow triggers (links with href="#subscription-flow")
  try {
    const { setupSubscriptionFlowTriggers } = await import('@helpers/subscription/index.js');
    if (typeof setupSubscriptionFlowTriggers === 'function') {
      setupSubscriptionFlowTriggers();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize subscription flow triggers', e);
  }

  // Fetch and log user business data on page load
  try {
    const { default: fetchSavedBusinessInfoAndLog } = await import('@helpers/personalized-hub/fetchSavedBusinessInfo.js');
    await fetchSavedBusinessInfoAndLog();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch user business data on page load', e);
  }

  // Load and open welcome modal only on personalized-hub when user has not seen it yet
  const pathname = window.location.pathname ?? '';
  if (pathname.includes('personalized-hub') && !welcomeModalSeen()) {
    const { default: openWelcomeModal } = await import('@helpers/welcome-modal/welcome-modal.js');
    openWelcomeModal().catch((e) => console.error('Welcome modal failed', e));
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  // TODO: comment it for now unblock pages access and
  // to fix the redirect different use cases
  // const canProceed = await checkPageAccess();
  // if (!canProceed) {
  //   return;
  // }

  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
