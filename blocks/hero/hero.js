import { loadCSS } from '../../scripts/aem.js';
import {
  variantClassesToBEM, getBEMTemplateName, loadVariantScript, createElement,
} from '../../scripts/common.js';
import setCountdownToHero from './variants/countdown.js';

const variantClasses = {
  live: 'live',
  countdown: 'countdown',
};
const blockName = 'hero';

const { live, countdown } = variantClasses;
let hasLogo = false;

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
    <div class="${classes.media}${hasLogo ? ` ${classes.logo}` : ''}">
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
* Adds elements to a specified area, clearing existing content first.
* @param {HTMLElement} area - The target area to add elements into the template.
* @param {HTMLElement[]} elements - The elements to add to the area.
*/
function addElementsToArea(area, elements) {
  area.textContent = '';
  elements.forEach((el) => {
    area.appendChild(el);
  });
  if (hasLogo && Array.from(area.classList).some((cls) => cls.endsWith('--media'))) {
    const logo = createElement('div', {
      className: 'hero--logo-wrapper',
      fragment: `
        <div class="hero--logo-text"></div>
        <div class="hero--logo-number"></div>
      `,
    });
    area.appendChild(logo);
  }
}

function buildHero({ heroClassList, heroContent, heroContainer }) {
  const mediaArea = heroContainer.querySelector(`.${heroClassList.media}`);
  const contentArea = heroContainer.querySelector(`.${heroClassList.textContent}`);
  const ctaArea = heroContainer.querySelector(`.${heroClassList.cta}`);
  const disclaimerArea = heroContainer.querySelector(`.${heroClassList.disclaimer}`);
//! build media area. (to build just by now an image, later video & carousel)
  const content = heroContent.querySelector(':scope > div');
  const mediaElement = content.querySelector(':scope > p');
  if (mediaElement) {
    addElementsToArea(mediaArea, [mediaElement]);
  }
  // build text content area
  const textTitle = content.querySelector(':scope > h1');
  const textSubtitle = content.querySelector(':scope > p');
  if (textTitle && textSubtitle) {
    addElementsToArea(contentArea, [textTitle, textSubtitle]);
  }

  // build cta area
  const ctaElement = content.querySelector(':scope > p.button-container');
  if (ctaElement) {
    addElementsToArea(ctaArea, [ctaElement]);
  }

  // build disclaimer area
  const disclaimerElement = content.querySelector(':scope > p');
  if (disclaimerElement) {
    addElementsToArea(disclaimerArea, [disclaimerElement]);
  }
}

/*
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

function setVariantClass(variant) {
  return getBEMTemplateName({ blockName, variantName: variant });
}

/*
* Build variant-specific hero block
* @param {Object} params - The parameters object.
* @param {string} params.variant - The variant name.
* @param {HTMLElement} params.block - The hero block element.
* @param {boolean} [params.hasScript=false] - Whether the variant has an associated script to load.
* @param {boolean} [params.hasStyle=false] - Whether the variant has an associated style to load.
*/
async function buildVariant({
  variant, block, hasScript = false, hasStyle = false, isCountdown = false,
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
  const heroContainer = buildHeroContainer({ variantClass, isCountdown });
  const heroContent = block.querySelector(':scope > div');
  buildHero({ heroClassList: heroClasses(variantClass), heroContent, heroContainer });
  block.textContent = '';
  block.appendChild(heroContainer);
}

export default async function decorate(block) {
  const isLive = block.classList.contains(live);
  const isCountdown = block.classList.contains(countdown);
  hasLogo = Boolean(block.classList.contains('logo'));
  variantClassesToBEM({
    blockClassList: block.classList,
    variantClasses,
    blockName,
  });

  if (isLive) {
    await buildVariant({ variant: live, block, hasStyle: true });
  }

  if (isCountdown) {
    await buildVariant({
      variant: countdown, block, hasScript: true, hasStyle: true, isCountdown: true,
    });
    const countdownClass = getBEMTemplateName({ blockName, variantName: countdown, modifierName: 'countdown-timer' });
    const countdownArea = block.querySelector(`.${countdownClass}`);
    setCountdownToHero({ countdownArea, countdownClass: setVariantClass(countdown) });
  }
}
