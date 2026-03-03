import { pushEventToDataLayer } from '@scripts/custom/analytics.js';

export function trackSignupStart({
  formName,
  displayText,
  href,
}) {
  pushEventToDataLayer({
    event: 'signupStart',
    _ufs: {
      signup: {
        formName: formName ?? '',
        displayText: displayText ?? '',
        href: href ?? '',
        signupStart: {
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
  formName,
  displayText,
  href,
}) {
  pushEventToDataLayer({
    event: 'signupSuccess',
    _ufs: {
      signup: {
        formName: formName ?? '',
        displayText: displayText ?? '',
        href: href ?? '',
        signupSuccess: {
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
