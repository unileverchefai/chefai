import sendMessage from './sendMessage.js';
import {
  getHistory,
  saveHistory,
  renderMessage,
} from './utils.js';

const {
  useState,
  useCallback,
  useEffect,
  useRef,
} = window.React;
const { createElement: h } = window.React;

const USER_ID = 1;
const AI_ID = 2;
const WELCOME_MESSAGE = {
  _id: '1',
  text: 'Hello! I\'m your Chef AI assistant. I can help you with menu planning, recipe ideas, cost optimization, and culinary trends. How can I assist you today?',
  createdAt: new Date(),
  user: {
    _id: AI_ID,
    name: 'Chef AI',
  },
};

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    const history = getHistory();
    setMessages(history.length > 0 ? history : [WELCOME_MESSAGE]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) saveHistory(messages);
  }, [messages]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const messageText = inputValue.trim();
    if (!messageText) return;

    const userMessage = {
      _id: Date.now().toString(),
      text: messageText,
      createdAt: new Date(),
      user: {
        _id: USER_ID,
        name: 'You',
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setIsTyping(true);

    try {
      const response = await sendMessage(messageText, {
        context: {
          messageHistory: messages.slice(-5),
        },
      });
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', err);
      setError('Sorry, I\'m having trouble connecting. Please try again.');
      setMessages((prev) => [...prev, {
        _id: Date.now().toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        createdAt: new Date(),
        user: {
          _id: AI_ID,
          name: 'Chef AI',
        },
        system: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, messages]);

  return h(
    'div',
    {
      className: 'chat-widget',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
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
            fontSize: '14px',
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
                color: '#666',
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
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f8f8f8',
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
              border: '1px solid #e0e0e0',
              fontSize: '16px',
              fontFamily: 'var(--body-font-family)',
              outline: 'none',
            },
          }),
          h(
            'button',
            {
              key: 'send',
              type: 'submit',
              disabled: !inputValue.trim() || isTyping,
              style: {
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: inputValue.trim() && !isTyping ? '#3b63fb' : '#ccc',
                color: '#ffffff',
                fontSize: '20px',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
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
