import createCarousel from '@helpers/carousel/carousel.js';
import useChatHistory from './hooks/useChatHistory.js';
import useStreamingChat from './hooks/useStreamingChat.js';
import useScrollToEnd from './hooks/useScrollToEnd.js';
import useQuickActionsEvents from './hooks/useQuickActionsEvents.js';
import renderChatUI from './ui/ChatLayout.js';

export default function ChatWidget({ personalizedHubTrigger = '#chatbot', type } = {}) {
  const {
    useEffect,
  } = window.React;

  const { messages, setMessages } = useChatHistory(type);
  const {
    inputValue,
    setInputValue,
    isTyping,
    error,
    handleSend,
  } = useStreamingChat({
    personalizedHubTrigger,
    messages,
    setMessages,
  });
  const { messagesEndRef } = useScrollToEnd(messages);

  useQuickActionsEvents(type, setMessages);

  // Initialize carousels for recipes/products inside messages
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll('.chatbot-carousel.carousel-base'));

    const instances = [];

    blocks.forEach((block) => {
      const container = block.querySelector('.carousel-cards-container')
        || block.querySelector('.carousel-container');
      if (!container) return;

      const itemCount = container.children.length;
      if (itemCount <= 1) return;

      try {
        const instance = createCarousel({
          container,
          block,
          itemCount,
          mobileItemsPerSlide: 1,
          desktopItemsPerSlide: 3,
          mobileBreakpoint: 900,
          mobileGap: 16,
          desktopGap: 24,
          swipeOnDesktop: true,
          hideArrows: false,
          disableDesktopCarousel: false,
        });
        instances.push(instance);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to init chatbot carousel', e);
      }
    });

    return () => {
      instances.forEach((instance) => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      });
    };
  }, [messages]);

  // Focus input field when chatbot opens
  useEffect(() => {
    let focused = false;

    const focusInput = () => {
      if (focused) return;
      const input = document.querySelector('.chat-input');
      if (input && typeof input.focus === 'function') {
        input.focus();
        focused = true;
      }
    };

    const timeoutId = setTimeout(focusInput, 350);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const disabled = !inputValue.trim() || isTyping;

  const handlePromptClick = (promptText) => {
    const syntheticEvent = {
      preventDefault: () => {},
    };
    handleSend(syntheticEvent, promptText);
  };

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
