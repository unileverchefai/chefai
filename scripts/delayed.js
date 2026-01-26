import { createElement } from '@scripts/common.js';

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
    ? 'https://assets.adobedtm.com/e6bd1902389a/71b858983a5c/launch-19f5d7ed805e.min.js'
    : 'https://assets.adobedtm.com/e6bd1902389a/71b858983a5c/launch-19f5d7ed805e-staging.min.js';
  injectScript(src);
}

loadLaunch();
