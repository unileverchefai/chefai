import SuggestedPrompts from './SuggestedPrompts.js';

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

export default function renderMessage(message, options = {}) {
  const { onPromptClick } = options;
  const isUser = message.user._id === USER_ID;

  const suggestedPrompts = message.metadata?.suggested_prompts || [];
  const products = message.metadata?.products || message.metadata?.product_details || [];

  const productImageUrls = new Set(
    (products || [])
      .map((p) => p.image_url || p.image)
      .filter((url) => typeof url === 'string' && url),
  );

  const hasRecipes = (message.metadata?.recipes?.length > 0)
                     || (message.metadata?.recipe_details?.length > 0)
                     || (message.text && (message.text.includes('Recipes:') || message.text.includes('Recipe Details:')));

  let textBeforeRecipes = message.text;
  let textWithRecipes = '';

  if (hasRecipes && message.text) {
    const recipesIndex = message.text.indexOf('Recipes:');
    const recipeDetailsIndex = message.text.indexOf('Recipe Details:');
    let splitIndex = -1;
    if (recipesIndex !== -1) {
      splitIndex = recipesIndex;
    } else if (recipeDetailsIndex !== -1) {
      splitIndex = recipeDetailsIndex;
    }

    if (splitIndex !== -1) {
      textBeforeRecipes = message.text.substring(0, splitIndex).trim();
      textWithRecipes = message.text.substring(splitIndex);
    }
  }

  const bubbleContent = [
    ...(message.metadata?.isQuickActionHeadline
      ? [
        h(
          'div',
          {
            key: 'headline',
            style: {
              fontFamily: 'var(--ff-unilever-shilling)',
              fontSize: 'var(--body-font-size-m)',
              lineHeight: '1.4',
              marginBottom: '8px',
            },
          },
          message.text,
        ),
      ]
      : [
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
      ]),
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
              marginBottom: (() => {
                if (textWithRecipes) return '12px';
                return textBeforeRecipes ? '12px' : '0';
              })(),
            },
          },
          message.metadata.images
            .filter((img) => !productImageUrls.has(img.url))
            .map((img, idx) => h(
              'img',
              {
                key: `img-${idx}`,
                src: img.url,
                alt: img.alt,
                style: {
                  maxWidth: message.metadata.images.length === 1 ? '50%' : 'calc(50% - 4px)',
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
    ...(!isUser && products.length > 0
      ? [
        h(
          'div',
          {
            key: 'products-heading',
            className: 'chat-products-heading',
          },
          'Products:',
        ),
        h(
          'div',
          {
            key: 'products-carousel',
            className: 'chatbot-carousel',
          },
          products.map((product, index) => h(
            'div',
            {
              key: `product-${index}`,
              className: 'chatbot-carousel-card',
            },
            [
              (product.image_url || product.image) && h(
                'img',
                {
                  key: 'image',
                  src: product.image_url || product.image,
                  alt: product.name
                    || product.title_in_user_language
                    || product.title_in_original_language
                    || 'Product image',
                  className: 'chat-product-image',
                },
              ),
              h(
                'div',
                {
                  key: 'name',
                  className: 'chat-product-name',
                },
                product.name
                  || product.title_in_user_language
                  || product.title_in_original_language
                  || 'Product',
              ),
              product.description && h(
                'div',
                {
                  key: 'description',
                  className: 'chat-product-description',
                },
                product.description,
              ),
              product.url && h(
                'a',
                {
                  key: 'link',
                  href: product.url,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'chat-product-link',
                },
                'check it out',
              ),
            ],
          )),
        ),
      ]
      : []),
    ...(message.metadata?.isQuickActionHeadline
      ? []
      : [
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
      ]),
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
            maxWidth: '95%',
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
