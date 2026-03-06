import { createElement } from '@scripts/common.js';
import { createOptimizedPicture } from '@scripts/aem.js';

function convertHeadingsToH2(block) {
  block.querySelectorAll('h1, h3, h4, h5, h6').forEach((heading) => {
    const h2 = createElement('h2', { attributes: { id: heading.id } });
    while (heading.firstChild) {
      h2.appendChild(heading.firstChild);
    }
    heading.replaceWith(h2);
  });
}

/**
 * @param {HTMLElement} block The teaser-block element.
 */
export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div');

  const mediaWrapper = createElement('div', { className: 'media-wrapper' });
  const picture = inner.querySelector('picture');
  const img = picture.querySelector('img');
  picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  mediaWrapper.append(picture);

  convertHeadingsToH2(inner);
  const heading = inner.querySelector('h2');
  const description = inner.querySelector('h2+p');

  const headingWrapper = createElement('div', { className: 'teaser-heading' });
  headingWrapper.append(heading, description);

  const buttonContainer = inner.querySelector('.button-container');

  block.textContent = '';
  block.append(mediaWrapper, headingWrapper, buttonContainer);
}
