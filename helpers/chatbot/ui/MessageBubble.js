import SuggestedPrompts from './SuggestedPrompts.js';
import { USER_ID, formatMessageText } from '../model/messageModel.js';

export default function renderMessage(message, options = {}) {
  const { createElement: h } = window.React;

  const convertLinksToClickable = (text) => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;

    text.replace(urlPattern, (match, url, offset) => {
      if (offset > lastIndex) {
        parts.push(text.slice(lastIndex, offset));
      }

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

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderRecipesSection = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const ingredientsIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith('ingredients:'));

    if (ingredientsIndex === -1) {
      return convertLinksToClickable(text);
    }

    const beforeIngredients = lines.slice(0, ingredientsIndex);
    const ingredientsLines = [];
    const afterLines = [];

    for (let i = ingredientsIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.trim()) {
        afterLines.push(...lines.slice(i + 1));
        break;
      }
      ingredientsLines.push(line.replace(/^\s*[-•]\s*/, ''));
    }

    const children = [];

    if (beforeIngredients.length > 0) {
      children.push(
        h(
          'p',
          {
            key: 'recipes-intro',
            style: {
              margin: '0 0 8px 0',
            },
          },
          beforeIngredients.join('\n'),
        ),
      );
    }

    if (ingredientsLines.length > 0) {
      children.push(
        h(
          'ul',
          {
            key: 'ingredients-list',
            style: {
              paddingLeft: '20px',
              margin: '0 0 8px 0',
              columns: 2,
              columnGap: '16px',
            },
          },
          ingredientsLines.map((line, idx) => h(
            'li',
            { key: `ing-${idx}` },
            line.trim(),
          )),
        ),
      );
    }

    if (afterLines.length > 0) {
      children.push(
        h(
          'p',
          {
            key: 'recipes-rest',
            style: {
              margin: 0,
              whiteSpace: 'pre-wrap',
            },
          },
          afterLines.join('\n'),
        ),
      );
    }

    return children;
  };
  const { onPromptClick, hideSuggestedPrompts = false } = options;
  const isUser = message.user._id === USER_ID;

  const suggestedPrompts = message.metadata?.suggested_prompts || [];
  const recipes = message.metadata?.recipes || [];
  const products = message.metadata?.products || message.metadata?.product_details || [];
  const recipeDetails = message.metadata?.recipe_details || [];

  const cardImageUrls = new Set(
    [
      ...(products || []),
      ...(recipes || []),
    ]
      .map((item) => item.image_url || item.image)
      .filter((url) => typeof url === 'string' && url),
  );

  const renderRecipeDetails = (details) => {
    if (!details || details.length === 0) return null;

    return details.map((detail, detailIndex) => {
      const title = detail.title_in_user_language
        || detail.title_in_original_language
        || '';

      const ingredientsSections = Array.isArray(detail.ingredients) ? detail.ingredients : [];
      const preparationSections = Array.isArray(detail.preparation) ? detail.preparation : [];
      const ufsProducts = Array.isArray(detail.ufs_products) ? detail.ufs_products : [];

      return h(
        'div',
        {
          key: `recipe-detail-${detailIndex}`,
          style: {
            marginTop: '12px',
            fontFamily: 'var(--body-font-family)',
            fontSize: 'var(--body-font-size-xs)',
            lineHeight: '1.5',
          },
        },
        [
          title && h(
            'div',
            {
              key: 'title',
              style: {
                fontWeight: 600,
                marginBottom: '4px',
              },
            },
            title,
          ),
          detail.description && h(
            'div',
            {
              key: 'description',
              style: {
                marginBottom: '8px',
              },
            },
            detail.description,
          ),
          ingredientsSections.length > 0 && h(
            'div',
            {
              key: 'ingredients',
              style: {
                marginBottom: '8px',
              },
            },
            ingredientsSections.map((section, idx) => h(
              'div',
              {
                key: `ing-section-${idx}`,
                style: {
                  marginBottom: '4px',
                },
              },
              [
                section.step_name && h(
                  'div',
                  {
                    key: 'step-name',
                    style: {
                      fontWeight: 500,
                      marginBottom: '2px',
                    },
                  },
                  section.step_name,
                ),
                Array.isArray(section.ingredients) && section.ingredients.length > 0 && h(
                  'ul',
                  {
                    key: 'step-ingredients',
                    className: 'recipe-ingredients-list',
                  },
                  section.ingredients.map((ing, ingIndex) => h(
                    'li',
                    { key: `ing-${ingIndex}` },
                    ing,
                  )),
                ),
              ],
            )),
          ),
          preparationSections.length > 0 && h(
            'div',
            {
              key: 'preparation',
            },
            preparationSections.map((section, idx) => h(
              'div',
              {
                key: `prep-section-${idx}`,
                style: {
                  marginTop: idx === 0 ? '4px' : '8px',
                },
              },
              [
                section.step_name && h(
                  'div',
                  {
                    key: 'prep-step-name',
                    style: {
                      fontWeight: 500,
                      marginBottom: '2px',
                    },
                  },
                  section.step_name,
                ),
                section.preparation && h(
                  'div',
                  {
                    key: 'prep-text',
                  },
                  section.preparation,
                ),
              ],
            )),
          ),
          (detail.yield_quantity || detail.chef_name || ufsProducts.length > 0) && h(
            'div',
            {
              key: 'meta',
              style: {
                marginTop: '8px',
              },
            },
            [
              detail.yield_quantity && h(
                'div',
                {
                  key: 'yield',
                },
                `Yield: ${detail.yield_quantity}`,
              ),
              detail.chef_name && h(
                'div',
                {
                  key: 'chef',
                },
                `Chef: ${detail.chef_name}`,
              ),
              ufsProducts.length > 0 && h(
                'ul',
                {
                  key: 'ufs-products',
                  style: {
                    margin: '4px 0 0 0',
                    paddingLeft: '20px',
                  },
                },
                ufsProducts.map((product, index) => h(
                  'li',
                  {
                    key: `ufs-${index}`,
                  },
                  product.url
                    ? h(
                      'a',
                      {
                        href: product.url,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      },
                      product.name || product.code || 'Product',
                    )
                    : (product.name || product.code || 'Product'),
                )),
              ),
            ],
          ),
        ],
      );
    });
  };

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
              lineHeight: '2',
            },
            dangerouslySetInnerHTML: { __html: formatMessageText(textBeforeRecipes || message.text || '') },
          },
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
            .filter((img) => !cardImageUrls.has(img.url))
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
    ...(recipes.length > 0
      ? [
        h(
          'div',
          {
            key: 'recipes-carousel',
            className: 'chatbot-carousel carousel-base',
          },
          h(
            'div',
            {
              className: 'carousel-cards-container',
            },
            recipes.map((recipe, index) => h(
              'a',
              {
                key: `recipe-${index}`,
                className: 'chatbot-carousel-card',
                href: recipe.url || undefined,
                target: recipe.url ? '_blank' : undefined,
                rel: recipe.url ? 'noopener noreferrer' : undefined,
              },
              [
                recipe.image_url && h(
                  'img',
                  {
                    key: 'image',
                    src: recipe.image_url,
                    alt: recipe.title_in_user_language
                      || recipe.title_in_original_language
                      || 'Recipe image',
                    className: 'chat-product-image',
                  },
                ),
                h(
                  'div',
                  {
                    key: 'name',
                    className: 'chat-product-name',
                  },
                  recipe.title_in_user_language
                    || recipe.title_in_original_language
                    || 'Recipe',
                ),
                recipe.description && h(
                  'div',
                  {
                    key: 'description',
                    className: 'chat-product-description',
                  },
                  recipe.description,
                ),
              ],
            )),
          ),
        ),
      ]
      : []),
    ...(recipeDetails.length > 0
      ? [
        h(
          'div',
          {
            key: 'recipe-details',
            style: {
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
            },
          },
          renderRecipeDetails(recipeDetails),
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
              lineHeight: '2',
            },
          },
          renderRecipesSection(textWithRecipes),
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
            className: 'chatbot-carousel carousel-base',
          },
          h(
            'div',
            {
              className: 'carousel-cards-container',
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
            borderRadius: '20px',
            backgroundColor: isUser ? 'var(--light-mushroom)' : 'transparent',
            color: 'var(--text-color)',
          },
        },
        bubbleContent,
      ),
      !isUser && suggestedPrompts.length > 0 && !hideSuggestedPrompts && h(SuggestedPrompts, {
        key: 'suggested-prompts',
        prompts: suggestedPrompts,
        onPromptClick,
        disabled: false,
      }),
    ],
  );
}
