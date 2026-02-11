import sendMessage from '../chatbot/sendMessage.js';
import sendStreamingMessage from '../chatbot/sendStreamingMessage.js';
import renderMessage from '../chatbot/renderMessage.js';
import ChatInput from '../chatInput/ChatInput.js';

const {
  useState, useCallback, useRef, useEffect,
} = window.React;
const { createElement: h } = window.React;

const USER_ID = 1;
const AI_ID = 2;

// Suggested questions are provided dynamically by the API (metadata.suggested_prompts).
// Do not hardcode any defaults here.

export default function PersonalizedChatWidget({
  onBusinessNameSubmit,
  messages: controlledMessages,
  onMessagesChange,
}) {
  const [uncontrolledMessages, setUncontrolledMessages] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState([]);
  const [streamingText, setStreamingText] = useState(null);
  const messagesEndRef = useRef(null);
  const businessesProcessedRef = useRef(false);
  const threadIdRef = useRef(null);
  const initialPromptLoadedRef = useRef(false);

  const isControlled = Array.isArray(controlledMessages) && typeof onMessagesChange === 'function';
  const messages = isControlled ? controlledMessages : uncontrolledMessages;
  const setMessages = isControlled ? onMessagesChange : setUncontrolledMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Load initial system message dynamically from Chef AI
  useEffect(() => {
    if (initialPromptLoadedRef.current) return;
    if (messages.length > 0) {
      initialPromptLoadedRef.current = true;
      return;
    }

    initialPromptLoadedRef.current = true;
    setIsTyping(true);

    (async () => {
      try {
        const response = await sendMessage('', {
          context: {
            messageHistory: [],
          },
          skipCache: true,
        });

        setMessages((prev) => [...prev, response]);

        if (!threadIdRef.current) {
          threadIdRef.current = response.metadata?.thread_id
            ?? response.metadata?.threadId
            ?? response.thread_id
            ?? null;
          if (threadIdRef.current) {
            sessionStorage.setItem('personalized-hub-thread-id', threadIdRef.current);
          }
        }

        const dynamicQuestions = response.metadata?.suggested_prompts;
        if (Array.isArray(dynamicQuestions) && dynamicQuestions.length > 0) {
          setVisibleQuestions(dynamicQuestions);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load initial personalized hub prompt:', err);
      } finally {
        setIsTyping(false);
      }
    })();
  }, [messages, setMessages]);

  useEffect(() => {
    if (!onBusinessNameSubmit || businessesProcessedRef.current) return;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const businesses = msg.metadata?.businesses || msg.businesses;

      if (businesses && Array.isArray(businesses) && businesses.length > 0) {
        businessesProcessedRef.current = true;
        onBusinessNameSubmit(businesses);
        return;
      }
    }
  }, [messages, onBusinessNameSubmit]);

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
      const baseOptions = {
        context: {
          messageHistory: messages.slice(-5),
        },
        skipCache: true, // Don't cache thread_id during business registration
      };

      if (threadIdRef.current) {
        baseOptions.thread_id = threadIdRef.current;
      }

      const response = await sendMessage(question, baseOptions);

      if (!threadIdRef.current) {
        threadIdRef.current = response.metadata?.thread_id
          ?? response.metadata?.threadId
          ?? response.thread_id
          ?? null;
        if (threadIdRef.current) {
          sessionStorage.setItem('personalized-hub-thread-id', threadIdRef.current);
        }
      }
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
    setIsTyping(true);
    setStreamingText('');

    const baseOptions = {
      context: {
        messageHistory: messages.slice(-5),
      },
      skipCache: true,
    };

    if (threadIdRef.current) {
      baseOptions.thread_id = threadIdRef.current;
    }

    sendStreamingMessage(trimmedName, {
      ...baseOptions,
      onChunk: (text) => setStreamingText(text),
      onComplete: (response) => {
        setStreamingText(null);
        setIsTyping(false);

        if (!threadIdRef.current) {
          threadIdRef.current = response.metadata?.thread_id
            ?? response.metadata?.threadId
            ?? response.thread_id
            ?? null;
          if (threadIdRef.current) {
            sessionStorage.setItem('personalized-hub-thread-id', threadIdRef.current);
          }
        }

        setMessages((prev) => [...prev, response]);

        let businesses = null;
        if (response.metadata?.businesses
          && Array.isArray(response.metadata.businesses)
          && response.metadata.businesses.length > 0) {
          businesses = response.metadata.businesses;
        } else if (response.businesses
          && Array.isArray(response.businesses)
          && response.businesses.length > 0) {
          businesses = response.businesses;
        }

        if (onBusinessNameSubmit && businesses) {
          businessesProcessedRef.current = true;
          onBusinessNameSubmit(businesses);
        } else if (onBusinessNameSubmit && !businessesProcessedRef.current) {
          onBusinessNameSubmit(trimmedName);
        }
      },
      onError: () => {
        setStreamingText(null);
        setIsTyping(false);
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
      },
    });
  }, [businessName, onBusinessNameSubmit, messages, setMessages]);

  return h(
    'div',
    { className: 'ph-chat-container' },
    [
      h(
        'div',
        { key: 'messages', className: 'ph-chat-messages' },
        [
          ...messages.map((msg) => renderMessage(msg, { hideSuggestedPrompts: true })),
          streamingText !== null && renderMessage({
            _id: 'streaming',
            text: `${streamingText}\u258B`,
            createdAt: new Date(),
            user: { _id: AI_ID, name: 'Chef AI' },
            metadata: {},
          }),
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
                className: 'chatbot-question-btn',
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
