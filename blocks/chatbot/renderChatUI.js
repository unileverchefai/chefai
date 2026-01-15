import renderMessage from './renderMessage.js';
import ChatInput from './ChatInput.js';

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
            color: 'var(--error)',
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
      h(ChatInput, {
        key: 'input',
        value: inputValue,
        onChange: setInputValue,
        onSubmit: handleSend,
        placeholder: 'Type your message here...',
        disabled: isTyping,
        submitDisabled: disabled,
      }),
    ],
  );
}
