import { createElement } from '@scripts/common.js';
import openChatbotModal from '@helpers/chatbot/openChatbotModal.js';
import {
  setCookie,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  getAnonymousUserId,
  createThreadWithRecommendation,
} from '@scripts/custom/utils.js';
import { fetchQuickActions } from './constants/api.js';

async function ensureQuickActionThread(recommendationId) {
  const storageKey = `chefai-quick-action-thread-${recommendationId}`;

  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed?.threadId) {
      setCookie('chef-ai-thread-id', parsed.threadId);
      return {
        threadId: parsed.threadId,
        displayText: parsed.displayText ?? '',
        isNew: false,
      };
    }
  }

  let userId = getUserIdFromCookie() ?? getAnonymousUserIdFromCookie();
  if (!userId) {
    userId = await getAnonymousUserId();
  }

  const { threadId, displayText } = await createThreadWithRecommendation(userId, recommendationId);

  sessionStorage.setItem(storageKey, JSON.stringify({
    threadId,
    displayText,
    initialized: true,
  }));
  sessionStorage.setItem(`chefai-quick-action-headline-${threadId}`, displayText);

  return {
    threadId,
    displayText: displayText ?? '',
    isNew: true,
  };
}

function renderCard(item, index, onActivate) {
  const recommendationId = item.id ?? item.recommendation_id ?? '';
  const card = createElement('li', {
    className: 'card quick-action-card',
    attributes: {
      'data-recommendation-id': recommendationId,
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
    const recommendationId = item.id ?? item.recommendation_id ?? '';
    if (!recommendationId) {
      return;
    }

    let result = { isNew: false, displayText: '' };
    try {
      result = await ensureQuickActionThread(recommendationId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to prepare quick action thread:', error);
    }

    openChatbotModal()
      .then(() => {
        if (result.isNew && result.displayText) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chefai:quick-action', {
              detail: { displayText: result.displayText },
            }));
          }, 400);
        }
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
