import { loadCSS } from '../../scripts/aem.js';
import {
  variantClassesToBEM, getBEMTemplateName, loadVariantScript, createElement, findVideoLink,
} from '../../scripts/common.js';
import openVideoModal from '../../scripts/modal-video.js';
import setCountdownToHero from './variants/countdown.js';

const variantClasses = {
  live: 'live',
  countdown: 'countdown',
};
const blockName = 'hero';

const { live, countdown } = variantClasses;
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 150;
let hasLogo = false;
let hasVideo = false;
let videoElement = null;

/**
* BEM class names for hero block areas
* @param {string} variantClass - The base BEM class name for the variant.
* @return {Object} - An object containing the BEM class names for each area of the hero block.
*/
const heroClasses = (variantClass) => ({
  wrapper: `${variantClass}--wrapper`,
  media: `${variantClass}--media`,
  content: `${variantClass}--content`,
  textContent: `${variantClass}--text-content`,
  countdownTimer: `${variantClass}--countdown-timer`,
  cta: `${variantClass}--cta`,
  disclaimer: `${variantClass}--disclaimer`,
  video: `${blockName}--video`,
  logo: `${blockName}--logo`,
});

/**
  * Hero block template
  * @param {Object} params - The parameters object.
  * @param {Object} params.classes - The BEM class names for the block areas.
  * @param {boolean} [params.isCountdown=false] - Whether to include the countdown timer area.
  * @return {string} - The HTML template string for the hero block.
*/
const heroTemplate = ({ classes, isCountdown = false }) => `
  <div class="${classes.wrapper}">
    <div class="${classes.media}${hasLogo ? ` ${classes.logo}` : ''}${hasVideo ? ` ${classes.video}` : ''}">
      <!-- Media (image, video, carousel) goes here -->
    </div>
    <div class="${classes.content}">
      <div class="${classes.textContent}">
        <!-- Text content (title, subtitle, description) goes here -->
      </div>
      ${isCountdown ? `<div class="${classes.countdownTimer}" aria-live="polite" aria-atomic="true">
        <!-- Countdown timer goes here -->
      </div>` : ''}
      <div class="${classes.cta}">
        <!-- Call-to-action buttons go here -->
      </div>
      <div class="${classes.disclaimer}">
        <!-- Disclaimer or additional info goes here -->
      </div>
    </div>
  </div>
`;

/**
* Appends a logo element to the specified area (for media area mainly).
* @param {HTMLElement} area - The target area to append the logo element to.
*/
function appendLogoElement(area) {
  const logo = createElement('div', {
    className: 'hero--logo-wrapper',
    fragment: `
      <div class="hero--logo-text"></div>
      <div class="hero--logo-number"></div>
    `,
  });
  area.appendChild(logo);
}

/**
* Adds elements to a specified area, clearing existing content first.
* @param {HTMLElement} area - The target area to add elements into the template.
* @param {HTMLElement[]} elements - The elements to add to the area.
*/
function addElementsToArea(area, elements) {
  area.innerHTML = '';
  elements.forEach((el) => {
    area.appendChild(el);
  });
  const isMediaArea = Array.from(area.classList).some((cls) => cls.endsWith('--media'));
  if (isMediaArea && elements.length === 2) {
    const [mobileElement, desktopElement] = elements;
    mobileElement.classList.add('hero--media-mobile');
    desktopElement.classList.add('hero--media-desktop');
  }

  if (hasLogo && isMediaArea) {
    appendLogoElement(area);
  }
  if (hasVideo && videoElement && isMediaArea) {
    const videoLink = videoElement.href;
    const videoWrapper = createElement('div', {
      className: 'hero--video-wrapper',
      fragment: `
      <a href="${videoLink}" class="hero--play-button video-play-button" aria-label="Play Video"></a>
      `,
    });
    const videoButton = videoWrapper.querySelector('a');

    ['click', 'keydown'].forEach((eventType) => {
      videoButton.addEventListener(eventType, (e) => {
        if (eventType === 'click' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openVideoModal(videoLink);
        }
      });
    });
    area.appendChild(videoWrapper);
  }
}

