import sendMessage from './sendMessage.js';
import {
  getHistory,
  saveHistory,
} from './utils.js';
import renderChatUI from './renderChatUI.js';

const {
  useState,
  useCallback,
  useEffect,
  useRef,
} = window.React;

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
  const history = getHistory();
  const [messages, setMessages] = useState(history.length > 0 ? history : [WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const disabled = !inputValue.trim() || isTyping;

  return renderChatUI({
    error,
    messages,
    isTyping,
    messagesEndRef,
    inputValue,
    setInputValue,
    handleSend,
    disabled,
  });
}
