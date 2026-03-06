export const USER_ID = 1;
export const AI_ID = 2;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatMessageText(rawText) {
  if (rawText == null) {
    return '';
  }

  const text = String(rawText);

  const hasMarked = typeof window !== 'undefined'
    && window.marked
    && typeof window.marked.parse === 'function';

  const hasDOMPurify = typeof window !== 'undefined'
    && window.DOMPurify
    && typeof window.DOMPurify.sanitize === 'function';

  let html;

  if (hasMarked) {
    html = window.marked.parse(text);
  } else {
    html = escapeHtml(text).replace(/\n/g, '<br />');
  }

  if (hasDOMPurify) {
    return window.DOMPurify.sanitize(html);
  }

  return html;
}

export function buildHeadlineMessage({
  threadId,
  headlineText,
  createdAt,
  type,
}) {
  const baseTime = createdAt ? new Date(createdAt) : new Date();
  const id = `headline_${threadId || baseTime.getTime()}`;

  return {
    _id: id,
    text: headlineText,
    createdAt: baseTime,
    user: {
      _id: AI_ID,
      name: 'Chef AI',
    },
    metadata: {
      isQuickActionHeadline: true,
      ...(type ? { headline_type: type } : {}),
    },
  };
}
