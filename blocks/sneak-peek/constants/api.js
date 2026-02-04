export const SUBSCRIPTION_KEY = 'hGyKufXGJsFbf-_vR67onc-BLjZ4QdhOrIc-u6RTsLM';

export const API_BASE_URL = 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1';

export const ENDPOINTS = {
  recommendations: `${API_BASE_URL}/recommendations/`,
  businessTypes: 'https://api-hub-we.azure-api.net/chefaibe/st/utility/business-types',
};

// Default query parameters
export const DEFAULT_PARAMS = {
  country_code: 'BE',
  language_code: 'en',
  type: 'main',
  limit: 10,
  is_sneakpeek: true,
};
