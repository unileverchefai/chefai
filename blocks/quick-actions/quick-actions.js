import { createElement } from '@scripts/common.js';
import openChatbotModal from '@helpers/chatbot/openChatbotModal.js';
import {
  setCookie,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  getAnonymousUserId,
  createThread,
} from '@helpers/chatbot/utils.js';
import { fetchQuickActions } from './constants/api.js';

async function ensureQuickActionThread(recommendationKey, headlineText) {
  const storageKey = `chefai-quick-action-thread-${recommendationKey}`;

  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.threadId) {
        setCookie('chef-ai-thread-id', parsed.threadId);
        return {
          threadId: parsed.threadId,
          isNew: false,
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  let userId = getUserIdFromCookie() ?? getAnonymousUserIdFromCookie();

  if (!userId) {
    userId = await getAnonymousUserId();
  }

  const threadId = await createThread(userId);

  try {
    const payload = JSON.stringify({
      threadId,
      initialized: true,
      headlineText,
    });
    sessionStorage.setItem(storageKey, payload);
    sessionStorage.setItem(`chefai-quick-action-headline-${threadId}`, headlineText);
  } catch {
    // ignore storage errors
  }

  return {
    threadId,
    isNew: true,
  };
}

function renderCard(item, index, onActivate) {
  const card = createElement('li', {
    className: 'card quick-action-card',
    attributes: {
      'data-item-id': item.id ?? `quick-action-${index}`,
      'data-node-id': `quick-action-card-${index}`,
      role: 'button',
      tabindex: '0',
    },
  });

  const text = createElement('div', {
    className: 'quick-action-text',
  });
  text.textContent = item.display_text ?? item.title ?? `Action ${index + 1}`;

  const arrow = createElement('span', {
    className: 'quick-action-arrow',
    innerContent: '→',
  });

  card.appendChild(text);
  card.appendChild(arrow);

  const handleActivate = () => {
    if (typeof onActivate === 'function') {
      onActivate(item);
    }
  };

  card.addEventListener('click', handleActivate);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  });

  return card;
}

export default function decorate(block) {
  block.classList.add('quick-actions');

  const userId = block.dataset.userId ?? 'staging-user';
  const limit = parseInt(block.dataset.limit ?? '4', 10);

  block.innerHTML = '';

  const list = createElement('ul', {
    className: 'quick-actions-list',
    attributes: {
      role: 'list',
    },
  });

  const loading = createElement('div', {
    className: 'quick-actions-loading',
  });
  loading.textContent = 'Loading quick actions...';

  block.appendChild(loading);
  block.appendChild(list);

  const handleCardActivate = async (item) => {
    const messageText = item.display_text ?? item.title ?? '';
    const recommendationKey = item.id
      ?? item.recommendation_id
      ?? messageText
      ?? 'quick-action';

    let isNewThread = false;

    try {
      const result = await ensureQuickActionThread(recommendationKey, messageText);
      isNewThread = result?.isNew ?? false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to prepare quick action thread:', error);
    }

    openChatbotModal()
      .then(() => {
        if (!messageText || !isNewThread) return;

        setTimeout(() => {
          const event = new CustomEvent('chefai:quick-action', {
            detail: {
              message: messageText,
              recommendation: item,
            },
          });
          window.dispatchEvent(event);
        }, 400);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to open chatbot from quick action:', error);
      });
  };

  fetchQuickActions({ userId, limit })
    .then((items) => {
      loading.remove();

      if (!items || items.length === 0) {
        const empty = createElement('div', {
          className: 'quick-actions-empty',
        });
        empty.textContent = 'No quick actions available.';
        block.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        list.appendChild(renderCard(item, index, handleCardActivate));
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load quick actions:', error);
      loading.remove();
      const errorState = createElement('div', {
        className: 'quick-actions-error',
      });
      errorState.textContent = 'Failed to load quick actions.';
      block.appendChild(errorState);
    });
}
