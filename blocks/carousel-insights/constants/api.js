import { SUBSCRIPTION_KEY, ENDPOINTS } from '@components/chatbot/constants/api.js';

export { SUBSCRIPTION_KEY };

/**
 * Load recommendations from mock data file
 * @param {Object} options - Request options (for future API compatibility)
 * @param {number} options.limit - Number of items to return (ignored for mock data - returns all)
 * @param {number} options.offset - Offset for pagination (ignored for mock data - returns all)
 * @returns {Promise<Array>} Array of recommendation items
 */
export async function fetchPaginatedData(options = {}) {
  try {
    // Load mock data from JSON file
    const response = await fetch('/blocks/carousel-insights/mock-data/recommendations.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load mock data: ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations ?? [];

    // For mock data, return all items (no pagination)
    // When switching to real API, uncomment pagination logic below
    return recommendations;

    // Pagination logic (for future API integration):
    // const { limit = 3, offset = 0 } = options;
    // const startIndex = offset;
    // const endIndex = startIndex + limit;
    // return recommendations.slice(startIndex, endIndex);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch paginated data:', error);
    throw error;
  }
}
