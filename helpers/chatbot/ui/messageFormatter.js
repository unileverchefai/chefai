import ImageSkeleton from './skeleton/ImageSkeleton.js';

/** Shared styles for all thread types
 * (quick-actions, insights, carousel-biz-api) */
export const bubbleStyles = {
  headline: {
    fontFamily: 'var(--ff-unilever-shilling)',
    fontSize: 'var(--body-font-size-m)',
    lineHeight: '1.4',
    marginBottom: '8px',
  },
  bodyText: {
    fontFamily: 'var(--body-font-family)',
    fontSize: 'var(--body-font-size-xs)',
    lineHeight: '2',
  },
  timestamp: {
    fontSize: 'var(--body-font-size-xss)',
    opacity: 0.7,
    marginTop: '4px',
  },
  imagesWrapper: (hasTextBefore, hasTextRecipes) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: hasTextBefore ? '12px' : '0',
    marginBottom: (hasTextRecipes || hasTextBefore) ? '12px' : '0',
  }),
  recipeDetailsWrapper: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
  },
  textRecipes: {
    fontFamily: 'var(--body-font-family)',
    fontSize: 'var(--body-font-size-xs)',
    lineHeight: '2',
  },
  recipeDetailBlock: {
    marginTop: '12px',
    fontFamily: 'var(--body-font-family)',
    fontSize: 'var(--body-font-size-xs)',
    lineHeight: '1.5',
  },
  recipeDetailTitle: {
    fontSize: 'var(--body-font-size-m)',
    fontWeight: 600,
    marginBottom: '4px',
  },
  stepName: {
    fontSize: 'var(--body-font-size-s)',
    fontWeight: 500,
    marginBottom: '2px',
  },
};

/** First <p><strong>...</strong></p> in HTML becomes <h2> so message titles render as h2. */
const BOLD_PARA_REGEX = /<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/;

export function promoteFirstBoldParagraphToH2(html) {
  if (typeof html !== 'string') return '';
  return html.replace(BOLD_PARA_REGEX, '<h2 class="message-body-title">$1</h2>');
}

/**
 * Render headline block (same for quick-actions, insights, biz-api).
 */
export function renderHeadline(h, plainText) {
  return h('h1', { key: 'headline', style: bubbleStyles.headline }, plainText ?? '');
}

/**
 * Render body text block (same for all thread types).
 */
export function renderBodyText(h, html) {
  return h('div', {
    key: 'text-before',
    style: bubbleStyles.bodyText,
    dangerouslySetInnerHTML: { __html: html },
  });
}

/**
 * Resolve display title for recipe or product items (cards and alts).
 * @param {Object} item - Recipe or product object
 * @param {'recipe'|'product'} type - Item type
 * @param {string} fallback - Fallback when no title found
 * @returns {string}
 */
export function getItemDisplayTitle(item, type, fallback = '') {
  if (!item) return fallback;
  if (type === 'product') {
    return (item.name
      ?? item.title_in_user_language
      ?? item.title_in_original_language)
      || fallback;
  }
  return (item.title_in_user_language ?? item.title_in_original_language) || fallback;
}

/**
 * Resolve title for recipe-detail (title_in_user_language || title_in_original_language).
 * @param {Object} detail - Recipe detail object
 * @returns {string}
 */
export function getRecipeDetailTitle(detail) {
  if (!detail) return '';
  return detail.title_in_user_language
    || detail.title_in_original_language
    || '';
}

/**
 * Convert URLs in text to clickable anchor elements.
 * @param {string} text - Raw text
 * @param {Function} h - createElement
 * @returns {Array|string} VDOM parts or original text
 */
export function convertLinksToClickable(text, h) {
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
}

/**
 * Render a recipes section (intro, ingredients list, rest) from text.
 * @param {string} text - Text containing "Ingredients:" section
 * @param {Function} h - createElement
 * @returns {Array|null} VDOM children or null
 */
export function renderRecipesSection(text, h) {
  if (!text) return null;

  const lines = text.split('\n');
  const ingredientsIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith('ingredients:'));

  if (ingredientsIndex === -1) {
    return convertLinksToClickable(text, h);
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
          style: { margin: '0 0 8px 0' },
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
          style: { margin: 0, whiteSpace: 'pre-wrap' },
        },
        afterLines.join('\n'),
      ),
    );
  }

  return children;
}

