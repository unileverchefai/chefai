const { createElement: h } = window.React;

const USER_ID = 1;

function convertLinksToClickable(text) {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;

  text.replace(urlPattern, (match, url, offset) => {
    // Add text before the URL
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }
    // Add the clickable link
    parts.push(
      h(
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: {
            color: 'inherit',
            textDecoration: 'underline',
          },
        },
        url,
      ),
    );
    lastIndex = offset + match.length;
    return match;
  });

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function renderMessage(message) {
  const isUser = message.user._id === USER_ID;
  const hasImages = message.metadata?.images?.length > 0;

  const bubbleContent = [
    // Images wrapper
    ...(hasImages
      ? [
        h(
          'div',
          {
            key: 'images-wrapper',
            className: 'message-images',
            style: {
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: message.text ? '12px' : '0',
            },
          },
          message.metadata.images.map((img, idx) => h(
            'img',
            {
              key: `img-${idx}`,
              src: img.url,
              alt: img.alt,
              style: {
                maxWidth: message.metadata.images.length === 1 ? '100%' : 'calc(50% - 4px)',
                height: 'auto',
                borderRadius: '8px',
                objectFit: 'cover',
              },
              loading: 'lazy',
            },
          )),
        ),
      ]
      : []),
    // Text with clickable links
    h(
      'div',
      {
        key: 'text',
        style: {
          fontFamily: 'var(--body-font-family)',
          fontSize: 'var(--body-font-size-s)',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
        },
      },
      convertLinksToClickable(message.text),
    ),
    // Timestamp
    h(
      'div',
      {
        key: 'time',
        style: {
          fontSize: 'var(--body-font-size-xs)',
          opacity: 0.7,
          marginTop: '4px',
        },
      },
      new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    ),
  ];

  return h(
    'div',
    {
      key: message._id,
      className: `chat-message ${isUser ? 'user-message' : 'ai-message'}`,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      },
    },
    [
      h(
        'div',
        {
          className: 'message-bubble',
          style: {
            maxWidth: '70%',
            padding: '12px 16px',
            borderRadius: '20px',
            backgroundColor: isUser ? 'var(--link-color)' : 'var(--light-color)',
            color: isUser ? 'var(--background-color)' : 'var(--text-color)',
          },
        },
        bubbleContent,
      ),
    ],
  );
}
