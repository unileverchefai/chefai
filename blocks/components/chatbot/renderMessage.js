const { createElement: h } = window.React;
import SuggestedPrompts from './SuggestedPrompts.js';

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

export default function renderMessage(message, options = {}) {
  const { onPromptClick } = options;
  const isUser = message.user._id === USER_ID;
  
  const suggestedPrompts = message.metadata?.suggested_prompts || [];
  
  const hasRecipes = (message.metadata?.recipes?.length > 0) || 
                     (message.metadata?.recipe_details?.length > 0) ||
                     (message.text && (message.text.includes('Recipes:') || message.text.includes('Recipe Details:')));
  
  let textBeforeRecipes = message.text;
  let textWithRecipes = '';
  
  if (hasRecipes && message.text) {
    const recipesIndex = message.text.indexOf('Recipes:');
    const recipeDetailsIndex = message.text.indexOf('Recipe Details:');
    const splitIndex = recipesIndex !== -1 ? recipesIndex : 
                      (recipeDetailsIndex !== -1 ? recipeDetailsIndex : -1);
    
    if (splitIndex !== -1) {
      textBeforeRecipes = message.text.substring(0, splitIndex).trim();
      textWithRecipes = message.text.substring(splitIndex);
    }
  }

  const bubbleContent = [
    h(
      'div',
      {
        key: 'text-before',
        style: {
          fontFamily: 'var(--body-font-family)',
          fontSize: 'var(--body-font-size-xs)',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
        },
      },
      convertLinksToClickable(textBeforeRecipes),
    ),
    ...(message.metadata?.images?.length > 0
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
              marginTop: textBeforeRecipes ? '12px' : '0',
              marginBottom: textWithRecipes ? '12px' : (textBeforeRecipes ? '12px' : '0'),
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
    ...(textWithRecipes
      ? [
        h(
          'div',
          {
            key: 'text-recipes',
            style: {
              fontFamily: 'var(--body-font-family)',
              fontSize: 'var(--body-font-size-xs)',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            },
          },
          convertLinksToClickable(textWithRecipes),
        ),
      ]
      : []),
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
            backgroundColor: isUser ? 'var(--light-mushroom)' : 'transparent',
            color: 'var(--text-color)',
          },
        },
        bubbleContent,
      ),
      !isUser && suggestedPrompts.length > 0 && h(SuggestedPrompts, {
        key: 'suggested-prompts',
        prompts: suggestedPrompts,
        onPromptClick,
        disabled: false,
      }),
    ],
  );
}
