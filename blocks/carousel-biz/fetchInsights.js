import { ENDPOINTS, SUBSCRIPTION_KEY, DEFAULT_PARAMS } from './constants/api.js';

const recommendationsData = await fetch('/blocks/carousel-biz/recommendation_response.json').then((r) => r.json());
const trendMapData = await fetch('/blocks/carousel-biz/trends.json').then((r) => r.json());
const businessTypesData = await fetch('/blocks/carousel-biz/business_types.json').then((r) => r.json());

const MOCK_RECOMMENDATIONS = recommendationsData.recommendations || [];
const MOCK_BUSINESS_TYPES = businessTypesData.business_types || [];
const TREND_MAP = trendMapData;

// Enable mock data fallback when API is unavailable !!!
const USE_MOCK_FALLBACK = true;
const USE_MOCK_BUSINESS_TYPES = true;

// Transform API response to carousel card format
function transformRecommendation(recommendation) {
  if (!recommendation.trends || recommendation.trends.length === 0) {
    return null;
  }

  // Get primary trend (first in array)
  const primaryTrend = recommendation.trends[0];
  const trendConfig = TREND_MAP[primaryTrend.trend_id];

  if (!trendConfig) {
    return null;
  }

  // Determine if cross-trend (multiple trends) NOT SURE ABOUT THIS, VERIFY!!!
  // If trends are [Borderless, Street Food] → trendName
  // becomes "Borderless Cuisine + Street Food Couture" ??
  const isCrossTrend = recommendation.trends.length > 1;
  const trendClass = isCrossTrend ? 'cross-trend' : trendConfig.class;
  const trendName = isCrossTrend
    ? recommendation.trends.map((t) => TREND_MAP[t.trend_id]?.name).filter(Boolean).join(' + ')
    : trendConfig.name;

  // Use cross-trend image if multiple trends, otherwise use trend-specific image
  const bgImage = isCrossTrend
    ? '/blocks/carousel-biz/mock-images/cross-trend.jpg'
    : trendConfig.image;

  return {
    id: recommendation.id,
    trendName,
    trendClass,
    stat: recommendation.stat || '',
    description: recommendation.title,
    link: {
      // Generate placeholder CTA - update when real URLs are available!!
      href: '#',
      text: 'Check the trend',
    },
    bgImage,
    isCrossTrend,
  };
}

/**
 * Fetch insights from the recommendations API
 * @param {Object} options - Query parameters
 * @param {string} options.business_type_id - Optional business type filter
 * @param {string} options.user_id - User ID (default: 'user123')
 * @returns {Promise<Array>} Array of transformed insight cards
 */
export default async function fetchInsights(options = {}) {
  const params = new URLSearchParams({
    ...DEFAULT_PARAMS,
    ...options,
  });

  const headers = {
    'X-Subscription-Key': SUBSCRIPTION_KEY,
    'X-User-ID': options.user_id || 'user123',
    'X-Source': 'chefai-ui',
  };

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}?${params}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        // No recommendations found - use mock data if enabled
        if (USE_MOCK_FALLBACK) {
          // eslint-disable-next-line no-console
          console.warn('API returned 404, using mock data');
          return MOCK_RECOMMENDATIONS.map(transformRecommendation).filter(Boolean);
        }
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    // If no recommendations and mock fallback is enabled
    if (recommendations.length === 0 && USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('No API data available, using mock data');
      return MOCK_RECOMMENDATIONS.map(transformRecommendation).filter(Boolean);
    }

    // Transform and filter out invalid entries
    return recommendations
      .map(transformRecommendation)
      .filter(Boolean);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch insights:', error);

    // Use mock data as fallback on error
    if (USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('Using mock data due to API error');
      return MOCK_RECOMMENDATIONS.map(transformRecommendation).filter(Boolean);
    }

    return [];
  }
}

/**
 * Fetch business types for dropdown filter
 * @param {string} languageCode - Language code (default: 'en')
 * @returns {Promise<Array>} Array of business types
 */
export async function fetchBusinessTypes(languageCode = 'en') {
  // Use mock data when API is not ready
  if (USE_MOCK_BUSINESS_TYPES) {
    return MOCK_BUSINESS_TYPES;
  }

  const params = new URLSearchParams({ language_code: languageCode });
  const headers = {
    'X-Subscription-Key': SUBSCRIPTION_KEY,
  };

  try {
    const response = await fetch(`${ENDPOINTS.businessTypes}?${params}`, { headers });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.business_types || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch business types:', error);
    return [];
  }
}
