/**
 * Chef AI Chat Widget
 * Simple React chat interface without external dependencies
 * Note: React is loaded from CDN and available as window.React
 */

import chefAiService from './services/chefAiService.js';

// Use React from global window object (loaded from CDN)
const {
  useState, useCallback, useEffect, useRef,
} = window.React;
const { createElement: h } = window.React;

// eslint-disable-next-line no-console
console.log('React hooks:', {
  useState, useCallback, useEffect, useRef,
});

/**
 * ChatWidget functional component
 */
export default function ChatWidget() {
  // eslint-disable-next-line no-console
  console.log('ChatWidget component rendering...');

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // eslint-disable-next-line no-console
  console.log('Current inputValue:', inputValue);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chefAiService.getHistory();

        if (history.length > 0) {
          setMessages(history);
        } else {
          // Welcome message
          const welcomeMessage = {
            _id: '1',
            text: 'Hello! I\'m your Chef AI assistant. I can help you with menu planning, recipe ideas, cost optimization, and culinary trends. How can I assist you today?',
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Chef AI',
            },
          };
          setMessages([welcomeMessage]);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load history:', err);
        const welcomeMessage = {
          _id: '1',
          text: 'Hello! I\'m your Chef AI assistant. How can I help you today?',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Chef AI',
          },
        };
        setMessages([welcomeMessage]);
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

    // eslint-disable-next-line no-console
    console.log('handleSend called, input value:', inputValue);

    const messageText = inputValue.trim();
    if (!messageText) {
      // eslint-disable-next-line no-console
      console.log('Message is empty, returning');
      return;
    }

    // Create user message
    const userMessage = {
      _id: Date.now().toString(),
      text: messageText,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: 'You',
      },
    };

    // Add user message and clear input
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);

    try {
      // Show typing indicator
      setIsTyping(true);

      // Send message to Chef AI API
      const response = await chefAiService.sendMessage(messageText, {
        context: {
          messageHistory: messages.slice(-5), // Last 5 messages for context
        },
      });

      // Add AI response
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', err);

      // Show error message
      setError('Sorry, I\'m having trouble connecting. Please try again.');

      // Add error message to chat
      const errorMessage = {
        _id: Date.now().toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        createdAt: new Date(),
        user: {
          _id: 2,
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
   */
  const renderMessage = (message) => {
    const isUser = message.user._id === 1;

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
