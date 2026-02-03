import { API_BASE_URL, SUBSCRIPTION_KEY } from './constants/api.js';

/**
 * Generate a unique run_id for each chat message.
 * Format: "run-{timestamp}-{random}"
 *
 * IMPORTANT: Generate this BEFORE connecting to SSE and sending API request!
 */
export function generateRunId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `run-${timestamp}-${random}`;
}

/**
 * Establish SSE connection to receive real-time agent events.
 *
 * @param {string} runId - The run ID to listen to
 * @param {Object} options - Configuration options
 * @param {Function} options.onEvent - Callback for each event received
 * @param {Function} options.onDone - Callback when agent run completes
 * @param {Function} options.onError - Callback for errors
 * @param {Function} options.onOpen - Callback when connection opens
 * @param {Function} options.onClose - Callback when connection closes
 * @returns {Object} - Connection control object with disconnect() method
 */
export function connectToAgentRunStream(runId, options = {}) {
  const {
    onEvent = () => {},
    onDone = () => {},
    onError = () => {},
    onOpen = () => {},
    onClose = () => {},
  } = options;

  const url = `${API_BASE_URL}/agent/runs/${encodeURIComponent(runId)}/events`;

  // Track seen event IDs to prevent duplicates
  const seenEventIds = new Set();

  // Use fetch with streaming for better control and header support
  const abortController = new AbortController();
  let isConnected = false;

  const headers = {};
  if (SUBSCRIPTION_KEY) {
    headers['X-Subscription-Key'] = SUBSCRIPTION_KEY;
  }

  fetch(url, {
    method: 'GET',
    headers,
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      isConnected = true;
      onOpen();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = 'message';

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          // eslint-disable-next-line no-restricted-syntax
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
              // eslint-disable-next-line no-continue
              continue;
            }

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                onDone();
                currentEventType = 'message';
                // eslint-disable-next-line no-continue
                continue;
              }

              if (!data) {
                // eslint-disable-next-line no-continue
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                const phase = parsed.phase || parsed.step_type || parsed.type;
                const status = parsed.status || parsed.state;
                const message = parsed.message || parsed.human_message
                  || parsed.description || parsed.step || phase;
                const sequence = parsed.sequence || parsed.order || parsed.seq || 0;
                const createdAt = parsed.created_at || parsed.timestamp || parsed.time
                  || new Date().toISOString();
                const eventRunId = parsed.run_id || runId;

                // Generate event ID
                const eventId = parsed.event_id || parsed.id
                  || `${currentEventType}-${phase}-${sequence}-${Date.now()}`;

                if (seenEventIds.has(eventId)) {
                  currentEventType = 'message';
                  // eslint-disable-next-line no-continue
                  continue;
                }
                seenEventIds.add(eventId);

                // Create standardized event object
                const agentEvent = {
                  eventId,
                  runId: eventRunId,
                  type: phase || 'unknown',
                  status: status || undefined,
                  message: message || undefined,
                  createdAt,
                  sequence,
                  metadata: parsed.payload || parsed.details || parsed.data || parsed.metadata,
                  raw: parsed,
                };

                // Call event handler
                onEvent(agentEvent);

                // Check for terminal status
                const isTerminalPhase = phase === 'run_completed' || phase === 'completed' || phase === 'failed';
                const isTerminalStatus = status && ['success', 'error', 'failed', 'completed'].includes(status.toLowerCase());

                if (isTerminalPhase || isTerminalStatus) {
                  onDone(agentEvent);
                }

                currentEventType = 'message';
              } catch (parseError) {
                // Silently skip invalid event data
                currentEventType = 'message';
              }
            }
          }
        }
      } catch (readError) {
        if (readError.name !== 'AbortError') {
          onError(readError);
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    })
    .finally(() => {
      isConnected = false;
      onClose();
    });

  // Return control object
  return {
    disconnect: () => {
      abortController.abort();
    },
    isConnected: () => isConnected,
  };
}
