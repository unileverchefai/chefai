import openPersonalizedHub from '@components/personalized-hub/personalized-hub.js';
import sendStreamingMessage from './sendStreamingMessage.js';
import {
  getHistory,
  getHistoryWithFallback,
  saveHistory,
  getStoredThreadId,
  getOrCreateThreadId,
  getAnonymousUserId,
  getUserIdFromCookie,
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

export default function ChatWidget({ personalizedHubTrigger = '#chatbot' } = {}) {
  // Load cached history immediately for fast display
  const storedThreadId = getStoredThreadId();
  const cachedHistory = getHistory(storedThreadId);
  const [messages, setMessages] = useState(cachedHistory.length > 0 ? cachedHistory : []);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);
  const initialScrollDone = useRef(false);
  const streamingConnectionRef = useRef(null);
  const streamingMessageIdRef = useRef(null);
  const historyLoadedRef = useRef(false);
  const inputFocusedRef = useRef(false);

  // Helper function to scroll to end of messages
  const scrollToEnd = useCallback((useSmooth = false) => {
    const messagesContainer = messagesEndRef.current?.closest('.chat-messages');
    if (messagesContainer) {
      // Directly set scrollTop to avoid any page-level scroll interference
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: useSmooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (messages.length > 0) {
        setTimeout(() => {
          scrollToEnd(false);
          initialScrollDone.current = true;
        }, 350);
      } else {
        initialScrollDone.current = true;
      }
      return;
    }
    // Only auto-scroll after initial mount is complete and if there are messages
    if (initialScrollDone.current && messages.length > 0) {
      scrollToEnd(true);
    }
  }, [messages, scrollToEnd]);

  // Load history from API in background on mount
  useEffect(() => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    (async () => {
      try {
        const cookieUserId = getUserIdFromCookie();
        let userId = cookieUserId;
        if (!userId) {
          userId = await getAnonymousUserId();
        }

        // Get or create thread ID (validates on init)
        const threadId = await getOrCreateThreadId(userId, true);

        // Load history with fallback (uses cache first, then API)
        const apiHistory = await getHistoryWithFallback(threadId, userId);

        // Only update if we got new messages from API
        if (apiHistory && apiHistory.length > 0) {
          setMessages((prev) => {
            // Merge with existing messages, avoiding duplicates
            const existingIds = new Set(prev.map((m) => m._id));
            const newMessages = apiHistory.filter((m) => !existingIds.has(m._id));
            if (newMessages.length > 0) {
              return [...prev, ...newMessages].sort((a, b) => {
                const timeA = a.createdAt instanceof Date
                  ? a.createdAt.getTime()
                  : new Date(a.createdAt).getTime();
                const timeB = b.createdAt instanceof Date
                  ? b.createdAt.getTime()
                  : new Date(b.createdAt).getTime();
                return timeA - timeB;
              });
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently fail - cached history is already displayed
      }
    })();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const threadId = getStoredThreadId();
      saveHistory(messages, threadId);
    }
  }, [messages]);

  // Focus input field when chatbot opens
  useEffect(() => {
    if (!inputFocusedRef.current) {
      // Wait for modal animation and React render to complete
      const focusInput = () => {
        const input = document.querySelector('.chat-input');
        if (input && typeof input.focus === 'function') {
          input.focus();
          inputFocusedRef.current = true;
        }
      };

      // Try to focus after a short delay to ensure input is rendered
      setTimeout(focusInput, 350);
    }
  }, []);

  // Cleanup SSE connection on unmount
  useEffect(() => () => {
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.disconnect();
    }
  }, []);

  const handleSend = useCallback(async (e, messageOverride = null) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const messageText = messageOverride || inputValue.trim();
    if (!messageText) return;

    const isPersonalizedHubTrigger = personalizedHubTrigger
      && messageText.toLowerCase() === personalizedHubTrigger.toLowerCase();

    if (isPersonalizedHubTrigger) {
      setInputValue('');
      setError(null);
      setIsTyping(false);
      openPersonalizedHub();
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

    // Clean up any existing streaming connection
    if (streamingConnectionRef.current) {
      streamingConnectionRef.current.disconnect();
      streamingConnectionRef.current = null;
    }

    // Create placeholder AI message for streaming
    const placeholderMessageId = `msg_${Date.now()}`;
    streamingMessageIdRef.current = placeholderMessageId;

    const placeholderMessage = {
      _id: placeholderMessageId,
      text: '',
      createdAt: new Date(),
      user: {
        _id: AI_ID,
        name: 'Chef AI',
      },
      isStreaming: true,
    };

    setMessages((prev) => [...prev, placeholderMessage]);

    try {
      const connection = await sendStreamingMessage(messageText, {
        context: {
          messageHistory: messages.slice(-5),
        },
        onChunk: (text) => {
          // Update the streaming message with accumulated text
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg._id === placeholderMessageId) {
                return {
                  ...msg,
                  text,
                };
              }
              return msg;
            });
            return updated;
          });
        },
        onComplete: (finalMessage) => {
          // Replace placeholder with final message
          setMessages((prev) => prev.map((msg) => {
            if (msg._id === placeholderMessageId) {
              return {
                ...finalMessage,
                _id: placeholderMessageId,
              };
            }
            return msg;
          }));
          streamingMessageIdRef.current = null;
          setIsTyping(false);
        },
        onError: () => {
          // Error handling is done in sendStreamingMessage fallback
          // Just update the placeholder with error message if needed
          setMessages((prev) => prev.map((msg) => {
            if (msg._id === placeholderMessageId) {
              return {
                ...msg,
                text: msg.text || 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
                isStreaming: false,
              };
            }
            return msg;
          }));
          streamingMessageIdRef.current = null;
          setIsTyping(false);
        },
        onMetadata: (metadata) => {
          // Update message metadata if needed
          setMessages((prev) => prev.map((msg) => {
            if (msg._id === placeholderMessageId) {
              return {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  ...metadata,
                },
              };
            }
            return msg;
          }));
        },
      });

      streamingConnectionRef.current = connection;
    } catch (err) {
      setError('Sorry, I\'m having trouble connecting. Please try again.');

      // Remove placeholder and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== placeholderMessageId);
        return [...filtered, {
          _id: Date.now().toString(),
          text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
          createdAt: new Date(),
          user: {
            _id: AI_ID,
            name: 'Chef AI',
          },
          system: true,
        }];
      });

      streamingMessageIdRef.current = null;
      setIsTyping(false);
    }
  }, [inputValue, messages, personalizedHubTrigger]);

  const disabled = !inputValue.trim() || isTyping;

  const handlePromptClick = useCallback((promptText) => {
    const syntheticEvent = {
      preventDefault: () => {},
    };
    handleSend(syntheticEvent, promptText);
  }, [handleSend]);

  return renderChatUI({
    error,
    messages,
    isTyping,
    messagesEndRef,
    inputValue,
    setInputValue,
    handleSend,
    disabled,
    onPromptClick: handlePromptClick,
  });
}
