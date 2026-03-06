## ChefAI Chatbot helpers

This folder contains the shared helpers and React UI used to render the ChefAI chatbot inline on content pages and inside modals and the personalised hub.

The code is organised into clear layers so the team can quickly find API calls, hooks, UI, and message formatting logic. A root `index.js` re-exports the public API (`openChatbotModal`, `sendMessage`) for `import { openChatbotModal, sendMessage } from '@helpers/chatbot'`.

### Folder structure

- **`view/`** (entry points):
  - `chatbot.js`: Inline chatbot entry that mounts the widget into authored content, loads `ui/chatbot.css`, resolves the endpoint via `getMetadata`, and lazy‑loads `ChatWidget`. This is used via helpers/imports, not as a standalone AEM block anymore.
  - `openChatbotModal.js`: Opens the ChefAI chatbot in a modal. Uses a singleton modal and React root; when closed with `keepInDomOnClose`, the overlay is hidden (not removed) so reopening reuses the same DOM and keeps images cached. Re‑render uses `key={getStoredThreadId() ?? type}` so switching threads gets a fresh widget. Import from `@helpers/chatbot/view/openChatbotModal.js` or `@helpers/chatbot`.
- **`api/`**:
  - `chatApi.js`: Endpoint selection (`setEndpoint` / `getEndpoint`), user/thread resolution, and `postChatMessage` with timeout support.
  - `streamingChat.js`: High‑level SSE orchestration (`sendStreamingMessage`) that combines `chatApi`, `sseStream`, and `responseFormatter`.
  - `sendMessage.js`: Non‑streaming helper that posts one message via `chatApi.postChatMessage` and returns a formatted response; used by other features (e.g. personalised hub) when full SSE streaming is not needed. Import from `@helpers/chatbot/api/sendMessage.js` or `@helpers/chatbot`.
  - `sseStream.js`: Low‑level SSE client based on `fetch` and `ReadableStream`.
  - `responseFormatter.js`: Maps raw API responses into internal `ChatMessage` objects and collects images, recipes, products, and suggested prompts into `metadata`.
  - `createChefAIUser.js`: Helper for creating ChefAI users from other parts of the site.
- **`hooks/`**:
  - `useChatHistory.js`: Unified history for all types (`insights`, `quick-actions`, main chat). Uses a single-slot sessionStorage cache; when cache is empty or for a different thread, loads from API via `getHistoryWithFallback`. Validates/creates threads for main chat, merges quick‑action headlines, and persists history on change.
  - `useStreamingChat.js`: Manages message sending, SSE connection lifecycle, placeholder AI message, errors, and personalised‑hub trigger behaviour.
  - `useScrollToEnd.js`: Keeps the chat scrolled to the most recent message and controls the mobile “scroll to bottom” button.
  - `useQuickActionsEvents.js`: Listens for `chefai:quick-action` and `chefai:insights` events and injects headline messages using the shared message model.
- **`ui/`**:
  - `ChatWidget.js`: Main widget composition; wires hooks (`useChatHistory`, `useStreamingChat`, `useScrollToEnd`, `useQuickActionsEvents`) and passes data to the layout.
  - `ChatLayout.js`: Stateless layout built with `window.React.createElement`; renders the message list, `ChatInput`, error banner, and scroll button.
  - `MessageBubble.js`: Message renderer responsible for text, images, recipes and recipe details, in‑message product carousel, timestamps, and suggested prompts. Uses `messageFormatter.js` for link conversion, recipe section/details rendering, and shared carousel card rendering. Renders the first bold paragraph in message body as an h2 (`.message-body-title`).
  - `messageFormatter.js`: Pure helpers used by `MessageBubble`: `bubbleStyles`, `promoteFirstBoldParagraphToH2`, `renderHeadline`, `renderBodyText`, `getItemDisplayTitle`, `getRecipeDetailTitle`, `convertLinksToClickable`, `renderRecipesSection`, `renderRecipeDetails`, `renderCarouselCard`. No React state or hooks.
  - `SuggestedPrompts.js`: Reusable chip list of suggested prompts.
  - `chatbot.css`: All visual styling for the inline and modal chatbot, including message bubbles and in‑message carousels (imports `carousel/carousel.css` and `skeleton/skeleton.css`). Chatbot carousels show navigation arrows on all viewports; on mobile, controls stack (indicators above, arrows below) to avoid overlap.
  - `skeleton/`: Image loading placeholders used inside `MessageBubble` (recipe/product cards, metadata images):
    - `ImageSkeleton.js`: Placeholder component (e.g. 200×115) that hides once the image has loaded.
    - `skeleton.css`: Styles for the skeleton shimmer and wrapper.
