# ChefAI - AEM Edge Delivery Services Project

## Architecture Overview

This is an **Adobe Experience Manager (AEM) Edge Delivery Services** project built on the [AEM Boilerplate](https://github.com/adobe/aem-boilerplate). Content is authored in **Document Authoring (DA)** (https://docs.da.live/), the CMS for Edge Delivery Services, and automatically converted to semantic HTML.

**Key Components:**
- **Blocks** (`blocks/`): Self-contained UI components that decorate semantic HTML
- **Scripts** (`scripts/`): Core utilities (`aem.js`) and project helpers (`common.js`)
- **Styles** (`styles/`): Global CSS with CSS custom properties for theming
- **React Integration**: Chatbot block uses React 19 with ReactDOM loaded dynamically

## Block Development Pattern

Blocks are the fundamental building units. Each block follows this structure:

```
blocks/
  my-block/
    my-block.js    # Default export: decorate(block) or async function
    my-block.css   # Block-scoped styles
```

### Critical Block Convention

Every block **must** export a default function named `decorate` (or the block name for special cases like `chatbot`):

```javascript
// Standard pattern
export default function decorate(block) {
  // Manipulate block element
  block.classList.add('my-custom-class');
  // Transform children, add event listeners, etc.
}

// Async pattern for data fetching
export default async function decorate(block) {
  const data = await fetch('/api/data');
  // render data into block
}
```

**Never** use named exports for the main decorator - AEM's block loader expects `default`.

### Block Loading Lifecycle

1. AEM parses document tables and creates `<div class="blockname">` with nested divs
2. `decorateBlocks()` in `scripts.js` finds all blocks
3. Block's CSS/JS are lazy-loaded when block enters viewport
4. `decorate()` function transforms the semantic HTML structure
5. Block becomes interactive

## Import Patterns

**From blocks to scripts** (most common):
```javascript
import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';
import { createVideoEmbed, findVideoLink } from '../../scripts/common.js';
```

**Relative imports within blocks**:
```javascript
// chatbot/chatbot.js importing chatbot modules
import { loadReact } from './utils.js';
import { default as ChatWidget } from './ChatWidget.js';
```

## Styling Guidelines

### CSS Custom Properties (Design System)

The project uses **Unilever Food Solutions (UFS)** branding via CSS variables in `styles/styles.css`:

```css
:root {
  --ufs-orange: #FF5A00;
  --squid-ink: #221D37;
  --aubergine: #5C3657;
  --smoke: #94889D;
  
  /* Typography */
  --ff-unilever-shilling: 'UnileverShilling', sans-serif;
  --ff-chefs-hand: 'ChefsHand', cursive;
}
```

**Always use CSS variables** - never hardcode colors/fonts. Reference: [styles/styles.css](styles/styles.css#L13-L50)

**When implementing Figma designs:** Always consult `styles/styles.css` first and use existing CSS variables for colors, spacing, typography, etc. Prefer variables over px values from Figma to maintain design system consistency.

### Block CSS Naming

**BEM notation** Helper functions in [scripts/common.js](scripts/common.js) are available if needed:

- `variantClassesToBEM()` - Converts `large` → `hero__large`
- `getBEMTemplateName()` - Generates `hero__countdown` or `button__primary--large`

Standard nested selectors also work fine:
```css
.media-text-cards .media-title { }
.media-text-cards .cards-text h4 picture { }
```

### CSS Color Syntax

Use **modern CSS color function notation** to comply with stylelint rules:

```css
/* ✅ Correct - modern syntax */
background: rgb(0 0 0 / 30%);
background: rgb(255 90 0 / 50%);

/* ❌ Avoid - legacy syntax */
background: rgba(0, 0, 0, .3);
background: rgba(255, 90, 0, 0.5);
```

- Use `rgb()` instead of `rgba()`
- Use space-separated values (no commas)
- Use percentage for alpha values (e.g., `30%` not `.3`)
- Use slash `/` before alpha channel

## React Integration (Chatbot Block)

The chatbot block dynamically loads React 19 to avoid global bundle bloat:

**Key Files:**
- [blocks/chatbot/chatbot.js](blocks/chatbot/chatbot.js) - Entry point, loads React CDN
- [blocks/chatbot/ChatWidget.js](blocks/chatbot/ChatWidget.js) - React functional component
- [blocks/chatbot/utils.js](blocks/chatbot/utils.js) - Session storage helpers

**Pattern:**
```javascript
// Load React from CDN (see utils.js)
await loadReact();

// Access via window globals
const { useState, useEffect } = window.React;
const root = window.ReactDOM.createRoot(container);
root.render(window.React.createElement(ChatWidget));
```

**Why?** React is only needed for chatbot, so it's loaded on-demand rather than bundled globally.

## API Integration

**Chatbot API Configuration:**
- Base URL: `https://api-hub-we.azure-api.net/chefaibe/st/api/v1`
- Subscription key stored in [blocks/chatbot/constants/api.js](blocks/chatbot/constants/api.js)
- Endpoint selection via metadata: `<meta name="chatbot-endpoint" content="capgemini">`

**Request Pattern:**
```javascript
import sendMessage from './sendMessage.js';

const response = await sendMessage(userMessage, {
  user_id: 'user123',
  country: 'BE',
});
```

Session management uses `sessionStorage` for thread IDs and chat history.

## Development Workflow

### Local Development
```bash
# Install dependencies
npm i

# Start local server (requires @adobe/aem-cli globally)
aem up  # Opens http://localhost:3000
```

The `aem up` command proxies AEM.live content locally with live reload.

### Linting
```bash
npm run lint        # Check JS (ESLint) and CSS (Stylelint)
npm run lint:fix    # Auto-fix issues
```

**ESLint config:** Airbnb base + Babel parser for JSX (React in chatbot)  
**Code style:** Follow existing patterns - ESLint enforces import ordering, no-console warnings, etc.

## Video Handling Pattern

See [blocks/media-text-cards/media-text-cards.js](blocks/media-text-cards/media-text-cards.js#L1-L60) for modal pattern:

```javascript
import { createVideoEmbed, findVideoLink } from '../../scripts/common.js';

const videoLink = findVideoLink(container);
if (videoLink) {
  const videoUrl = videoLink.getAttribute('href');
  const embed = createVideoEmbed(videoUrl);
  // Open in modal with autoplay
}
```

Utility functions in `scripts/common.js` handle YouTube/Vimeo embed generation.

## Fragment Auto-Blocking

AEM automatically converts links to `/fragments/*` into embedded fragments:

```javascript
// From scripts/scripts.js buildAutoBlocks()
const fragments = main.querySelectorAll('a[href*="/fragments/"]');
// Dynamic import loads fragment content
import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
  // Fragment replaces link
});
```

This enables content reuse without manual block authoring.

## Common Pitfalls

1. **Missing default export** - Always `export default function decorate(block)`
2. **Hardcoded colors** - Use CSS variables from `:root`
3. **Importing React** - Access via `window.React`, not npm imports (except in ChatWidget.js)
4. **Block CSS paths** - Always relative: `../../scripts/aem.js`
5. **Metadata access** - Use `getMetadata('key')` not manual DOM queries

## File References

- **Block loading:** [scripts/scripts.js](scripts/scripts.js#L60-L80)
- **Core utilities:** [scripts/aem.js](scripts/aem.js) (721 lines of helpers)
- **Design tokens:** [styles/styles.css](styles/styles.css#L13-L50)
- **React loader:** [blocks/chatbot/utils.js](blocks/chatbot/utils.js)
- **Video utilities:** [scripts/common.js](scripts/common.js)

## Project Context

**Purpose:** AI-powered culinary assistant for Unilever Food Solutions
**Environments:**
- Preview: https://main--chefai--unileverchefai.aem.page/
- Live: https://main--chefai--unileverchefai.aem.live/

**Documentation:** https://www.aem.live/docs/
