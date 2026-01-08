/**
 * Chef AI Service
 * Handles API communication with the Chef AI middleware/backend
 * Supports multiple endpoints (Capgemini LLM, Formula 1, UFS internal)
 */

/**
 * Configuration for Chef AI API endpoints
 */
const API_CONFIG = {
  // Azure Chef AI API endpoints
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
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
  // eslint-disable-next-line class-methods-use-this
  getThreadId() {
    let threadId = sessionStorage.getItem('chef-ai-thread-id');
    if (!threadId) {
      // Generate UUID-like thread ID
      threadId = `${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('chef-ai-thread-id', threadId);
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
   * Get conversation history
   * @returns {Promise<Array>} Array of messages
   */
  // eslint-disable-next-line class-methods-use-this
  async getHistory() {
    // Placeholder for history retrieval
    // Can be implemented to fetch from localStorage, sessionStorage, or API
    try {
      const history = sessionStorage.getItem('chef-ai-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to retrieve history:', error);
      return [];
    }
  }

  /**
   * Save conversation history
   * @param {Array} messages - Array of messages
   */
  // eslint-disable-next-line class-methods-use-this
  async saveHistory(messages) {
    try {
      sessionStorage.setItem('chef-ai-history', JSON.stringify(messages));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Clear conversation history
   */
  // eslint-disable-next-line class-methods-use-this
  async clearHistory() {
    try {
      sessionStorage.removeItem('chef-ai-history');
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