- **`model/`**:
  - `messageModel.js`: Canonical message model utilities:
    - `USER_ID` / `AI_ID` constants used across widgets.
    - `formatMessageText(rawText)` which uses `window.marked` and `window.DOMPurify.sanitize` when available, falling back to safe escaping.
    - `buildHeadlineMessage({ threadId, headlineText, createdAt, type })` used by history and quick‑action flows.

All files in this folder contain real logic; there are no wrapper‑only modules that just re‑export from other files.

### Architecture overview

```mermaid
flowchart TD
  subgraph viewLayer [View / entry]
    chatbotJs[view/chatbot.js]
    openChatbotModalJs[view/openChatbotModal.js]
  end

  subgraph uiLayer [UI]
    chatWidgetJs[ui/ChatWidget.js]
    chatLayoutJs[ui/ChatLayout.js]
    messageBubbleJs[ui/MessageBubble.js]
    messageFormatterJs[ui/messageFormatter.js]
    suggestedPromptsJs[ui/SuggestedPrompts.js]
  end

  subgraph hooksLayer [Hooks]
    useChatHistoryJs[hooks/useChatHistory]
    useStreamingChatJs[hooks/useStreamingChat]
    useScrollToEndJs[hooks/useScrollToEnd]
    useQuickActionsEventsJs[hooks/useQuickActionsEvents]
  end

  subgraph apiLayer [API]
    chatApiJs[api/chatApi]
    streamingChatJs[api/streamingChat]
    sendMessageJs[api/sendMessage]
    sseStreamJs[api/sseStream]
    responseFormatterJs[api/responseFormatter]
    createChefAIUserJs[api/createChefAIUser]
  end

  subgraph modelLayer [Model]
    messageModelJs[model/messageModel]
  end

  chatbotJs --> chatWidgetJs
  openChatbotModalJs --> chatWidgetJs

  chatWidgetJs --> chatLayoutJs
  chatLayoutJs --> messageBubbleJs
  messageBubbleJs --> messageFormatterJs
  messageBubbleJs --> suggestedPromptsJs

  chatWidgetJs --> useChatHistoryJs
  chatWidgetJs --> useStreamingChatJs
  chatWidgetJs --> useScrollToEndJs
  chatWidgetJs --> useQuickActionsEventsJs

  useStreamingChatJs --> streamingChatJs
  streamingChatJs --> chatApiJs
  streamingChatJs --> sseStreamJs
  streamingChatJs --> responseFormatterJs
  chatApiJs --> createChefAIUserJs

  messageBubbleJs --> messageModelJs
  useQuickActionsEventsJs --> messageModelJs
```

### Message and data flow

```mermaid
flowchart TD
  userInput["User types or selects prompt"]
  handleSendFn[ChatWidget handleSend]
  useStreamingChatHook[hooks/useStreamingChat]
  sendStreamingMsgFn[api/streamingChat.sendStreamingMessage]
  postChatMsgFn[api/chatApi.postChatMessage]
  sseClient[api/sseStream connectToAgentRunStream]
  responseFormatterFn[api/responseFormatter.formatResponse]
  messageModelFn[model/messageModel.formatMessageText]
  uiRender[ui/MessageBubble render]

  userInput --> handleSendFn --> useStreamingChatHook
  useStreamingChatHook --> sendStreamingMsgFn
  sendStreamingMsgFn --> sseClient
  sendStreamingMsgFn --> postChatMsgFn
  postChatMsgFn --> responseFormatterFn
  sseClient --> responseFormatterFn
  responseFormatterFn --> messageModelFn
  messageModelFn --> uiRender
  uiRender --> useScrollToEndHook[hooks/useScrollToEnd scroll]
```

Messages from the backend (including recipes, recipe_details, products, images, and suggested prompts) are normalised in `responseFormatter.js` and attached as `metadata` on each `ChatMessage`. The UI reads only from this model and runs text content through `formatMessageText`, ensuring any HTML is generated from markdown and sanitised with `DOMPurify` before being injected into the DOM. Images in `MessageBubble` use `ui/skeleton/ImageSkeleton` as a placeholder until loaded. The modal opened via `openChatbotModal` (from `view/openChatbotModal.js`) keeps the overlay in the DOM on close (see `@helpers/modal/caching.js`) so that reopening reuses the same content and avoids reloading images.

