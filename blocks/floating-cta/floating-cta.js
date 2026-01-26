import { createElement, addVariantLogic } from '@scripts/common.js';
import openPersonalizedHub from '@components/personalized-hub/personalized-hub.js';

const blockName = 'floating-cta';
const blockClasses = {
  container: `${blockName}-container`,
  wrapper: `${blockName}-wrapper`,
  newContainer: `${blockName}__container`,
  title: `${blockName}__title`,
  disclaimer: `${blockName}__disclaimer`,
};
const MAX_TITLE_LENGTH = 65;
const MAX_BUTTON_LENGTH = 40;
const MAX_DISCLAIMER_LENGTH = 70;
// There are 2 flags that determine the behavior of the floating cta:
// 1. Presence of Hero cta button
// - If there is no Hero cta button, then the floating cta is always visible.
// - Otherwise, its visibility depends on the Hero cta visibility.
// 2. Phase of the campaign (Teaser or Live)
// By default, it is in Teaser phase and the floating cta has only the orange-button class.
// If the block has the 'live' class, then it is in Live phase and gets also the glowy class.

/**
 * Validates the required elements inside the block.
 * @param {HTMLElement} block The floating-cta block element.
 * @returns {boolean} True if validation passes, false otherwise.
 * @description
 * This function checks for the presence of necessary elements within the floating-cta block.
 * title and disclaimer are optional. the button is required.
*/
function validateElements(block) {
  const button = block.querySelector('.button');
  // Validate mandatory elements
  if (!button) {
    console.error('Floating CTA block validation failed: Missing required %c.button%c element.', 'color: red', '');
    return false;
  }
  // Validate text lengths
  const title = block.querySelector('p:first-of-type:not(.button-container)');
  const disclaimer = block.querySelector('p:last-of-type:not(.button-container)');

  if (title && title.textContent.length > MAX_TITLE_LENGTH) {
    console.error(`Floating CTA block validation failed: Title text exceeds maximum length of %c${MAX_TITLE_LENGTH}%c characters.`, 'color: red;', '');
  }

  if (button.textContent.length > MAX_BUTTON_LENGTH) {
    console.error(`Floating CTA block validation failed: Button text exceeds maximum length of %c${MAX_BUTTON_LENGTH}%c characters.`, 'color: red;', '');
  }

  if (disclaimer && disclaimer.textContent.length > MAX_DISCLAIMER_LENGTH) {
    console.error(`Floating CTA block validation failed: Disclaimer text exceeds maximum length of %c${MAX_DISCLAIMER_LENGTH}%c characters.`, 'color: red;', '');
  }
  return true;
}

function buildElement(block, isLivePhase = false) {
  const newBlockContainer = createElement('div', { className: blockClasses.newContainer });
  const button = block.querySelector('.button-container');
  const buttonWrapper = createElement('div', { className: `${blockName}__cta orange-button${isLivePhase ? ' glowy' : ''}` });
  const title = block.querySelector('p:first-of-type:not(.button-container)');
  const disclaimer = block.querySelector('p:last-of-type:not(.button-container)');

  buttonWrapper.appendChild(button);
  newBlockContainer.appendChild(buttonWrapper);

  if (title) {
    title.classList.add(blockClasses.title);
    newBlockContainer.prepend(title);
  }

  if (disclaimer) {
    disclaimer.classList.add(blockClasses.disclaimer);
    newBlockContainer.appendChild(disclaimer);
  }

  return newBlockContainer;
}

function cleanCurrentBlock(block) {
  const section = block.closest('.section');
  const blockWrapper = section.querySelector(`.${blockClasses.wrapper}`);
  section.classList.remove(blockClasses.container);
  blockWrapper.remove();

  if (section.children.length === 0) {
    section.remove();
  }
}

export default function decorate(block) {
  const heroBlock = block.closest('main').querySelector('.hero');
  const heroCta = !!heroBlock && heroBlock.querySelector('.button');
  // if true, then floating cta visibility depends on hero cta visibility
  const heroCtaExists = !!heroCta;
  // if true, then is Live phase (Teaser by default, Live if block has 'live' class)
  const isLivePhase = block.classList.contains('live');

  if (!validateElements(block)) return;
  const newBlockContainer = buildElement(block, isLivePhase);
  cleanCurrentBlock(block);
  if (heroCtaExists) {
    // floating cta visibility depends on hero cta visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          newBlockContainer.classList.toggle('hidden', entry.isIntersecting);
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(heroBlock);
  }

  if (isLivePhase) {
    newBlockContainer.addEventListener('click', (e) => {
      e.preventDefault();
      openPersonalizedHub();
    });
  }

  // add buttons styles
  addVariantLogic({ useButtons: true });
  document.body.appendChild(newBlockContainer);
}
