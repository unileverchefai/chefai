/**
 * Chatbot Configuration
 * Manages chatbot configuration from metadata and environment detection
 * Priority: Block metadata > Defaults
 */

import { getMetadata } from '../../scripts/aem.js';

/**
 * Get chatbot configuration
 * @returns {object} Chatbot configuration
 */
export function getChatbotConfig() {
  const defaultConfig = {
    endpoints: {
      capgemini: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
      formula1: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
      ufs: 'https://api-hub-we.azure-api.net/chefaibe/st/api/v1/chat/message',
    },
    defaultEndpoint: 'capgemini',
    timeout: 30000,
    retryAttempts: 2,
    features: {
      voiceInput: false,
      fileUpload: false,
      historyPersistence: true,
    },
  };

  const metadataConfig = {
    endpoint: getMetadata('chatbot-endpoint'),
    apiUrl: getMetadata('chatbot-api-url'),
    timeout: getMetadata('chatbot-timeout'),
    voiceInput: getMetadata('chatbot-voice-input'),
    fileUpload: getMetadata('chatbot-file-upload'),
  };

  const config = { ...defaultConfig };

  if (metadataConfig.endpoint) {
    config.defaultEndpoint = metadataConfig.endpoint;
  }

  if (metadataConfig.apiUrl) {
    const endpoint = metadataConfig.endpoint ?? 'capgemini';
    config.endpoints[endpoint] = metadataConfig.apiUrl;
  }

  if (metadataConfig.timeout) {
    const timeoutValue = parseInt(metadataConfig.timeout, 10);
    if (!Number.isNaN(timeoutValue)) {
      config.timeout = timeoutValue;
    }
  }

  if (metadataConfig.voiceInput) {
    config.features.voiceInput = metadataConfig.voiceInput === 'true';
  }

  if (metadataConfig.fileUpload) {
    config.features.fileUpload = metadataConfig.fileUpload === 'true';
  }

  return config;
}

/**
 * Get environment configuration based on hostname
 * @returns {object} Environment configuration
 */
export function getEnvironmentConfig() {
  const { hostname } = window.location;

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return { environment: 'development', debug: true };
  }

  if (hostname.includes('.aem.page')) {
    return { environment: 'preview', debug: false };
  }

  if (hostname.includes('.aem.live')) {
    return { environment: 'production', debug: false };
  }

  return { environment: 'unknown', debug: false };
}

/**
 * Get complete configuration (chatbot + environment)
 * @returns {object} Complete configuration
 */
export function getCompleteConfig() {
  return {
    ...getChatbotConfig(),
    ...getEnvironmentConfig(),
  };
}

export default {
  getChatbotConfig,
  getEnvironmentConfig,
  getCompleteConfig,
};
