import formatResponse from './responseFormatter.js';
import {
  resolveUserId,
  resolveThreadId,
  postChatMessage,
} from './chatApi.js';

export default async function sendMessage(message, options = {}) {
  try {
    const userId = await resolveUserId(options.user_id);
    const skipCache = options.skipCache ?? false;
    const threadId = await resolveThreadId({
      userId,
      threadId: options.thread_id ?? null,
      skipCache,
    });

    const apiResponse = await postChatMessage({
      message,
      threadId,
      userId,
      country: options.country,
      timeout: options.timeout,
    });

    return formatResponse(apiResponse);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API request failed:', error);
    throw error;
  }
}
