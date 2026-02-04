import { loadScript } from '@scripts/aem.js';
import { createElement, isDevHost, COOKIE_CONFIG } from '@scripts/common.js';
import addCustomAnalyticsEvents from '@scripts/custom/analytics.js';

const { DATA_DOMAIN_SCRIPT = false } = COOKIE_CONFIG;

// OneTrust Cookies Consent Notice
if (DATA_DOMAIN_SCRIPT && !window.location.pathname.includes('srcdoc') && !isDevHost()) {
  // when running on localhost in the block library host is empty but the path is srcdoc
  // on localhost/hlx.page/hlx.live the consent notice is displayed every time the page opens,
  // because the cookie is not persistent. To avoid this annoyance, disable unless on the
  // production page.
  loadScript(`https://cdn.cookielaw.org/consent/${DATA_DOMAIN_SCRIPT}/OtAutoBlock.js`, {
    type: 'text/javascript',
    charset: 'UTF-8',
    nonce: 'aem',
  });

  loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
    type: 'text/javascript',
    charset: 'UTF-8',
    'data-domain-script': DATA_DOMAIN_SCRIPT,
    nonce: 'aem',
  });

  window.OptanonWrapper = () => {
    const currentOnetrustActiveGroups = window.OnetrustActiveGroups;

    function isSameGroups(groups1, groups2) {
      const s1 = JSON.stringify(groups1.split(','));
      const s2 = JSON.stringify(groups2.split(','));

      return s1 === s2;
    }

    window.OneTrust.OnConsentChanged(() => {
      // reloading the page only when the active group has changed
      if (!isSameGroups(currentOnetrustActiveGroups, window.OnetrustActiveGroups)) {
        window.location.reload();
      }
    });
  };
}

function injectScript(src, crossOrigin = '') {
  window.scriptsLoaded = window.scriptsLoaded || [];

  if (window.scriptsLoaded.indexOf(src)) {
    const head = document.head || document.querySelector('head');
    const script = createElement('script', {
      attributes: {
        src,
        async: 'true',
        type: 'module',
        charset: 'utf-8',
        nonce: 'aem',
      },
    });

    if (['anonymous', 'use-credentials'].includes(crossOrigin)) {
      script.crossOrigin = crossOrigin;
    }
    head.append(script);
    window.scriptsLoaded.push(src);
  }
}

function loadLaunch() {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const isProd = window.location.host === 'www.ufs.com';

  const src = isProd
    ? 'https://assets.adobedtm.com/e6bd1902389a/71b858983a5c/launch-dda2a02eb93c.min.js'
    : 'https://assets.adobedtm.com/e6bd1902389a/71b858983a5c/launch-19f5d7ed805e-staging.min.js';
  injectScript(src);
}

loadLaunch();
addCustomAnalyticsEvents();
