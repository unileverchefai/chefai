export default function trackSigninHeaderLinkClick({
  name,
  displayText,
  href,
} = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.adobeDataLayer) {
    window.adobeDataLayer = [];
  }

  window.adobeDataLayer.push({
    event: 'headerLinkclick',
    _ufs: {
      navigation: {
        name: name || 'header link',
        displayText: displayText || '',
        href: href || 'overlay trigger',
        headerLinkclick: {
          value: 1,
        },
      },
    },
    web: {
      webInteraction: {
        type: 'other',
      },
    },
  });
}
