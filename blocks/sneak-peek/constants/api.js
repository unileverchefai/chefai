export const SUBSCRIPTION_KEY = 'hGyKufXGJsFbf-_vR67onc-BLjZ4QdhOrIc-u6RTsLM';

export const API_BASE_URL = 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1';

export const ENDPOINTS = {
  recommendations: `${API_BASE_URL}/recommendations/`,
  businessTypes: 'https://api-hub-we.azure-api.net/chefaibe/st/utility/business-types',
};

// Default query parameters
export const DEFAULT_PARAMS = {
  current_date: '2026-01-20T00:00:00Z',
  is_sneakpeek: true,
  limit: 3,
  refresh: false,
  type: 'main',
};
