/**
 * Chef AI Service
 * Handles communication with the Azure Chef AI API
 */

const API_CONFIG = {
  endpoints: {
    capgemini: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
    formula1: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
    ufs: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
  },
  defaultEndpoint: 'capgemini',
  timeout: 30000,
  retryAttempts: 2,
};

/**
 * Chef AI Service class
 */
class ChefAiService {
  constructor(config = {}) {
    this.config = { ...API_CONFIG, ...config };
    this.currentEndpoint = this.config.defaultEndpoint;
  }

  /**
   * Set the active endpoint
   * @param {string} endpoint - Endpoint key (capgemini, formula1, ufs)
   */
  setEndpoint(endpoint) {
    if (this.config.endpoints[endpoint]) {
      this.currentEndpoint = endpoint;
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Unknown endpoint: ${endpoint}, using default`);
    }
  }

  /**
   * Get the current API endpoint URL
   * @returns {string} API endpoint URL
   */
  getEndpointUrl() {
    return this.config.endpoints[this.currentEndpoint];
  }

  /**
   * Send a message to the Chef AI API
   * @param {string} message - User message
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response
   */
  async sendMessage(message, options = {}) {
    const endpoint = this.getEndpointUrl();
    
    // Get or create thread ID
    const threadId = this.getThreadId();
    
    // Build request payload
    const payload = {
      message,
      thread_id: threadId,
      user_id: options.user_id || 'user123',
      country: options.country || 'BE',
      ...options,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();

      if (!responseText || responseText.length === 0) {
        throw new Error('API returned empty response');
      }

      const data = JSON.parse(responseText);
      
      // Transform API response to chat message format
      return this.formatResponse(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get or create thread ID for conversation tracking
   * @returns {string} Thread ID
   */
  getThreadId() {
    const storageKey = 'chef-ai-thread-id';
    let threadId = sessionStorage.getItem(storageKey);
    
    if (!threadId) {
      threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(storageKey, threadId);
    }
    
    return threadId;
  }

  /**
   * Format API response to chat message format
   * @param {object} apiResponse - Response from Chef AI API
   * @returns {object} Formatted message
   */
  // eslint-disable-next-line class-methods-use-this
  formatResponse(apiResponse) {
    // Extract message text
    let messageText = '';
    
    if (apiResponse.response?.message) {
      messageText = apiResponse.response.message;
    } else if (typeof apiResponse.response === 'string') {
      messageText = apiResponse.response;
    } else {
      messageText = 'I received your message. How can I help you further?';
    }

    // Add recipes if present
    if (apiResponse.response?.recipes && apiResponse.response.recipes.length > 0) {
      messageText += '\n\n📚 Recipes:\n';
      apiResponse.response.recipes.forEach((recipe, index) => {
        messageText += `\n${index + 1}. ${recipe.title_in_user_language || recipe.title_in_original_language}`;
        if (recipe.description) {
          messageText += `\n   ${recipe.description}`;
        }
        if (recipe.url) {
          messageText += `\n   🔗 ${recipe.url}`;
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
      },
    };
  }

  /**
   * Get conversation history from session storage
   * @returns {Promise<Array>} Array of messages
   */
  async getHistory() {
    const storageKey = 'chef-ai-history';
    
    try {
      const history = sessionStorage.getItem(storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to retrieve history:', error);
      return [];
    }
  }

  /**
   * Save conversation history to session storage
   * @param {Array} messages - Array of messages
   * @returns {Promise<void>}
   */
  async saveHistory(messages) {
    const storageKey = 'chef-ai-history';
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Clear conversation history and thread ID
   * @returns {Promise<void>}
   */
  async clearHistory() {
    try {
      sessionStorage.removeItem('chef-ai-history');
      sessionStorage.removeItem('chef-ai-thread-id');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear history:', error);
    }
  }
}

// Export singleton instance
export default new ChefAiService();

// Also export class for custom configurations
export { ChefAiService };
