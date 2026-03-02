import { createElement } from '@scripts/common.js';

function validateElements({ block, title, mediaWrapper }) {
  // validate block structure
  const blockRows = block.querySelectorAll(':scope > div');
  if (blockRows.length < 2) {
    console.error('Trend hero variant: block structure is invalid. Please make sure to have at least two rows in the block: the first one for the title and the second one for the media.');
    return false;
  }

  // title is mandatory
  if (!title) {
    console.error('Trend hero variant: %ctitle%c element is missing. Please make sure to include an %cH1%c title in the first row of the block.', 'color: red;', '', 'color: orange;', '');
    return false;
  }

  // media is mandatory
  if (!mediaWrapper) {
    console.error('Trend hero variant: %cmedia%c element is missing. Please make sure to include a media element in the second row of the block.', 'color: red;', '');
    return false;
  }
  return true;
}

export default async function buildTrendVariant({ block, variant }) {
  const title = block.querySelector(':scope > div:first-child > div > h1');
  const mediaWrapper = block.querySelector(':scope > div:nth-child(2) > div');
  // fist row: just title. grab it to the template
  // second row: media. could be image or image + video link.
  // third row: used for background images on the first row. optional

  if (!validateElements({ block, title, mediaWrapper })) {
    return;
  }

  const blockClasses = {
    wrapper: `${variant}--wrapper`,
    background: `${variant}--background`,
    media: `${variant}--media`,
    title: `${variant}--title`,
    titleText: `${variant}--title-text`,
  };

  const trendTemplate = `
    <div class="${blockClasses.background}"></div>
    <div class="${blockClasses.media}"></div>
  `;

  const trendWrapper = createElement('div', {
    className: blockClasses.wrapper,
    innerContent: trendTemplate,
  });

  const backgroundArea = trendWrapper.querySelector(`.${blockClasses.background}`);
  const titleTextWrapper = createElement('span', {
    className: blockClasses.titleText,
    innerContent: title.innerHTML,
  });
  title.innerHTML = '';
  title.appendChild(titleTextWrapper);
  title.classList.add(blockClasses.title);
  backgroundArea.appendChild(title);

  const mediaArea = trendWrapper.querySelector(`.${blockClasses.media}`);
  const pictureEl = mediaWrapper.querySelector('picture');
  if (pictureEl) {
    mediaArea.appendChild(pictureEl);
  }

  block.innerHTML = '';
  block.appendChild(trendWrapper);
}
