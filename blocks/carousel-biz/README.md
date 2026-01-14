# Carousel Biz Block

A horizontal carousel showcasing business trends with vibrant gradient cards. Each card displays trend insights with statistics, descriptions, and call-to-action links.

## Features

- **Responsive carousel**: 3 cards on desktop, 1 on mobile
- **Trend-specific styling**: Color-coded gradients for each trend type
- **Touch/swipe support**: Native mobile interaction
- **Keyboard accessible**: Arrow navigation
- **Optional filter dropdown**: Business type filtering (ready for implementation)

## Block Structure

Each card requires:
- `<h3>`: Trend name (appears in header badge)
- `<p>` (first): Background image with `<picture>` element
- `<h2>`: Statistic or insight (number or word)
- `<p>` (second): Description text
- `<p>` (third): CTA link with `<a>` tag

## Trend Types

The block automatically detects and styles these trends:

- **Borderless Cuisine** → Orange gradient
- **Street Food Couture** → Purple/Magenta gradient
- **Diner Designed** → Green gradient
- **Culinary Roots** → Blue gradient
- **Cross-Trend** → White gradient

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
