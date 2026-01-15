import sendMessage from '../chatbot/sendMessage.js';
import renderMessage from '../chatbot/renderMessage.js';
import ChatInput from '../../components/ChatInput.js';

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

export default function PersonalizedChatWidget({ onBusinessNameSubmit }) {
  const [messages, setMessages] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState(PREDEFINED_QUESTIONS);
  const messagesEndRef = useRef(null);

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

  const handleBusinessNameSubmit = useCallback(() => {
    const trimmedName = businessName.trim();
    if (!trimmedName) return;

    if (onBusinessNameSubmit) {
      onBusinessNameSubmit(trimmedName);
    }
  }, [businessName, onBusinessNameSubmit]);

  const showInitialPrompt = messages.length === 0;

  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h('div', { key: 'handle', className: 'ph-chat-handle' }),
      h('div', { key: 'gradient', className: 'ph-chat-gradient' }),
      h(
        'div',
        { key: 'messages', className: 'ph-chat-messages' },
        [
          showInitialPrompt && h(
            'div',
            { key: 'initial-prompt', className: 'ph-system-message' },
            [
              h('p', { key: 'thanks' }, 'Thanks for agreeing!'),
              h('p', { key: 'text' }, [
                'Now please enter your ',
                h('span', { key: 'highlight', className: 'highlight' }, 'business name'),
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
