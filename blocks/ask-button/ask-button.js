import openPersonalizedHub from '../personalized-hub/personalized-hub.js';

/**
 * Ask Button Block
 * Fixed position button at the bottom of the page that opens the personalized hub modal
 */
export default function decorate(block) {
  block.textContent = '';

  // Wrapper element that wraps all inner content
  const wrapper = document.createElement('div');
  wrapper.className = 'ask-button-wrapper';

  // Gradient border effect container
  const gradientBorder = document.createElement('div');
  gradientBorder.className = 'border';

  // Main button
  const button = document.createElement('button');
  button.className = 'btn';
  button.setAttribute('aria-label', 'Ask me anything - Open personalized hub');

  // Button content container
  const buttonContent = document.createElement('div');
  buttonContent.className = 'content';

  // Sparkles icon
  const icon = document.createElement('img');
  icon.src = '/icons/sparkles-icon.svg';
  icon.alt = '';
  icon.className = 'icon';
  icon.width = 22;
  icon.height = 22;

  // Button text
  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = 'Ask me anything';

  // Assemble button - text first, then icon (icon on the right per Figma)
  buttonContent.appendChild(text);
  buttonContent.appendChild(icon);
  button.appendChild(buttonContent);

  // Add inset shadow overlay
  const shadowOverlay = document.createElement('div');
  shadowOverlay.className = 'shadow';
  button.appendChild(shadowOverlay);

  // Click handler
  button.addEventListener('click', () => {
    openPersonalizedHub();
  });

  // Assemble structure - wrap all content in wrapper
  wrapper.appendChild(gradientBorder);
  wrapper.appendChild(button);
  block.appendChild(wrapper);
}
