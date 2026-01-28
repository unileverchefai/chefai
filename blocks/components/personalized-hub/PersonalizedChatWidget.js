import sendMessage from '../chatbot/sendMessage.js';
import renderMessage from '../chatbot/renderMessage.js';
import ChatInput from '../chatInput/ChatInput.js';

const {
  useState, useCallback, useRef, useEffect,
} = window.React;
const { createElement: h } = window.React;

const USER_ID = 1;
const AI_ID = 2;

const PREDEFINED_QUESTIONS = [
  'Why do you need my business name?',
  'How are these insights created?',
  'What would my information used for?',
  'What if I don\'t have any business information for this country?',
];

export default function PersonalizedChatWidget({
  onBusinessNameSubmit,
  messages: controlledMessages,
  onMessagesChange,
}) {
  const [uncontrolledMessages, setUncontrolledMessages] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState(PREDEFINED_QUESTIONS);
  const messagesEndRef = useRef(null);

  const isControlled = Array.isArray(controlledMessages) && typeof onMessagesChange === 'function';
  const messages = isControlled ? controlledMessages : uncontrolledMessages;
  const setMessages = isControlled ? onMessagesChange : setUncontrolledMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuestionClick = useCallback(async (question) => {
    const userMessage = {
      _id: Date.now().toString(),
      text: question,
      createdAt: new Date(),
      user: {
        _id: USER_ID,
        name: 'You',
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setVisibleQuestions((prev) => prev.filter((q) => q !== question));
    setIsTyping(true);

    try {
      const response = await sendMessage(question, {
        context: {
          messageHistory: messages.slice(-5),
        },
      });
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', err);
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
  }, [messages]);

  const handleBusinessNameSubmit = useCallback(async () => {
    const trimmedName = businessName.trim();
    if (!trimmedName) return;

    // Always send the business name through the regular chat message API
    // so the backend can run its business search logic.
    setIsTyping(true);
    try {
      const userMessage = {
        _id: Date.now().toString(),
        text: trimmedName,
        createdAt: new Date(),
        user: {
          _id: USER_ID,
          name: 'You',
        },
      };

      setMessages((prev) => [...prev, userMessage]);

      const response = await sendMessage(trimmedName, {
        context: {
          messageHistory: messages.slice(-5),
        },
      });

      setMessages((prev) => [...prev, response]);

      if (onBusinessNameSubmit && response.metadata?.businesses?.length) {
        onBusinessNameSubmit(response.metadata.businesses);
      } else if (onBusinessNameSubmit) {
        onBusinessNameSubmit(trimmedName);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send business name message:', err);
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

  }, [businessName, onBusinessNameSubmit, messages, setMessages]);

  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h(
        'div',
        { key: 'messages', className: 'ph-chat-messages' },
        [
          h(
            'div',
            { key: 'initial-prompt', className: 'ph-system-message' },
            [
              h('p', { key: 'thanks' }, 'Thanks for agreeing!'),
              h('p', { key: 'text', className: 'text-bold' }, [
                'Now please enter your ',
                h('span', { key: 'highlight', className: 'text-orange' }, 'business name'),
                ' to unlock personalised growth insights',
              ]),
            ],
          ),
          ...messages.map(renderMessage),
          isTyping && h(
            'div',
            {
              key: 'typing',
              style: {
                padding: '12px 16px',
                marginBottom: '16px',
                color: 'var(--dark-color)',
                fontStyle: 'italic',
                fontSize: '14px',
              },
            },
            'Chef AI is typing...',
          ),
          h('div', { key: 'scroll-anchor', ref: messagesEndRef }),
        ],
      ),
      h(
        'div',
        { key: 'input-area', className: 'ph-input-container' },
        [
          visibleQuestions.length > 0 && h(
            'div',
            { key: 'questions', className: 'ph-predefined-questions' },
            visibleQuestions.map((question, idx) => h(
              'button',
              {
                key: `q${idx}`,
                className: 'ph-question-btn',
                onClick: () => handleQuestionClick(question),
                disabled: isTyping,
              },
              question,
            )),
          ),
          h(ChatInput, {
            key: 'input',
            value: businessName,
            onChange: setBusinessName,
            onSubmit: handleBusinessNameSubmit,
            placeholder: 'Type your business name',
            disabled: isTyping,
            submitDisabled: !businessName.trim() || isTyping,
          }),
        ],
      ),
    ],
  );
}