/**
 * Validate mandatory elements in hero content
 * @param {HTMLElement} heroContent - The original hero content element.
 * @return {boolean} - True if all mandatory elements are present and valid, false otherwise.
 * @description
 * _Mandatory elements:_
 *
 * - _Title (max 80 chars), description text (max 150 chars), CTA_
 *
 * _Optional elements:_
 *
 * - _Logo, countdown timer, disclaimer text_
*/
function validateElements(heroContent) {
  if (hasVideo && !videoElement) {
    console.warn('Hero block validation failed: Missing %cvideo link%c element.', 'color: red', '');
    return false;
  }
  // Validate title
  const titleElement = heroContent.querySelector(':scope > div > h1');
  if (!titleElement) {
    console.warn('Hero block validation failed: Missing %ch1 title%c element.', 'color: red', '');
    return false;
  }
  if (titleElement.textContent.length > MAX_TITLE_LENGTH) {
    console.warn('Hero block validation failed: %cTitle exceeds maximum length of 80 characters.%c', 'color: red', '');
    return false;
  }
  // Validate description text
  const descriptionElement = Array.from(
    heroContent.querySelectorAll(':scope > div > p'),
  ).find((p) => (
    !p.classList.contains('button-container')
    && !p.querySelector('picture')
    && p.textContent.trim().length > 0
  ));
  if (!descriptionElement) {
    console.warn('Hero block validation failed: Missing %cdescription text%c element.', 'color: red', '');
    return false;
  }
  if (descriptionElement.textContent.length > MAX_DESCRIPTION_LENGTH) {
    console.warn('Hero block validation failed: %cDescription text exceeds maximum length of 150 characters.%c', 'color: red', '');
    return false;
  }
  // Validate CTA
  const ctaElement = heroContent.querySelector(':scope > div > p.button-container');
  if (!ctaElement) {
    console.warn('Hero block validation failed: Missing %cCTA%c element.', 'color: red', '');
    return false;
  }
  return true;
}

/**
 * Validate media elements in hero content
 * @param {NodeList} mediaElements - The media elements in the hero content.
 * @return {boolean} - True if at least two media elements are present, false otherwise.
 * @description
 * _Mandatory elements:_
 *
 * - _At least two image elements_
 *
 * _Optional elements:_
 *
 * - _No image: show a background color as fallback_
 * - _One image: show the provided image_
*/
function validateMediaElements(mediaElements) {
  if (mediaElements.length < 1) {
    console.warn('Hero block validation failed: No %cmedia%c elements found.', 'color: red', '');
    return false;
  }
  if (mediaElements.length < 2) {
    console.warn('Hero block validation failed: Less than %ctwo media%c elements found.', 'color: red', '');
    return false;
  }
  return true;
}

/**
 * Build hero block areas and populate with content
 * @param {Object} params - The parameters object.
 * @param {Object} params.heroClassList - The BEM class names for the hero block areas.
 * @param {HTMLElement} params.heroContent - The original hero content element.
 * @param {HTMLElement} params.heroContainer - The hero container element to populate.
*/
function buildHero({ heroClassList, heroContent, heroContainer }) {
  const mediaArea = heroContainer.querySelector(`.${heroClassList.media}`);
  const contentArea = heroContainer.querySelector(`.${heroClassList.textContent}`);
  const ctaArea = heroContainer.querySelector(`.${heroClassList.cta}`);
  const disclaimerArea = heroContainer.querySelector(`.${heroClassList.disclaimer}`);
  const content = heroContent.querySelector(':scope > div');
  const mediaElements = content.querySelectorAll(':scope > p:has(picture)');

  if (!mediaElements.length) {
    mediaArea.classList.add('no-image');
    mediaArea.innerHTML = '';
    appendLogoElement(mediaArea);
  }

  // build media area
  if (mediaElements.length > 0) {
    addElementsToArea(mediaArea, [...mediaElements]);
  }
  // build text content area
  const textTitle = content.querySelector(':scope > h1');
  const textSubtitle = content.querySelector(':scope > p:not(.button-container):not(:has(picture)):first-of-type');
  if (textTitle && textSubtitle) {
    addElementsToArea(contentArea, [textTitle, textSubtitle]);
  }

  // build cta area
  const ctaElement = content.querySelector(':scope > p.button-container');
  if (ctaElement) {
    addElementsToArea(ctaArea, [ctaElement]);
  }

  // build disclaimer area
  const disclaimerElement = content.querySelector(':scope > p:not(.button-container):not(:has(picture)):not(:first-of-type)');
  if (disclaimerElement) {
    addElementsToArea(disclaimerArea, [disclaimerElement]);
  }
}

