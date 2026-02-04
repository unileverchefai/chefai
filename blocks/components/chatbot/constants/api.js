export const SUBSCRIPTION_KEY = 'hGyKufXGJsFbf-_vR67onc-BLjZ4QdhOrIc-u6RTsLM';

export const API_BASE_URL = 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1';

export const ENDPOINTS = {
  capgemini: `${API_BASE_URL}/chat/message`,
  businessInfo: `${API_BASE_URL}/business/info`,
  businessDetails: `${API_BASE_URL}/business/details`,
  businessTypesUtility: 'https://api-hub-we.azure-api.net/chefaibe/st/utility/business-types',
  users: `${API_BASE_URL}/users`,
  agentRunEvents: (runId) => `${API_BASE_URL}/agent/runs/${encodeURIComponent(runId)}/events`,
  createThread: `${API_BASE_URL}/chat/threads`,
  getThreadInfo: `${API_BASE_URL}/chat/threads/info`,
  getUserThreads: `${API_BASE_URL}/chat/users/threads`,
  getThreadMessages: `${API_BASE_URL}/chat/threads/messages`,
  recommendations: `${API_BASE_URL}/recommendations`,
};
