import SuggestedPrompts from './SuggestedPrompts.js';
import ImageSkeleton from './skeleton/ImageSkeleton.js';
import {
  bubbleStyles,
  renderHeadline,
  renderBodyText,
  promoteFirstBoldParagraphToH2,
  renderRecipesSection,
  renderRecipeDetails,
  renderCarouselCard,
} from './messageFormatter.js';
import { USER_ID, formatMessageText } from '../model/messageModel.js';

export default function renderMessage(message, options = {}) {
  const { createElement: h } = window.React;
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
      .map((item) => item.image_url ?? item.image)
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

  const headlinePlainText = message.metadata?.isQuickActionHeadline && message.text
    ? String(message.text).replace(/<[^>]+>/g, '').trim()
    : '';
  const bubbleContent = [
    ...(message.metadata?.isQuickActionHeadline
      ? [renderHeadline(h, headlinePlainText || message.text)]
      : [renderBodyText(h, promoteFirstBoldParagraphToH2(formatMessageText(textBeforeRecipes || message.text || '')))]),
    ...(message.metadata?.images?.length > 0
      ? [
        h(
          'div',
          {
            key: 'images-wrapper',
            className: 'message-images',
            style: bubbleStyles.imagesWrapper(!!textBeforeRecipes, !!textWithRecipes),
          },
          message.metadata.images
            .filter((img) => !cardImageUrls.has(img.url))
            .map((img, idx) => h(
              ImageSkeleton,
              {
                key: `img-${idx}`,
                src: img.url,
                alt: img.alt ?? '',
                style: {
                  maxWidth: message.metadata.images.length === 1 ? '50%' : 'calc(50% - 4px)',
                  borderRadius: '8px',
                },
                width: 200,
                height: 115,
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
            recipes.map((recipe, index) => renderCarouselCard(h, recipe, 'recipe', index)),
          ),
        ),
      ]
      : []),
    ...(recipeDetails.length > 0
      ? [
        h(
          'div',
          { key: 'recipe-details', style: bubbleStyles.recipeDetailsWrapper },
          renderRecipeDetails(recipeDetails, h),
        ),
      ]
      : []),
    ...(textWithRecipes
      ? [
        h(
          'div',
          { key: 'text-recipes', style: bubbleStyles.textRecipes },
          renderRecipesSection(textWithRecipes, h),
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
            products.map((product, index) => renderCarouselCard(h, product, 'product', index)),
          ),
        ),
      ]
      : []),
    ...(message.metadata?.isQuickActionHeadline
      ? []
      : [
        h(
          'div',
          { key: 'time', style: bubbleStyles.timestamp },
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
