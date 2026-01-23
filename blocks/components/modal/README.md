# Modal Component

A reusable modal component for displaying content in an overlay.

## Quick Start

```javascript
import createModal from '../components/modal/index.js';
import { createElement } from '../../scripts/common.js';

// Create content
const content = createElement('div', {
  textContent: 'Hello, this is a modal!',
});

// Create and open modal
const modal = createModal({ content });
modal.open();
```

## Basic Usage

### Simple Modal
```javascript
import createModal from '../components/modal/index.js';
import { createElement } from '../../scripts/common.js';

const content = createElement('div', {
  textContent: 'Modal content here',
});

const modal = createModal({ content });
modal.open();
```

### Modal with HTML Content
```javascript
const content = createElement('div', {
  fragment: '<h2>Title</h2><p>Content</p>',
});

const modal = createModal({ content });
modal.open();
```

### Close Modal
```javascript
// Close programmatically
modal.close();

// Or destroy completely
modal.destroy();
```

## Configuration Options

```javascript
const modal = createModal({
  // Required
  content: yourContentElement,

  // Optional - Close button
  showCloseButton: true,        // Show/hide close button (default: true)
  closeButtonLabel: 'Close',    // Aria label
  closeButtonText: '×',         // Button text

  // Optional - Behavior
  closeOnClickOutside: true,    // Close on overlay click (default: true)
  closeOnEscape: true,         // Close on Escape key (default: true)
  animationDuration: 300,      // Animation in ms (default: 300)

  // Optional - Styling
  overlayClass: 'modal-overlay',           // Overlay CSS class
  contentClass: 'modal-content',           // Content CSS class
  overlayBackground: 'rgba(0,0,0,0.8)',    // Overlay background color

  // Optional - Callbacks
  onOpen: () => console.log('Opened'),
  onClose: () => console.log('Closed'),
});
```

## Common Examples

### Video Modal
```javascript
import { createElement, createVideoEmbed } from '../../scripts/common.js';

const videoEmbed = createVideoEmbed('https://youtube.com/watch?v=...');
if (videoEmbed) {
  const videoContent = createElement('div', {
    className: 'video-modal-content',
  });
  videoContent.appendChild(videoEmbed);

  const modal = createModal({
    content: videoContent,
    overlayClass: 'modal-overlay video-modal-overlay',
    contentClass: 'modal-content video-modal-content',
  });
  modal.open();
}
```

### Modal without Close Button
```javascript
const modal = createModal({
  content: yourContent,
  showCloseButton: false,
  closeOnClickOutside: true,
  closeOnEscape: true,
});
modal.open();
```

### Modal with React
```javascript
const container = createElement('div', {
  className: 'react-container',
  properties: { id: 'react-root' },
});

const modal = createModal({
  content: container,
  showCloseButton: false,
  onClose: () => {
    if (reactRoot) reactRoot.unmount();
  },
});

modal.open();

// Mount React
const reactRoot = ReactDOM.createRoot(container);
reactRoot.render(<YourComponent />);
```

## Methods

- `modal.open()` - Open the modal
- `modal.close()` - Close the modal
- `modal.destroy()` - Destroy and clean up
- `modal.getOverlay()` - Get overlay element
- `modal.getContent()` - Get content container element
