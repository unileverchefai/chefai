/**
 * Parse streaming event and extract text chunk.
 *
 * @param {Object} event - SSE event object
 * @returns {string|null} - Text chunk if available, null otherwise
 */
export function parseStreamingEvent(event) {
  const text = event.message || event.description || event.step || event.text || null;

  if (text && typeof text === 'string' && text.trim()) {
    const phase = event.type || event.phase;

    if (phase && ['run_completed', 'completed', 'failed', 'error'].includes(phase)) {
      return null;
    }

    return text;
  }

  return null;
}

export default function formatResponse(apiResponse) {
  const messageText = apiResponse.response?.message
    || (typeof apiResponse.response === 'string' ? apiResponse.response : 'I received your message. How can I help you further?');

  // Products are rendered via a dedicated carousel in the UI.

  // Collect all images from response
  const images = [];

  const extractImages = (items, altKeyOrDefault) => {
    items?.forEach((item) => {
      if (item.image_url || item.image) {
        images.push({
          url: item.image_url || item.image,
          alt: typeof altKeyOrDefault === 'function'
            ? altKeyOrDefault(item)
            : (item[altKeyOrDefault] || altKeyOrDefault),
        });
      }
    });
  };

  extractImages(
    apiResponse.response?.recipes,
    (recipe) => recipe.title_in_user_language || recipe.title_in_original_language || 'Recipe image',
  );
  extractImages(
    apiResponse.response?.recipe_details,
    (recipe) => recipe.title_in_user_language || recipe.title_in_original_language || 'Recipe image',
  );
  extractImages(apiResponse.response?.product_details, (product) => product.name
    || product.title_in_user_language
    || product.title_in_original_language
    || 'Product image');
  extractImages(apiResponse.response?.products, (product) => product.name
    || product.title_in_user_language
    || product.title_in_original_language
    || 'Product image');

  return {
    _id: apiResponse.message_id || `msg_${Date.now()}`,
    text: messageText,
    createdAt: new Date(apiResponse.timestamp || Date.now()),
    user: {
      _id: 2,
      name: 'Chef AI',
    },
    metadata: {
      run_id: apiResponse.run_id,
      thread_id: apiResponse.thread_id,
      recipes: apiResponse.response?.recipes || [],
      recipe_details: apiResponse.response?.recipe_details || [],
      product_details: apiResponse.response?.product_details || [],
      products: apiResponse.response?.products || [],
      suggested_prompts: apiResponse.response?.suggested_prompts || [],
      businesses: apiResponse.response?.businesses || [],
      images,
    },
  };
}
