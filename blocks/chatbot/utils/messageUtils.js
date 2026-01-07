/**
 * Message Utilities
 * Helper functions for message formatting and manipulation
 */

/**
 * Format message for Gifted Chat
 * @param {string} text - Message text
 * @param {object} user - User object
 * @param {string} id - Message ID
 * @returns {object} Formatted message object
 */
export function formatMessage(text, user, id = null) {
  return {
    _id: id ?? Math.random().toString(36).substring(7),
    text,
    createdAt: new Date(),
    user,
  };
}

/**
 * Create user object
 * @param {number} id - User ID
 * @param {string} name - User name
 * @param {string} avatar - Avatar URL (optional)
 * @returns {object} User object
 */
export function createUser(id, name, avatar = null) {
  const user = {
    _id: id,
    name,
  };

  if (avatar) {
    user.avatar = avatar;
  }

  return user;
}

/**
 * Extract text from message
 * @param {object} message - Message object
 * @returns {string} Message text
 */
export function extractMessageText(message) {
  return message?.text ?? '';
}

/**
 * Filter messages by user
 * @param {Array} messages - Array of messages
 * @param {number} userId - User ID to filter by
 * @returns {Array} Filtered messages
 */
export function filterMessagesByUser(messages, userId) {
  return messages.filter((msg) => msg.user._id === userId);
}

/**
 * Get conversation summary for context
 * @param {Array} messages - Array of messages
 * @param {number} limit - Number of recent messages to include
 * @returns {string} Conversation summary
 */
export function getConversationContext(messages, limit = 5) {
  const recentMessages = messages.slice(-limit);
  return recentMessages
    .map((msg) => `${msg.user.name}: ${msg.text}`)
    .join('\n');
}

/**
 * Validate message object
 * @param {object} message - Message to validate
 * @returns {boolean} True if valid
 */
export function isValidMessage(message) {
  return (
    message
    && typeof message === 'object'
    && message._id
    && message.text
    && message.user
    && message.user._id
  );
}

/**
 * Sanitize message text (basic XSS prevention)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default {
  formatMessage,
  createUser,
  extractMessageText,
  filterMessagesByUser,
  getConversationContext,
  isValidMessage,
  sanitizeText,
};
