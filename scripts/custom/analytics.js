const eventsSettingsUrl = '/analytics.json';

// Object structure based on Adobe Experience Platform Web SDK specifications
const PAGE_VIEW = {
  event: 'pageView',
  web: {
    webPageDetails: {
      URL: window.location.href.toString(),
      previousURL: document.referrer || 'N/A',
      server: window.location.hostname,
      isErrorPage: false,
      pageError: 'no error found',
      name: document.title || window.location.pathname,
      pageType: document.querySelector('meta[name="page-type"]')?.content || 'N/A',
      siteSection: document.querySelector('meta[name="site-section"]')?.content || 'N/A',
      pageViews: { value: 1 },
    },
    webReferrer: {
      URL: document.referrer || 'N/A',
    },
  },
  _ufs: {
    pageContext: {
      mainsection: document.querySelector('meta[name="main-section"]')?.content || 'N/A',
      subsection1: document.querySelector('meta[name="subsection-1"]')?.content || 'N/A',
      subsection2: document.querySelector('meta[name="subsection-2"]')?.content || 'N/A',
      brandCategory: document.querySelector('meta[name="brand-category"]')?.content || 'N/A',
      language: document.querySelector('meta[name="language"]')?.content || 'N/A',
      country: document.querySelector('meta[name="country"]')?.content || 'N/A',
      contentType: document.querySelector('meta[name="content-type"]')?.content || 'N/A',
      globalBrand: document.querySelector('meta[name="global-brand"]')?.content || 'N/A',
      localBrand: document.querySelector('meta[name="local-brand"]')?.content || 'N/A',
      loginStatus: document.querySelector('meta[name="login-status"]')?.content || 'N/A',
      sitetype: document.querySelector('meta[name="site-type"]')?.content || 'N/A',
    },
    user: {
      userID: 'anonymous', // Replace with actual user ID if available
      externalID: {
        adobeID: 'MCMID|exampleAdobeID', // Replace with actual Adobe ID if available
        googleID: 'exampleGoogleID', // Replace with actual Google ID if available
      },
    },
  },
  environment: {
    browserDetails: {
      userAgent: navigator.userAgent,
    },
  },
  device: {
    type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  },
};

const eventList = {
  load: PAGE_VIEW,
  // TODO: add the rest of the objects based on the specific data to be collected
};

async function getEventsSettings(targetUrl = eventsSettingsUrl) {
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch events settings:', error);
    return null;
  }
}

function pushEventToDataLayer(eventInfo = {}) {
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({
    ...eventInfo,
    targetPage: window.location.href.toString(),
  });
}

const eventConfig = {
  load: 'DOMContentLoaded',
};

export default async function addCustomAnalyticsEvents() {
  const eventsSettings = await getEventsSettings();
  if (!eventsSettings || !eventsSettings.data) {
    console.warn('No event settings available', { eventsSettings });
    return;
  }

  if (!Array.isArray(eventsSettings.data)) {
    console.warn('Event settings data is not an array', { data: eventsSettings.data });
    return;
  }

  eventsSettings.data.forEach((eventSetting) => {
    const {
      event_name: eventName = null,
      action: eventType = null,
      target_element: target = null,
      sdr = null,
    } = eventSetting;
    if (!eventName || !eventType || !target || !sdr) {
      console.warn('Incomplete event settings:', {
        eventName, eventType, targetElement: target, sdr,
      });
      return;
    }
    const elementType = {
      document,
      window,
    };

    const targetElement = elementType[target] || document.querySelector(target) || document.querySelector(`.${target}`) || null;
    if (!targetElement) {
      console.warn(`Target element not found for selector: %c${target}`, 'color:red');
      return;
    }

    const eventConfigEvent = eventConfig[eventType] || eventType;
    const eventConfigObject = eventList[eventType] || {};
    const scrollTracked = {}; // Track which scroll events have fired

    if (eventType !== 'scroll') {
      targetElement.addEventListener(eventConfigEvent, () => {
        pushEventToDataLayer({
          sdr,
          targetElement: targetElement.className || targetElement.id || targetElement.tagName,
          ...eventConfigObject,
        });
      });
    } else {
      targetElement.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = (scrollPosition / documentHeight) * 100;

        if (scrollPercentage >= 50 && !scrollTracked[sdr.toString()]) {
          scrollTracked[sdr.toString()] = true;
          pushEventToDataLayer({
            sdr,
            targetElement: 'window',
            ...eventConfigObject,
          });
        }
      });
    }
  });
}
