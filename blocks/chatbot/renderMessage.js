const { createElement: h } = window.React;

const USER_ID = 1;

export default function renderMessage(message) {
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
            backgroundColor: isUser ? 'var(--link-color)' : 'var(--light-color)',
            color: isUser ? 'var(--background-color)' : 'var(--text-color)',
          },
        },
        [
          h(
            'div',
            {
              style: {
                fontFamily: 'var(--body-font-family)',
                fontSize: 'var(--body-font-size-s)',
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
                fontSize: 'var(--body-font-size-xs)',
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
