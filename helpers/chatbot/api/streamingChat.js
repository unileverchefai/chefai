import {
  resolveUserId,
  resolveThreadId,
  postChatMessage,
} from './chatApi.js';
import { generateRunId, connectToAgentRunStream } from './sseStream.js';
import formatResponse, { parseStreamingEvent } from './responseFormatter.js';

/**
 * Send a chat message with SSE streaming support.
 * Falls back to non-streaming mode if SSE fails.
 *
 * @param {string} message - The user's message
 * @param {Object} options - Configuration options
 * @param {Function} options.onChunk - Callback when new text chunks arrive (text: string)
 * @param {Function} options.onComplete - Callback when streaming completes (fullMessage: Object)
 * @param {Function} options.onError - Callback for errors (error: Error)
 * @param {Function} options.onMetadata - Callback when metadata is received (metadata: Object)
 * @returns {Promise<Object>} - Control object with disconnect() method
 */
export default async function sendStreamingMessage(message, options = {}) {
  const {
    onChunk = () => {},
    onComplete = () => {},
    onError = () => {},
    onMetadata = () => {},
  } = options;

  const userId = await resolveUserId(options.user_id);

  const skipCache = options.skipCache ?? false;
  const threadId = await resolveThreadId({
    userId,
    threadId: options.thread_id ?? null,
    skipCache,
  });

  // Accumulate streaming text and metadata
  let accumulatedText = '';
  let streamingMetadata = {};
  let finalResponse = null;
  let sseConnection = null;
  let hasCompleted = false;

  // Step 1: Generate unique run_id BEFORE connecting
  const runId = generateRunId();

  // Step 2: Connect to SSE BEFORE sending API request
  let sseConnected = false;
  let sseError = null;

  // Control object to return
  const controlObject = {
    disconnect: () => {
      if (sseConnection) {
        sseConnection.disconnect();
      }
    },
    isConnected: () => (sseConnection && sseConnection.isConnected()) || false,
  };

  // Start async operations
  (async () => {
    try {
      sseConnection = connectToAgentRunStream(runId, {
        onOpen: () => {
          sseConnected = true;
        },
        onEvent: (event) => {
          const textChunk = parseStreamingEvent(event);

          if (textChunk) {
            // Ensure space between chunks if needed
            if (accumulatedText
                && !/\s$/.test(accumulatedText)
                && !/^\s/.test(textChunk)) {
              accumulatedText += ' ';
            }
            accumulatedText += textChunk;
            onChunk(accumulatedText);
          }

          if (event.metadata) {
            streamingMetadata = { ...streamingMetadata, ...event.metadata };
            onMetadata(streamingMetadata);
          }

          if (event.raw) {
            if (!finalResponse) {
              finalResponse = { ...event.raw };
            } else {
              // Merge event data
              finalResponse = { ...finalResponse, ...event.raw };
            }
          }
        },
        onDone: () => {
          // Don't call onComplete here - wait for API response
          // The API response handler will call onComplete with the formatted message
        },
        onError: (error) => {
          sseError = error;
        },
        onClose: () => {
          // Connection closed
        },
      });

      // Give SSE a moment to establish connection
      await new Promise((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      // If SSE connection failed, fallback immediately
      if (sseError && !sseConnected) {
        throw new Error('SSE connection failed');
      }

      // Step 3: Send API request with the SAME run_id (only API fields, no callbacks)
      const apiResponseData = await postChatMessage({
        message,
        threadId,
        userId,
        country: options.country,
        runId,
        enableMetadata: true,
        timeout: options.timeout,
      });

      if (!finalResponse) {
        finalResponse = apiResponseData;
      } else {
        finalResponse = { ...finalResponse, ...apiResponseData };
      }

      const formattedMessage = formatResponse(apiResponseData);
      const fullMessageText = formattedMessage.text;

      if (fullMessageText) {
        const startText = accumulatedText || '';
        const remainingText = fullMessageText.startsWith(startText)
          ? fullMessageText.substring(startText.length)
          : fullMessageText;

        const words = remainingText.split(/(\s+)/);
        let currentText = startText;
        const chunkSize = 3;

        const streamChunks = async () => {
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join('');
            currentText += chunk;
            accumulatedText = currentText;

            onChunk(currentText);

            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => {
              setTimeout(() => resolve(), 20);
            });
          }
        };
        await streamChunks();

        accumulatedText = fullMessageText;
      }

      const finalMessage = {
        ...formattedMessage,
        metadata: {
          ...formattedMessage.metadata,
          run_id: runId,
          thread_id: threadId,
          ...streamingMetadata,
        },
      };

      if (!hasCompleted) {
        hasCompleted = true;
        onComplete(finalMessage);
      }
    } catch (error) {
      if (sseConnection) {
        sseConnection.disconnect();
      }

      try {
        const response = await postChatMessage({
          message,
          threadId,
          userId,
          country: options.country,
          timeout: options.timeout,
        });

        const formatted = formatResponse(response);
        onComplete(formatted);
      } catch (fallbackError) {
        onError(fallbackError);
      }
    }
  })();

  return controlObject;
}
