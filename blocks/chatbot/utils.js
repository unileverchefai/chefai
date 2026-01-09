export function getThreadId() {
  let threadId = sessionStorage.getItem('chef-ai-thread-id');
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('chef-ai-thread-id', threadId);
  }
  return threadId;
}

export function formatResponse(apiResponse) {
  let messageText = apiResponse.response?.message
    || (typeof apiResponse.response === 'string' ? apiResponse.response : 'I received your message. How can I help you further?');

  if (apiResponse.response?.recipes?.length > 0) {
    messageText += '\n\n📚 Recipes:\n';
    apiResponse.response.recipes.forEach((recipe, index) => {
      messageText += `\n${index + 1}. ${recipe.title_in_user_language || recipe.title_in_original_language}`;
      if (recipe.description) messageText += `\n   ${recipe.description}`;
      if (recipe.url) messageText += `\n   🔗 ${recipe.url}`;
    });
  }

  return {
    _id: apiResponse.message_id || `msg_${Date.now()}`,
    text: messageText,
    createdAt: new Date(apiResponse.timestamp || Date.now()),
    user: {
      _id: 2,
      name: 'Chef AI',
      avatar: '/icons/chef-ai-avatar.svg',
    },
    metadata: {
      run_id: apiResponse.run_id,
      thread_id: apiResponse.thread_id,
      recipes: apiResponse.response?.recipes || [],
    },
  };
}

export function getHistory() {
  try {
    const history = sessionStorage.getItem('chef-ai-history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages) {
  try {
    sessionStorage.setItem('chef-ai-history', JSON.stringify(messages));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to save history:', err);
  }
}

export function renderMessage(message) {
  const { createElement: h } = window.React;
  const USER_ID = 1;
  const isUser = message.user._id === USER_ID;

  return h(
    'div',
    {
      key: message._id,
      className: `chat-message ${isUser ? 'user-message' : 'ai-message'}`,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      },
    },
    [
      h(
        'div',
        {
          className: 'message-bubble',
          style: {
            maxWidth: '70%',
            padding: '12px 16px',
            borderRadius: '20px',
            backgroundColor: isUser ? '#3b63fb' : '#f0f0f0',
            color: isUser ? '#ffffff' : '#131313',
          },
        },
        [
          h(
            'div',
            {
              style: {
                fontFamily: 'var(--body-font-family)',
                fontSize: '16px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
              },
            },
            message.text,
          ),
          h(
            'div',
            {
              style: {
                fontSize: '12px',
                opacity: 0.7,
                marginTop: '4px',
              },
            },
            new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          ),
        ],
      ),
    ],
  );
}

export async function loadReact() {
  if (window.React && window.ReactDOM) return;
  if (!window.React) await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  if (!window.ReactDOM) await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
