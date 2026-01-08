/**
 * Chef AI Chat Widget
 * React-based chat interface for Chef AI assistant
 */

import chefAiService from './services/chefAiService.js';

const {
  useState, useCallback, useEffect, useRef,
} = window.React;
const { createElement: h } = window.React;

const USER_ID = 1;
const AI_ID = 2;
const MESSAGE_CONTEXT_LIMIT = 5;

const WELCOME_MESSAGE = {
  _id: '1',
  text: 'Hello! I\'m your Chef AI assistant. I can help you with menu planning, recipe ideas, cost optimization, and culinary trends. How can I assist you today?',
  createdAt: new Date(),
  user: {
    _id: AI_ID,
    name: 'Chef AI',
  },
};

/**
 * Chat Widget Component
 * @returns {ReactElement} Chat widget UI
 */
export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with history or welcome message
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chefAiService.getHistory();
        setMessages(history.length > 0 ? history : [WELCOME_MESSAGE]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load history:', err);
        setMessages([WELCOME_MESSAGE]);
      }
    };

    loadHistory();
  }, []);

  // Save messages to history whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      chefAiService.saveHistory(messages);
    }
  }, [messages]);

  /**
   * Handle sending messages
   */
  const handleSend = useCallback(async (e) => {
    e.preventDefault();

    const messageText = inputValue.trim();
    if (!messageText) {
      return;
    }

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
      const response = await chefAiService.sendMessage(messageText, {
        context: {
          messageHistory: messages.slice(-MESSAGE_CONTEXT_LIMIT),
        },
      });

      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Failed to send message:', err);

      setError('Sorry, I\'m having trouble connecting. Please try again.');

      const errorMessage = {
        _id: Date.now().toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        createdAt: new Date(),
        user: {
          _id: AI_ID,
          name: 'Chef AI',
        },
        system: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, messages]);

  /**
   * Render a single message
   * @param {object} message - Message object
   * @returns {ReactElement} Message element
   */
  const renderMessage = (message) => {
    const isUser = message.user._id === USER_ID;

    return h('div', {
      key: message._id,
      className: `chat-message ${isUser ? 'user-message' : 'ai-message'}`,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      },
    }, [
      h('div', {
        className: 'message-bubble',
        style: {
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '20px',
          backgroundColor: isUser ? '#3b63fb' : '#f0f0f0',
          color: isUser ? '#ffffff' : '#131313',
        },
      }, [
        h('div', {
          style: {
            fontFamily: 'var(--body-font-family)',
            fontSize: '16px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
          },
        }, message.text),
        h('div', {
          style: {
            fontSize: '12px',
            opacity: 0.7,
            marginTop: '4px',
          },
        }, new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })),
      ]),
    ]);
  };

  return h('div', {
    className: 'chat-widget',
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
    },
  }, [
    error && h('div', {
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
    }, error),

    h('div', {
      key: 'messages',
      className: 'chat-messages',
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      },
    }, [
      ...messages.map(renderMessage),
      isTyping && h('div', {
        key: 'typing',
        className: 'typing-indicator',
        style: {
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#666',
          fontStyle: 'italic',
        },
      }, 'Chef AI is typing...'),
      h('div', { key: 'scroll-anchor', ref: messagesEndRef }),
    ]),

    h('form', {
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
    }, [
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
      h('button', {
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
      }, '→'),
    ]),
  ]);
}
