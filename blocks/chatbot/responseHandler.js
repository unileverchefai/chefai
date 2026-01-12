export default function formatResponse(apiResponse) {
  // Build message text from response
  let messageText = apiResponse.response?.message
    || (typeof apiResponse.response === 'string' ? apiResponse.response : 'I received your message. How can I help you further?');

  // Handle recipe summaries (simple list)
  if (apiResponse.response?.recipes?.length > 0) {
    messageText += '\n\nRecipes:\n';
    apiResponse.response.recipes.forEach((recipe, index) => {
      messageText += `\n${index + 1}. ${recipe.title_in_user_language || recipe.title_in_original_language}`;
      if (recipe.description) messageText += `\n   ${recipe.description}`;
      if (recipe.url) messageText += `\n   Link: ${recipe.url}`;
    });
  }

  // Handle detailed recipe information
  if (apiResponse.response?.recipe_details?.length > 0) {
    messageText += '\n\nRecipe Details:\n';
    apiResponse.response.recipe_details.forEach((recipe, index) => {
      messageText += `\n${index + 1}. ${recipe.title_in_user_language || recipe.title_in_original_language}`;
      if (recipe.description) messageText += `\n   ${recipe.description}`;

      // Ingredients
      if (recipe.ingredients?.length > 0) {
        messageText += '\n\n   Ingredients:';
        recipe.ingredients.forEach((step) => {
          if (step.step_name) messageText += `\n   ${step.step_name}:`;
          if (step.ingredients) {
            step.ingredients.forEach((ing) => {
              messageText += `\n   - ${ing}`;
            });
          }
        });
      }

      // Preparation steps
      if (recipe.preparation?.length > 0) {
        messageText += '\n\n   Preparation:';
        recipe.preparation.forEach((step, idx) => {
          if (step.step_name) messageText += `\n   ${idx + 1}. ${step.step_name}`;
          if (step.preparation) messageText += `\n      ${step.preparation}`;
        });
      }

      // UFS Products
      if (recipe.ufs_products?.length > 0) {
        messageText += '\n\n   UFS Products:';
        recipe.ufs_products.forEach((product) => {
          messageText += `\n   - ${product.name}`;
          if (product.code) messageText += ` (${product.code})`;
          if (product.url) messageText += `\n     Link: ${product.url}`;
        });
      }

      // Additional recipe info
      if (recipe.yield_quantity) messageText += `\n\n   Yield: ${recipe.yield_quantity}`;
      if (recipe.chef_name) messageText += `\n   Chef: ${recipe.chef_name}`;

      if (recipe.url) messageText += `\n\n   Full Recipe: ${recipe.url}`;
      messageText += '\n';
    });
  }

  // Handle product details
  if (apiResponse.response?.product_details?.length > 0) {
    messageText += '\n\nProducts:\n';
    apiResponse.response.product_details.forEach((product, index) => {
      messageText += `\n${index + 1}. ${product.name}`;
      if (product.description) messageText += `\n   ${product.description}`;
      if (product.code) messageText += `\n   Code: ${product.code}`;
      if (product.url) messageText += `\n   Link: ${product.url}`;
    });
  }

  // Handle suggested prompts
  if (apiResponse.response?.suggested_prompts?.length > 0) {
    messageText += '\n\nYou can also ask:\n';
    apiResponse.response.suggested_prompts.forEach((prompt, index) => {
      messageText += `\n${index + 1}. ${prompt}`;
    });
  }

  // Collect all images from response
  const images = [];

  // Extract images from recipes
  if (apiResponse.response?.recipes?.length > 0) {
    apiResponse.response.recipes.forEach((recipe) => {
      if (recipe.image_url || recipe.image) {
        images.push({
          url: recipe.image_url || recipe.image,
          alt: recipe.title_in_user_language || recipe.title_in_original_language || 'Recipe image',
        });
      }
    });
  }

  // Extract images from recipe_details
  if (apiResponse.response?.recipe_details?.length > 0) {
    apiResponse.response.recipe_details.forEach((recipe) => {
      if (recipe.image_url || recipe.image) {
        images.push({
          url: recipe.image_url || recipe.image,
          alt: recipe.title_in_user_language || recipe.title_in_original_language || 'Recipe image',
        });
      }
    });
  }

  // Extract images from product_details
  if (apiResponse.response?.product_details?.length > 0) {
    apiResponse.response.product_details.forEach((product) => {
      if (product.image_url || product.image) {
        images.push({
          url: product.image_url || product.image,
          alt: product.name || 'Product image',
        });
      }
    });
  }

  return {
    _id: apiResponse.message_id || `msg_${Date.now()}`,
    text: messageText,
    createdAt: new Date(apiResponse.timestamp || Date.now()),
    user: {
      _id: 2,
      name: 'Chef AI',
      avatar: '/icons/chef-ai-avatar.svg',
    },
    metadata: {
      run_id: apiResponse.run_id,
      thread_id: apiResponse.thread_id,
      recipes: apiResponse.response?.recipes || [],
      recipe_details: apiResponse.response?.recipe_details || [],
      product_details: apiResponse.response?.product_details || [],
      suggested_prompts: apiResponse.response?.suggested_prompts || [],
      images,
    },
  };
}
