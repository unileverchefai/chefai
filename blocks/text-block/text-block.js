import { createElement } from '@scripts/common.js';

/**
 * Converts any non-h3 headings to h3 to maintain semantic hierarchy.
 * h3 is the canonical heading level for this block (title block uses h2).
 * @param {HTMLElement} block The block element to sanitize.
 */
function convertHeadingsToH3(block) {
  block.querySelectorAll('h1, h2, h4, h5, h6').forEach((heading) => {
    const h3 = createElement('h3', { attributes: { id: heading.id } });
    while (heading.firstChild) {
      h3.appendChild(heading.firstChild);
    }
    heading.replaceWith(h3);
  });
}

/**
 * Converts broken links (missing or empty href) to plain text spans.
 * @param {HTMLElement} block The block element to sanitize.
 */
function sanitizeLinks(block) {
  block.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.trim() === '') {
      const span = createElement('span');
      while (link.firstChild) {
        span.appendChild(link.firstChild);
      }
      link.replaceWith(span);
    }
  });
}

/**
 * Decorates the text-block by sanitizing content and wrapping it
 * in a semantic .text-content container.
 * @param {HTMLElement} block The text-block element.
 */
export default function decorate(block) {
  if (!block.textContent.trim()) {
    block.closest('.text-block-wrapper')?.remove();
    return;
  }

  convertHeadingsToH3(block);
  sanitizeLinks(block);

  const contentWrapper = createElement('div', { className: 'text-content' });
  const inner = block.querySelector(':scope > div > div');

  if (inner) {
    while (inner.firstChild) {
      contentWrapper.appendChild(inner.firstChild);
    }
  }

  block.textContent = '';
  block.appendChild(contentWrapper);
}
