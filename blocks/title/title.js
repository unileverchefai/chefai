import { createElement } from '../../scripts/common.js';

function convertHeadingsToH2(block) {
  block.querySelectorAll('h1, h3, h4, h5, h6').forEach((heading) => {
    const h2 = createElement('h2', { attributes: { id: heading.id } });
    while (heading.firstChild) {
      h2.appendChild(heading.firstChild);
    }
    heading.replaceWith(h2);
  });
}

function mergeConsecutiveH2(block) {
  const h2Elements = block.querySelectorAll('h2');

  h2Elements.forEach((firstH2, i) => {
    const secondH2 = h2Elements[i + 1];
    if (!secondH2) return;

    const areSiblings = firstH2.nextElementSibling === secondH2
      || (firstH2.parentElement.nextElementSibling?.querySelector('h2') === secondH2);

    if (areSiblings) {
      firstH2.appendChild(createElement('br'));

      while (secondH2.firstChild) {
        firstH2.appendChild(secondH2.firstChild);
      }

      secondH2.remove();
    }
  });
}

function wrapSubtitles(block) {
  block.querySelectorAll('h2').forEach((h2) => {
    if (h2.querySelector('.subtitle')) return;

    const br = h2.querySelector('br');
    if (!br) return;

    const fragment = document.createDocumentFragment();
    let node = br.nextSibling;

    while (node) {
      const { nextSibling } = node;
      fragment.appendChild(node);
      node = nextSibling;
    }

    if (fragment.hasChildNodes()) {
      const span = createElement('span', { className: 'subtitle' });
      span.appendChild(fragment);
      br.after(span);
    }
  });
}

export default function decorate(block) {
  convertHeadingsToH2(block);
  mergeConsecutiveH2(block);
  wrapSubtitles(block);
}
