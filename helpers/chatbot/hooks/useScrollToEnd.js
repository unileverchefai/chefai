export default function useScrollToEnd(messages) {
  const {
    useCallback,
    useEffect,
    useRef,
  } = window.React;

  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);
  const initialScrollDone = useRef(false);

  const scrollToEnd = useCallback((useSmooth = false) => {
    const messagesContainer = messagesEndRef.current?.closest('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return;
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: useSmooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    const hasMessages = messages.length > 0;

    if (isInitialMount.current) {
      isInitialMount.current = false;

      if (!hasMessages) {
        initialScrollDone.current = true;
        return undefined;
      }

      const timeoutId = setTimeout(() => {
        scrollToEnd(false);
        initialScrollDone.current = true;
      }, 350);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    if (initialScrollDone.current && hasMessages) {
      scrollToEnd(false);
    }

    return undefined;
  }, [messages, scrollToEnd]);

  useEffect(() => {
    const scrollButton = document.getElementsByClassName('chatbot-modal-scroll-button')[0];
    const messagesContainer = document.getElementsByClassName('chat-messages')[0];
    if (!scrollButton || !messagesContainer) return undefined;

    let initialScrollHandled = false;
    const handleScroll = () => {
      if (!messagesContainer.textContent.trim()) {
        scrollButton.style.display = 'none';
        return;
      }

      let isScrolledToBottom;
      if (!initialScrollHandled) {
        isScrolledToBottom = false;
        initialScrollHandled = true;
      }

      if (!isScrolledToBottom) {
        isScrolledToBottom = Math.abs(
          messagesContainer.scrollHeight - messagesContainer.scrollTop
          - messagesContainer.clientHeight,
        ) < 2;
      }

      if (isScrolledToBottom) {
        scrollButton.style.display = 'none';
        return;
      }

      scrollButton.style.display = '';
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    const handleClick = () => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    scrollButton.addEventListener('click', handleClick);

    const observer = new MutationObserver(handleScroll);
    observer.observe(messagesContainer, { childList: true, subtree: true, characterData: true });

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
      scrollButton.removeEventListener('click', handleClick);
      observer.disconnect();
    };
  }, []);

  return { messagesEndRef };
}
