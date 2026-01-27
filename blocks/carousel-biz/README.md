# Carousel Biz Block

**API-driven carousel** displaying business insights from the ChefAI Chatbot API.

## Architecture

This block is **API-driven**, not content-driven:
- ✅ DA document only triggers the block (no content parsed from DA)
- ✅ All data fetched from ChefAI API endpoints
- ✅ Dynamic filtering via business type dropdown
- ✅ Mock data fallback for development when API unavailable

## How It Works

1. **Author adds block to DA:** Simply insert `| Carousel Biz |` table (no other content needed)
2. **Block loads:** `decorate()` creates dropdown and carousel container from scratch
3. **API call:** `fetchInsights()` retrieves recommendations from backend
4. **Rendering:** Cards generated dynamically from API response data
5. **Filtering:** Business type dropdown triggers new API calls

## API Integration

### Endpoints Used:
- **Recommendations:** `/api/v1/recommendations/` - Returns trend insights
- **Business Types:** `/utility/business-types` - Populates dropdown filter

### Configuration:
- API base URL and subscription key in `constants/api.js`
- Mock fallback controlled by `USE_MOCK_FALLBACK` flag in `fetchInsights.js`

## Features

- **Responsive carousel**: 4 cards on desktop, 1 on mobile
- **Trend-specific styling**: Color-coded gradients for each trend type
- **Touch/swipe support**: Native mobile interaction
- **Keyboard accessible**: Arrow navigation
- **Business type filtering**: Live dropdown connected to API
- **Indicator dots**: Navigation (no arrow buttons per design)

## Trend Types

Cards are styled based on API-provided trend IDs:

- **Borderless Cuisine** (`2026_trend_borderless_cuisine`) → Orange gradient
- **Street Food Couture** (`2026_trend_street_food_couture`) → Purple/Magenta gradient
- **Diner Designed** (`2026_trend_diner_designed`) → Green gradient
- **Culinary Roots** (`2026_trend_culinary_roots`) → Blue gradient
- **Cross-Trend** (multiple trends) → White gradient with outline effect

## Styling

Uses CSS variables from [styles/styles.css](../../styles/styles.css):
- `--ff-unilever-shilling`: Typography
- `--ufs-orange`, `--mid-smoke`, `--light-smoke`: Colors
- `--radius-sm`, `--spacing-*`: Layout tokens
- `--transition-fast`: Animations


## Minimum Requirements

- **Minimum 3 cards** (block auto-removes if fewer)
- Each card needs trend name (h3), background image, and description (p)
- Stat (h2) and CTA link are optional but recommended

## Implementation Notes

- Block uses `createCarousel()` utility from [scripts/common.js](../../scripts/common.js)
- Follows standard AEM block pattern: `export default function decorate(block)`
- Background images are extracted from `<picture>` elements and applied as inline styles
- Dropdown filter is rendered but not yet wired (ready for future enhancement)
- Arrow icon uses SVG markup generated in JavaScript
