export default function decorate(block) {
  // Wrap text after <br> tag in a span for styling
  const h2Elements = block.querySelectorAll('h2');
  h2Elements.forEach((h2) => {
    // Avoid re-wrapping if decorator runs more than once
    if (h2.querySelector('.subtitle')) return;

    // Only use the first <br> if multiple exist
    const br = h2.querySelector('br');
    if (!br) return;

    // Collect everything after the chosen <br>
    const fragment = document.createDocumentFragment();
    let node = br.nextSibling;
    while (node) {
      const { nextSibling } = node;
      fragment.appendChild(node);
      node = nextSibling;
    }
    // Only create span if there's content after the br
    if (fragment.hasChildNodes()) {
      const span = document.createElement('span');
      span.className = 'subtitle';
      span.appendChild(fragment);
      br.after(span);
    }
  });
}
