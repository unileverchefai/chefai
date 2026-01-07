/**
 * Chef AI Service
 * Handles API communication with the Chef AI middleware/backend
 * Supports multiple endpoints (Capgemini LLM, Formula 1, UFS internal)
 */

/**
 * Configuration for Chef AI API endpoints
 */
const API_CONFIG = {
  // API endpoints - currently using mock responses
  endpoints: {
    capgemini: '/api/chat/capgemini',
    formula1: '/api/chat/formula1',
    ufs: '/api/chat/ufs',
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
   * @returns {Promise<object>} API response
   */
  async sendMessage(message) {
    // Mock mode for development - returns fake responses
    // TODO: Replace with real API when ready
    return this.getMockResponse(message);
  }

  /**
   * Get mock response for development
   * @returns {Promise<object>} Mock response
   */
  // eslint-disable-next-line no-unused-vars
  async getMockResponse() {
    // Simulate API delay
    await this.delay(800 + Math.random() * 700);

    const responses = [
      "That's a great question about culinary trends! Let me help you with that.",
      'As a Chef AI assistant, I can provide insights on menu planning and cost optimization.',
      "I'd be happy to help you with recipe ideas and ingredient suggestions.",
      'Based on current trends, here are some recommendations for your menu.',
      "Let's explore some creative culinary solutions for your needs.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: `${randomResponse}\n\n(Note: This is a mock response. Real API will be connected later.)`,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Chef AI',
        avatar: '/icons/chef-ai-avatar.svg',
      },
      metadata: {
        mock: true,
      },
    };
  }

  /**
   * Utility: Delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  // eslint-disable-next-line class-methods-use-this
  delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
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