/**
* Build hero container element
* @param {Object} params - The parameters object.
* @param {string} params.variantClass - The base BEM class name for the variant.
* @param {boolean} [params.isCountdown=false] - Whether to include the countdown timer area.
* @return {HTMLElement} - The hero container element.
*/
function buildHeroContainer({ variantClass, isCountdown = false }) {
  return createElement('div', {
    className: variantClass,
    fragment: heroTemplate({ classes: heroClasses(variantClass), isCountdown }),
  });
}

/**
* Get BEM class name for a given variant
* @param {string} variant - The variant name.
* @return {string} - The BEM class name for the variant.
*/
function setVariantClass(variant) {
  return getBEMTemplateName({ blockName, variantName: variant });
}

/**
* Build variant-specific hero block
* @param {Object} params - The parameters object.
* @param {string} params.variant - The variant name.
* @param {HTMLElement} params.block - The hero block element.
* @param {boolean} [params.hasScript=false] - Whether the variant has an associated script to load.
* @param {boolean} [params.hasStyle=false] - Whether the variant has an associated style to load.
 * @param {boolean} [params.isCountdown=false] - Whether to include the countdown timer area.
 * @param {boolean} [params.useButtons=false] - Whether to include buttons in the variant.
*/
async function buildVariant({
  variant, block, hasScript = false, hasStyle = false, isCountdown = false, useButtons = false,
}) {
  // Placeholder for future variant-specific build logic
  const variantName = variant;
  const variantClass = setVariantClass(variant);
  if (hasScript) {
    await loadVariantScript({ blockName, variantName });
  }
  if (hasStyle) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/variants/${variantName}.css`);
  }
  if (useButtons) {
    await loadCSS(`${window.hlx.codeBasePath}/styles/buttons.css`);
  }

  const heroContainer = buildHeroContainer({ variantClass, isCountdown });
  const heroContent = block.querySelector(':scope > div');
  buildHero({ heroClassList: heroClasses(variantClass), heroContent, heroContainer });
  block.textContent = '';
  block.appendChild(heroContainer);
}

/**
 * Setup video link for hero block
 * @param {HTMLElement} block - The hero block element.
 */
function setupVideoLink(block) {
  const videolink = findVideoLink(block);
  if (!videolink) {
    videoElement = null;
    return;
  }
  if (videolink.parentElement.localName === 'p') {
    videolink.parentElement.remove();
  } else {
    videolink.remove();
  }
  videoElement = videolink;
}

export default async function decorate(block) {
  const isLive = block.classList.contains(live);
  const isCountdown = block.classList.contains(countdown);
  hasVideo = Boolean(block.classList.contains('video'));
  hasLogo = Boolean(block.classList.contains('logo'));
  variantClassesToBEM({
    blockClassList: block.classList,
    variantClasses,
    blockName,
  });

  if (hasVideo) {
    try {
      await loadCSS(`${window.hlx.codeBasePath}/styles/modal-video.css`);
    } catch (error) {
      console.error('Error loading %cmodal video%c CSS:', 'color: red', '', error);
    }
    setupVideoLink(block);
  }

  const isContentValid = validateElements(block.querySelector(':scope > div'));
  if (!isContentValid) {
    console.error('Hero block decoration aborted due to %cvalidation%c errors. The block will not be rendered.', 'color: red', '');
    block.innerHTML = '';
    return;
  }

  const has2Images = validateMediaElements(block.querySelectorAll(':scope > div > div > p:has(picture)'));
  if (!has2Images) {
    console.error('Hero block decoration: Rendering with available media or fallback background due to %cvalidation%c errors.', 'color: orange', '');
  }

  if (isLive) {
    await buildVariant({
      variant: live, block, useButtons: true,
    });
  }

  if (isCountdown) {
    await buildVariant({
      variant: countdown,
      block,
      hasScript: true,
      hasStyle: true,
      isCountdown: true,
      useButtons: true,
    });
    const countdownClass = getBEMTemplateName({ blockName, variantName: countdown, modifierName: 'countdown-timer' });
    const countdownArea = block.querySelector(`.${countdownClass}`);
    setCountdownToHero({ countdownArea, countdownClass: setVariantClass(countdown) });
  }
}
