export default function decorate(block) {
  const children = Array.from(block.children);

  // media section
  const mediaSection = children[0];
  if (mediaSection) {
    mediaSection.classList.add('media-title');

    const h2 = mediaSection.querySelector('h2');
    const picture = h2?.querySelector('picture');
    if (picture) {
      const pictureClone = picture.cloneNode(true);
      mediaSection.insertBefore(pictureClone, mediaSection.firstChild);

      picture.remove();
    }
  }

  // cards-text section
  const textCards = children.slice(1);

  if (textCards.length > 0) {
    // wrapper for text cards
    const cardsTextSection = document.createElement('div');
    cardsTextSection.classList.add('cards-text');

    textCards.forEach((card) => {
      const innerDiv = card.querySelector('div');
      if (innerDiv) {
        const h4 = innerDiv.querySelector('h4');
        const p = innerDiv.querySelector('p');
        const picture = h4?.querySelector('picture');

        if (h4 && picture) {
          const textWrapper = document.createElement('div');

          picture.remove();
          textWrapper.appendChild(h4);

          if (p) {
            textWrapper.appendChild(p);
          }

          innerDiv.innerHTML = '';

          const h4Wrapper = document.createElement('h4');
          h4Wrapper.appendChild(picture);

          innerDiv.appendChild(h4Wrapper);
          innerDiv.appendChild(textWrapper);
        }
      }

      cardsTextSection.appendChild(card);
    });

    block.appendChild(cardsTextSection);
  }
}
