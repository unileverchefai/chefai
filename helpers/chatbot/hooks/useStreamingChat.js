import openPersonalizedHub from '@helpers/personalized-hub/personalized-hub.js';
import { getStoredThreadId } from '@scripts/custom/utils.js';
import sendStreamingMessage from '../api/streamingChat.js';
import { USER_ID, AI_ID } from '../model/messageModel.js';

function scrollChatToBottom() {
  const container = document.getElementsByClassName('chat-messages')[0];
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'instant',
  });
}

export default function useStreamingChat({
  personalizedHubTrigger,
  messages,
  setMessages,
}) {
  const {
    useState,
    useCallback,
    useEffect,
    useRef,
  } = window.React;

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const streamingConnectionRef = useRef(null);
  const streamingMessageIdRef = useRef(null);

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

    // Ensure latest messages are visible immediately after sending.
    // Use a micro-delay so the DOM has rendered the new bubbles.
    scrollChatToBottom();

    try {
      const currentThreadId = getStoredThreadId();

      const onChunk = (text) => {
        // Update the streaming message with accumulated text
        setMessages((prev) => prev.map((msg) => (
          msg._id === placeholderMessageId
            ? {
              ...msg,
              text,
            }
            : msg
        )));
      };

      const onComplete = (finalMessage) => {
        // Replace placeholder with final message
        setMessages((prev) => prev.map((msg) => (
          msg._id === placeholderMessageId
            ? {
              ...finalMessage,
              _id: placeholderMessageId,
            }
            : msg
        )));
        streamingMessageIdRef.current = null;
        setIsTyping(false);
      };

      const onError = () => {
        // Error handling is done in sendStreamingMessage fallback
        // Just update the placeholder with error message if needed
        setMessages((prev) => prev.map((msg) => (
          msg._id === placeholderMessageId
            ? {
              ...msg,
              text: msg.text
                || 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
              isStreaming: false,
            }
            : msg
        )));
        streamingMessageIdRef.current = null;
        setIsTyping(false);
      };

      const onMetadata = (metadata) => {
        // Update message metadata if needed
        setMessages((prev) => prev.map((msg) => (
          msg._id === placeholderMessageId
            ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                ...metadata,
              },
            }
            : msg
        )));
      };

      const connection = await sendStreamingMessage(messageText, {
        thread_id: currentThreadId ?? undefined,
        context: {
          messageHistory: messages.slice(-5),
        },
        onChunk,
        onComplete,
        onError,
        onMetadata,
      });

      streamingConnectionRef.current = connection;
    } catch (err) {
      setError('Sorry, I\'m having trouble connecting. Please try again.');

      // Remove placeholder and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== placeholderMessageId);
        return [
          ...filtered,
          {
            _id: Date.now().toString(),
            text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
            createdAt: new Date(),
            user: {
              _id: AI_ID,
              name: 'Chef AI',
            },
            system: true,
          },
        ];
      });

      streamingMessageIdRef.current = null;
      setIsTyping(false);
    }
  }, [inputValue, personalizedHubTrigger, messages, setMessages]);

  return {
    inputValue,
    setInputValue,
    isTyping,
    error,
    handleSend,
  };
}
