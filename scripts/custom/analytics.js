const eventsSettingsUrl = '/analytics.json';

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

function pushEventToDataLayer(eventName, eventInfo = {}) {
  if (window.adobeDataLayer) {
    window.adobeDataLayer.push({
      event: eventName,
      eventInfo,
      targetPage: window.location.href.toString(),
    });
  }
}

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

  const scrollTracked = {}; // Track which scroll events have fired

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

    const targetElement = document.querySelector(target) || document.querySelector(`.${target}`) || null;
    if (!targetElement) {
      console.warn(`Target element not found for selector: %c${target}`, 'color:red');
      return;
    }

    if (eventType !== 'scroll') {
      targetElement.addEventListener(eventType, () => {
        pushEventToDataLayer(eventName, {
          sdr,
          targetElement: targetElement.className || targetElement.id || targetElement.tagName,
        });
      });
    } else {
      window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = (scrollPosition / documentHeight) * 100;

        if (scrollPercentage >= 50 && !scrollTracked[sdr.toString()]) {
          scrollTracked[sdr.toString()] = true;
          pushEventToDataLayer(eventName, {
            sdr,
            targetElement: 'window',
          });
        }
      });
    }
  });
}
