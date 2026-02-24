import { getPathSegments, BASE_FOLDER } from './locale.js';

/**
 * Returns the base URL: path up to and including BASE_FOLDER, with trailing slash.
 * e.g. /uk/en/inspiration/future-menus-4/personalized-hub -> /uk/en/inspiration/future-menus-4/
 */
export function getBaseUrl(pathname = window.location.pathname ?? '/') {
  const segments = getPathSegments(pathname);
  if (segments.length === 0) return '/';
  const idx = segments.indexOf(BASE_FOLDER);
  if (idx === -1) return '/';
  const baseSegments = segments.slice(0, idx + 1);
  return `/${baseSegments.join('/')}/`;
}

/**
 * Returns the URL for a page under the base folder (e.g. on login/register -> personalized-hub).
 * e.g. getUrl('personalized-hub') -> /uk/en/inspiration/future-menus-4/personalized-hub
 */
export function getUrl(pageName, pathname = window.location.pathname ?? '/') {
  const base = getBaseUrl(pathname);
  if (base === '/') return `/${pageName}`;
  return `${base.replace(/\/$/, '')}/${pageName}`;
}
