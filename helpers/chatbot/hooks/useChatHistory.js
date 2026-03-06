import {
  getHistory,
  getHistoryWithFallback,
  saveHistory,
  getStoredThreadId,
  getOrCreateThreadId,
  getAnonymousUserId,
  getUserIdFromCookie,
  validateThread,
  createThread,
} from '@scripts/custom/utils.js';
import { buildHeadlineMessage } from '../model/messageModel.js';

export default function useChatHistory(type) {
  const {
    useState,
    useEffect,
  } = window.React;

  const storedThreadId = getStoredThreadId();
  const cachedHistory = getHistory(storedThreadId);
  const [messages, setMessages] = useState(cachedHistory.length > 0 ? cachedHistory : []);

  // Load history from API in background on mount
  if (type !== 'insights') {
    useEffect(() => {
      let cancelled = false;
      let initialized = false;
      (async () => {
        if (initialized) return;
        initialized = true;

        try {
          const cookieUserId = getUserIdFromCookie();
          let userId = cookieUserId;
          if (!userId) {
            userId = await getAnonymousUserId();
          }

          // Get or create thread ID (validates on init)
          let threadId;
          if (type === 'quick-actions') {
            threadId = getStoredThreadId();
            if (!threadId) return;
          } else {
            // Main chat (ask-button): use cookie, validate so we can retrieve history
            threadId = getStoredThreadId();
            if (!threadId) {
              threadId = await getOrCreateThreadId(userId, true);
            } else {
              const isValid = await validateThread(threadId);
              if (!isValid) {
                threadId = await createThread(userId);
                sessionStorage.setItem('chefai-main-chat-thread', JSON.stringify({
                  threadId,
                  initialized: true,
                }));
              }
            }
          }

          if (cancelled) return;

          // Load history with fallback (uses cache first, then API)
          const apiHistory = await getHistoryWithFallback(threadId, userId);

          if (cancelled) return;

          // API is source of truth for this thread: replace state to avoid duplicates
          // (same message can have different _id from streaming vs API)
          if (apiHistory && apiHistory.length > 0) {
            setMessages(() => {
              let list = [...apiHistory];
              const headlineText = sessionStorage
                .getItem(`chefai-quick-action-headline-${threadId}`);
              if (headlineText && list.length > 0) {
                const hasHeadline = list
                  .some((m) => m.metadata?.isQuickActionHeadline);
                const firstMsg = list[0];
                if (firstMsg && typeof firstMsg.text === 'string') {
                  let text = firstMsg.text
                    .replace(`**${headlineText}**`, '')
                    .trim();
                  const escaped = headlineText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  text = text.replace(new RegExp(`^\\s*${escaped}\\s*\\n?`, 'i'), '').trim();
                  list[0] = { ...firstMsg, text };
                }
                if (!hasHeadline) {
                  const firstTime = firstMsg?.createdAt
                    ? new Date(firstMsg.createdAt).getTime()
                    : Date.now();
                  const headlineMessage = buildHeadlineMessage({
                    threadId,
                    headlineText,
                    createdAt: new Date(firstTime - 1),
                    type: type === 'quick-actions' ? 'quick-actions' : 'chat',
                  });
                  list = [headlineMessage, ...list];
                }
              }
              return list.sort((a, b) => {
                const timeA = a.createdAt instanceof Date
                  ? a.createdAt.getTime()
                  : new Date(a.createdAt).getTime();
                const timeB = b.createdAt instanceof Date
                  ? b.createdAt.getTime()
                  : new Date(b.createdAt).getTime();
                return timeA - timeB;
              });
            });
          }
        } catch {
          // Silently fail - cached history is already displayed
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [type]);
  }

  // Persist history when it changes
  useEffect(() => {
    if (messages.length > 0) {
      const threadId = getStoredThreadId();
      saveHistory(messages, threadId);
    }
  }, [messages]);

  return { messages, setMessages };
}
