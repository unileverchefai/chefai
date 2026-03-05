import renderMessage from './MessageBubble.js';
import ChatInput from '../../chatInput/ChatInput.js';

export default function renderChatUI({
  error,
  messages,
  isTyping,
  inputValue,
  setInputValue,
  handleSend,
  disabled,
  onPromptClick,
}) {
  const { createElement: h } = window.React;
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
            scrollBehavior: 'smooth',
          },
        },
        [
          ...messages.map((msg) => renderMessage(msg, { onPromptClick })),
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
      h(
        'div',
        {
          key: 'scroll-button',
          className: 'chatbot-modal-scroll-button',
        },
      ),
    ],
  );
}
