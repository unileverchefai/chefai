import renderMessage from './renderMessage.js';

const { createElement: h } = window.React;

export default function renderChatUI({
  error,
  messages,
  isTyping,
  messagesEndRef,
  inputValue,
  setInputValue,
  handleSend,
  disabled,
}) {
  return h(
    'div',
    {
      className: 'chat-widget',
      style: {
        height: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background-color)',
      },
    },
    [
      error && h(
        'div',
        {
          key: 'error',
          className: 'chat-error',
          style: {
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            padding: '12px',
            textAlign: 'center',
            fontSize: 'var(--body-font-size-xs)',
            fontFamily: 'var(--body-font-family)',
          },
        },
        error,
      ),
      h(
        'div',
        {
          key: 'messages',
          className: 'chat-messages',
          style: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          },
        },
        [
          ...messages.map(renderMessage),
          isTyping && h(
            'div',
            {
              key: 'typing',
              className: 'typing-indicator',
              style: {
                padding: '12px 16px',
                marginBottom: '16px',
                color: 'var(--dark-color)',
                fontStyle: 'italic',
              },
            },
            'Chef AI is typing...',
          ),
          h('div', {
            key: 'scroll-anchor',
            ref: messagesEndRef,
          }),
        ],
      ),
      h(
        'form',
        {
          key: 'input-form',
          className: 'chat-input-form',
          onSubmit: handleSend,
          style: {
            padding: '16px',
            borderTop: '1px solid var(--light-color)',
            backgroundColor: 'var(--light-color)',
            display: 'flex',
            gap: '8px',
          },
        },
        [
          h('input', {
            key: 'input',
            type: 'text',
            value: inputValue,
            onChange: (e) => setInputValue(e.target.value),
            placeholder: 'Type your message here...',
            disabled: isTyping,
            style: {
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid var(--light-color)',
              fontSize: 'var(--body-font-size-s)',
              fontFamily: 'var(--body-font-family)',
              outline: 'none',
            },
          }),
          h(
            'button',
            {
              key: 'send',
              type: 'submit',
              disabled,
              style: {
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: !disabled ? 'var(--link-color)' : '#ccc',
                color: 'var(--background-color)',
                fontSize: '20px',
                cursor: !disabled ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
            '→',
          ),
        ],
      ),
    ],
  );
}
