import { AI_ID, buildHeadlineMessage } from '../model/messageModel.js';

export default function useQuickActionsEvents(type, setMessages) {
  const { useEffect } = window.React;

  useEffect(() => {
    const handler = (event) => {
      const displayText = event.detail?.displayText;
      if (!displayText) return;

      const headlineMessage = buildHeadlineMessage({
        headlineText: displayText,
        createdAt: new Date(),
        type: 'quick-action',
      });

      if (type === 'insights') {
        const headlineInsightMessage = {
          _id: `headline_${Date.now()}`,
          text: event.detail?.headlineTitle,
          createdAt: new Date(),
          user: {
            _id: AI_ID,
            name: 'Chef AI',
          },
          metadata: {
            isQuickActionHeadline: true,
          },
        };

        const insightMessage = {
          _id: `headline_${Date.now()}`,
          text: displayText,
          createdAt: new Date(),
          user: {
            _id: AI_ID,
            name: 'Chef AI',
          },
          metadata: {
            isQuickActionHeadline: false,
            ...(event.detail?.prompts && { suggested_prompts: event.detail.prompts }),
          },
        };
        setMessages((prev) => [headlineInsightMessage, insightMessage, ...prev]);
      } else {
        setMessages((prev) => [headlineMessage, ...prev]);
      }
    };

    window.addEventListener('chefai:quick-action', handler);
    window.addEventListener('chefai:insights', handler);

    return () => {
      window.removeEventListener('chefai:quick-action', handler);
      window.removeEventListener('chefai:insights', handler);
    };
  }, [setMessages, type]);
}
