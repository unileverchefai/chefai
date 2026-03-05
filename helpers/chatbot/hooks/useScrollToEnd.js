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
    if (initialScrollDone.current && messages.length > 0) {
      scrollToEnd(false);
    }
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
      } else {
        isScrolledToBottom = Math.abs(
          messagesContainer.scrollHeight - messagesContainer.scrollTop
          - messagesContainer.clientHeight,
        ) < 2;
      }
      if (isScrolledToBottom) {
        scrollButton.style.display = 'none';
      } else {
        scrollButton.style.display = '';
      }
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
