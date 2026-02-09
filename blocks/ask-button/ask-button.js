import openChatbotModal from '@helpers/chatbot/openChatbotModal.js';
import { createElement } from '@scripts/common.js';
import {
  setCookie,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  getAnonymousUserId,
  createThread,
} from '@helpers/chatbot/utils.js';

/**
 * Ask Button Block
 * Fixed position button at the bottom of the page that opens the chatbot modal
 */
export default function decorate(block) {
  block.textContent = '';

  // Wrapper element that wraps all inner content
  const wrapper = createElement('div', { className: 'ask-button-wrapper' });

  // Gradient border effect container
  const gradientBorder = createElement('div', { className: 'border' });

  // Main button
  const button = createElement('button', {
    className: 'btn',
    attributes: { 'aria-label': 'Ask me anything - Open chatbot' },
  });

  // Button content container
  const buttonContent = createElement('div', { className: 'content' });

  // Sparkles icon
  const icon = createElement('img', {
    className: 'icon',
    attributes: {
      src: '/icons/sparkles-icon.svg',
      alt: '',
      width: '22',
      height: '22',
    },
  });

  // Button text
  const text = createElement('span', {
    className: 'text',
    innerContent: 'Ask me anything',
  });

  // Assemble button - text first, then icon (icon on the right per Figma)
  buttonContent.appendChild(text);
  buttonContent.appendChild(icon);
  button.appendChild(buttonContent);

  // Add inset shadow overlay
  const shadowOverlay = createElement('div', { className: 'shadow' });
  button.appendChild(shadowOverlay);

  // Click handler - open chatbot on a dedicated main chat thread
  button.addEventListener('click', async () => {
    try {
      const storageKey = 'chefai-main-chat-thread';
      const stored = sessionStorage.getItem(storageKey);
      let threadId = stored ? JSON.parse(stored)?.threadId ?? null : null;

      if (!threadId) {
        let userId = getUserIdFromCookie() ?? getAnonymousUserIdFromCookie();
        if (!userId) {
          userId = await getAnonymousUserId();
        }

        threadId = await createThread(userId);

        sessionStorage.setItem(storageKey, JSON.stringify({
          threadId,
          initialized: true,
        }));
      }

      setCookie('chef-ai-thread-id', threadId);

      await openChatbotModal();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open chatbot:', error);
    }
  });

  // Assemble structure - wrap all content in wrapper
  wrapper.appendChild(gradientBorder);
  wrapper.appendChild(button);
  block.appendChild(wrapper);
}
