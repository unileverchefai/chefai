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
} from './aem.js';

/**
 * Video embedding utilities
 */

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
 * - /media_HASH.mp4 (DAM files that might be YouTube URLs)
 */
export function getYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#]+)/,
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract video ID from Vimeo URL
 * Supports formats:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 * - /media_HASH.mp4 (DAM files that might be Vimeo URLs)
 */
export function getVimeoVideoId(url) {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Check if a URL is a video link and return the embed iframe if it is
 * Returns null if not a video link
 * @param {string} url The URL to check (can be YouTube, Vimeo, or DAM link)
 * @returns {HTMLIFrameElement|null} The iframe element or null
 */
export function createVideoEmbed(url) {
  if (!url) return null;

  let videoId;
  let embedUrl;

  // YouTube (including Shorts)
  videoId = getYouTubeVideoId(url);
  if (videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'YouTube video player');
    iframe.setAttribute('loading', 'lazy');
    return iframe;
  }

  // Vimeo
  videoId = getVimeoVideoId(url);
  if (videoId) {
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Vimeo video player');
    iframe.setAttribute('loading', 'lazy');
    return iframe;
  }

  return null;
}

export function findVideoLink(container) {
  const videoLink = container.querySelector(
    'a[href*="youtube.com"], a[href*="youtu.be"], a[href*="vimeo.com"]',
  );
  return videoLink;
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
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
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
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
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
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
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
