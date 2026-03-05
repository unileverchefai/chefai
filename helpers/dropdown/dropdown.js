import { createElement } from '@scripts/common.js';

const CHEVRON_SVG = `
  <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 5L11 1" stroke="#131313" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

/**
 * Creates an accessible dropdown filter with toggle, keyboard, and outside-click behaviour.
 *
 * @param {Array<{label: string, value: string}>} options
 *   Full list of options; first item is the pre-selected entry.
 * @param {Function} onSelect Called with the selected value string.
 * @param {Object}   [classes]
 *   Block-specific class names keyed by: filter, button, text, arrow, menu, option.
 * @returns {{ element: HTMLElement }}
 */
export default function createDropdown({ options, onSelect, classes = {} }) {
  const cls = {
    filter: classes.filter ?? 'dropdown-filter',
    button: classes.button ?? 'dropdown-button',
    text: classes.text ?? 'dropdown-text',
    arrow: classes.arrow ?? 'dropdown-arrow',
    menu: classes.menu ?? 'dropdown-menu',
    option: classes.option ?? 'dropdown-option',
  };

  const defaultLabel = options[0]?.label ?? '';

  const filter = createElement('div', { className: cls.filter });

  const button = createElement('button', {
    className: cls.button,
    attributes: {
      'aria-label': `Filter by ${defaultLabel}`,
      'aria-expanded': 'false',
      'aria-haspopup': 'listbox',
    },
    innerContent: `
      <span class="${cls.text}">${defaultLabel}</span>
      <span class="${cls.arrow}">${CHEVRON_SVG}</span>
    `,
  });

  const menu = createElement('div', {
    className: cls.menu,
    attributes: { role: 'listbox', 'aria-hidden': 'true' },
  });

  options.forEach(({ label, value }, index) => {
    const el = createElement('div', {
      className: cls.option,
      attributes: {
        role: 'option',
        'aria-selected': index === 0 ? 'true' : 'false',
        'data-value': value,
      },
      innerContent: label,
    });
    if (index === 0) el.classList.add('active');
    menu.appendChild(el);
  });

  filter.appendChild(button);
  filter.appendChild(menu);

  const optionEls = [...menu.querySelectorAll(`.${cls.option}`)];
  let isOpen = false;

  const toggleDropdown = () => {
    isOpen = !isOpen;
    filter.classList.toggle('open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  };

  const closeDropdown = () => {
    if (!isOpen) return;
    isOpen = false;
    filter.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  };

  const selectOption = (el) => {
    optionEls.forEach((opt) => {
      opt.classList.remove('active');
      opt.setAttribute('aria-selected', 'false');
    });
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');
    button.querySelector(`.${cls.text}`).textContent = el.textContent.trim();
    closeDropdown();
    onSelect(el.getAttribute('data-value'));
  };

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  menu.addEventListener('click', (e) => {
    const el = e.target.closest(`.${cls.option}`);
    if (el) selectOption(el);
  });

  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!filter.contains(e.target)) closeDropdown();
  });

  return { element: filter };
}