/**
 * Render recipe details (full detail blocks with ingredients, preparation, meta).
 * @param {Array} details - recipe_details array
 * @param {Function} h - createElement
 * @returns {Array|null} VDOM nodes or null
 */
export function renderRecipeDetails(details, h) {
  if (!details || details.length === 0) return null;

  return details.map((detail, detailIndex) => {
    const title = getRecipeDetailTitle(detail);
    const ingredientsSections = Array.isArray(detail.ingredients) ? detail.ingredients : [];
    const preparationSections = Array.isArray(detail.preparation) ? detail.preparation : [];
    const ufsProducts = Array.isArray(detail.ufs_products) ? detail.ufs_products : [];

    return h(
      'div',
      {
        key: `recipe-detail-${detailIndex}`,
        style: bubbleStyles.recipeDetailBlock,
      },
      [
        title && h(
          'div',
          { key: 'title', style: bubbleStyles.recipeDetailTitle },
          title,
        ),
        detail.description && h(
          'div',
          { key: 'description', style: { marginBottom: '8px' } },
          detail.description,
        ),
        ingredientsSections.length > 0 && h(
          'div',
          { key: 'ingredients', style: { marginBottom: '8px' } },
          ingredientsSections.map((section, idx) => h(
            'div',
            {
              key: `ing-section-${idx}`,
              style: { marginBottom: '4px' },
            },
            [
              section.step_name && h(
                'div',
                { key: 'step-name', style: bubbleStyles.stepName },
                section.step_name,
              ),
              Array.isArray(section.ingredients) && section.ingredients.length > 0 && h(
                'ul',
                { key: 'step-ingredients', className: 'recipe-ingredients-list' },
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
          { key: 'preparation' },
          preparationSections.map((section, idx) => h(
            'div',
            {
              key: `prep-section-${idx}`,
              style: { marginTop: idx === 0 ? '4px' : '8px' },
            },
            [
              section.step_name && h(
                'div',
                { key: 'prep-step-name', style: bubbleStyles.stepName },
                section.step_name,
              ),
              section.preparation && h(
                'div',
                { key: 'prep-text' },
                section.preparation,
              ),
            ],
          )),
        ),
        (detail.yield_quantity || detail.chef_name || ufsProducts.length > 0) && h(
          'div',
          { key: 'meta', style: { marginTop: '8px' } },
          [
            detail.yield_quantity && h(
              'div',
              { key: 'yield' },
              `Yield: ${detail.yield_quantity}`,
            ),
            detail.chef_name && h(
              'div',
              { key: 'chef' },
              `Chef: ${detail.chef_name}`,
            ),
            ufsProducts.length > 0 && h(
              'ul',
              {
                key: 'ufs-products',
                style: { margin: '4px 0 0 0', paddingLeft: '20px' },
              },
              ufsProducts.map((product, index) => h(
                'li',
                { key: `ufs-${index}` },
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
}

/**
 * Render a single carousel card for a recipe or product.
 * @param {Function} h - createElement
 * @param {Object} item - Recipe or product item
 * @param {'recipe'|'product'} type - Item type
 * @param {number} index - Card index for key
 * @returns {Object} VDOM node (anchor with image, name, optional description)
 */
export function renderCarouselCard(h, item, type, index) {
  const imageUrl = type === 'recipe'
    ? item.image_url
    : (item.image_url ?? item.image);
  const title = getItemDisplayTitle(
    item,
    type,
    type === 'recipe' ? 'Recipe' : 'Product',
  );
  const alt = getItemDisplayTitle(
    item,
    type,
    type === 'recipe' ? 'Recipe image' : 'Product image',
  );
  const description = type === 'recipe'
    ? item.description
    : item.description;
  const { url } = item;

  return h(
    'a',
    {
      key: `${type}-${index}`,
      className: 'chatbot-carousel-card',
      href: url ?? undefined,
      target: url ? '_blank' : undefined,
      rel: url ? 'noopener noreferrer' : undefined,
    },
    [
      imageUrl && h(
        ImageSkeleton,
        {
          key: 'image',
          src: imageUrl,
          alt,
          imgClassName: 'chat-product-image',
          width: '100%',
          height: 120,
        },
      ),
      h(
        'div',
        { key: 'name', className: 'chat-product-name' },
        title,
      ),
      description && h(
        'div',
        { key: 'description', className: 'chat-product-description' },
        description,
      ),
    ],
  );
}
