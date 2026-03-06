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

  useEffect(() => {
    if (type === 'insights') {
      return undefined;
    }

    let cancelled = false;
    let initialized = false;

    (async () => {
      if (initialized) return;
      initialized = true;

      let threadId;

      const cookieUserId = getUserIdFromCookie();
      let userId = cookieUserId;
      if (!userId) {
        userId = await getAnonymousUserId();
      }

      if (type === 'quick-actions') {
        threadId = getStoredThreadId();
        if (!threadId) return;
      } else {
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

      const apiHistory = await getHistoryWithFallback(threadId);

      if (cancelled) return;

      if (!apiHistory?.length) return;

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
    })();

    return () => {
      cancelled = true;
    };
  }, [type, storedThreadId]);

  // Persist history when it changes
  useEffect(() => {
    if (messages.length > 0) {
      const threadId = getStoredThreadId();
      saveHistory(messages, threadId);
    }
  }, [messages]);

  return { messages, setMessages };
}
