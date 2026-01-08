/**
 * Chatbot Configuration
 * Manages configuration from block metadata and environment
 */

import { getMetadata } from '../../scripts/aem.js';

/**
 * Get chatbot configuration from various sources
 * Priority: Block metadata > Environment variables > Defaults
 */
export function getChatbotConfig() {
  // Default configuration - Azure Chef AI API
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

  // Get configuration from metadata
  const metadataConfig = {
    endpoint: getMetadata('chatbot-endpoint'),
    apiUrl: getMetadata('chatbot-api-url'),
    timeout: getMetadata('chatbot-timeout'),
    voiceInput: getMetadata('chatbot-voice-input'),
    fileUpload: getMetadata('chatbot-file-upload'),
  };

  // Merge configurations
  const config = { ...defaultConfig };

  // Override endpoint if specified in metadata
  if (metadataConfig.endpoint) {
    config.defaultEndpoint = metadataConfig.endpoint;
  }

  // Override API URL if specified
  if (metadataConfig.apiUrl) {
    const endpoint = metadataConfig.endpoint ?? 'capgemini';
    config.endpoints[endpoint] = metadataConfig.apiUrl;
  }

  // Override timeout if specified
  if (metadataConfig.timeout) {
    const timeoutValue = parseInt(metadataConfig.timeout, 10);
    if (!Number.isNaN(timeoutValue)) {
      config.timeout = timeoutValue;
    }
  }

  // Override feature flags
  if (metadataConfig.voiceInput) {
    config.features.voiceInput = metadataConfig.voiceInput === 'true';
  }

  if (metadataConfig.fileUpload) {
    config.features.fileUpload = metadataConfig.fileUpload === 'true';
  }

  return config;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const { hostname } = window.location;

  // Detect environment based on hostname
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return {
      environment: 'development',
      debug: true,
    };
  }

  if (hostname.includes('.aem.page')) {
    return {
      environment: 'preview',
      debug: false,
    };
  }

  if (hostname.includes('.aem.live')) {
    return {
      environment: 'production',
      debug: false,
    };
  }

  return {
    environment: 'unknown',
    debug: false,
  };
}

/**
 * Get complete configuration merging all sources
 */
export function getCompleteConfig() {
  const chatbotConfig = getChatbotConfig();
  const envConfig = getEnvironmentConfig();

  return {
    ...chatbotConfig,
    ...envConfig,
  };
}

export default {
  getChatbotConfig,
  getEnvironmentConfig,
  getCompleteConfig,
};
