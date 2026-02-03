# Carousel AJAX Test Block

A test block that demonstrates AJAX-based lazy loading for carousel content. The carousel loads the first batch of items initially, and automatically loads more items as the user scrolls/navigates through the carousel.

## Features

- **SSR Compatible**: Works with Edge Delivery Services server-side rendering
- **Progressive Enhancement**: Enhances server-rendered content or loads via AJAX
- **Initial Load**: Loads the first batch of items (configurable via `limit`)
- **Lazy Loading**: Automatically loads more items when user scrolls near the end
- **Pagination**: Uses offset/limit pattern for API requests
- **Scroll Detection**: Monitors carousel position and triggers loading when near the end
- **Loading Indicator**: Shows a loading message while fetching more items
- **Error Handling**: Gracefully handles API errors and empty responses
- **No-JS Fallback**: Displays content even if JavaScript fails

## Usage

### Client-Side Only (AJAX Loading)

Add the block to your HTML with data attributes for configuration:

```html
<div class="carousel-ajax-test" 
     data-user-id="user123" 
     data-limit="5" 
     data-is-saved="false">
</div>
```

### Server-Side Rendered (SSR Compatible)

The block supports EDS SSR. You can provide initial content that will be enhanced:

```html
<div class="carousel-ajax-test" 
     data-user-id="user123" 
     data-limit="5" 
     data-is-saved="false">
  <div data-thread-id="thread-1" data-display-text="First Item" data-updated-at="2026-02-03T06:29:44.419000">
    <h2>First Item</h2>
  </div>
  <div data-thread-id="thread-2" data-display-text="Second Item" data-updated-at="2026-02-03T05:49:46.994000">
    <h2>Second Item</h2>
  </div>
</div>
```

The block will:
1. Use server-rendered content if present (progressive enhancement)
2. Convert it to carousel structure
3. Load additional items via AJAX when user scrolls
4. Work even if JavaScript fails (shows initial content)

### Data Attributes

- `data-user-id` (required): User ID for API requests
- `data-limit` (optional, default: 5): Number of items to load per request
- `data-is-saved` (optional, default: false): Filter for saved threads

## API Integration

The block uses the `/api/v1/chat/users/threads` endpoint with the following query parameters:

- `user_id`: User identifier
- `limit`: Number of items per page
- `offset`: Starting position for pagination
- `is_saved` (optional): Filter for saved threads

## How It Works

### With Server-Rendered Content (SSR)
1. **Parse Content**: Block detects and parses server-rendered HTML (table rows or divs)
2. **Convert to Cards**: Transforms server content into carousel card structure
3. **Enhance**: Initializes carousel with existing content
4. **Lazy Load**: Loads additional items via AJAX when user scrolls

### Without Server Content (Client-Side Only)
1. **Initial Load**: On block initialization, fetches the first batch of items (offset: 0)
2. **Render Cards**: Displays items as cards in a carousel
3. **Scroll Detection**: Monitors carousel navigation (arrows, indicators, touch/mouse drag)
4. **Lazy Load**: When user scrolls within 30% of the end, triggers loading of next batch
5. **Append Items**: New items are appended to the carousel and carousel is reinitialized
6. **Stop Loading**: Stops when API returns fewer items than requested (end of data)

### Progressive Enhancement
- If JavaScript fails, server-rendered content is still visible
- Block gracefully degrades to static content display
- No breaking errors if API calls fail

## File Structure

```
carousel-ajax-test/
├── carousel-ajax-test.js    # Main block logic
├── carousel-ajax-test.css   # Block styles
├── constants/
│   └── api.js              # API utility functions
└── README.md               # This file
```

## Customization

To use with a different API endpoint, modify `constants/api.js`:

1. Update the `ENDPOINTS` object with your endpoint
2. Adjust the `fetchPaginatedData` function to match your API response format
3. Update the `renderCard` function in `carousel-ajax-test.js` to match your data structure
