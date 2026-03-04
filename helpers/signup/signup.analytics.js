export function trackSignupStart({
  registrationType,
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
    event: 'registrationStart',
    _ufs: {
      registration: {
        registrationType: registrationType || '',
        displayText,
        href,
        registrationStart: {
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

export function trackSignupSuccess({
  registrationType,
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
    event: 'registrationComplete',
    _ufs: {
      registration: {
        registrationType: registrationType || '',
        displayText,
        href,
        registrationComplete: {
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
