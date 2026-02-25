import COUNTRY_CODE_MAP from './country-codes.js';

/**
 * Get locale from URL path pattern /{country}/{lang}/... when URL contains this base folder.
 * Otherwise fallback to meta/document or default (GB, en).
 */

/** Base folder for future-menus-4; only treat path as locale when this is in the URL. */
export const BASE_FOLDER = 'future-menus-4';

const DEFAULT_COUNTRY = 'GB';
const DEFAULT_LANG = 'en';

/**
 * Get path segments
 * @param {string} [pathname] - Defaults to window.location.pathname
 * @returns {string[]}
 */
export function getPathSegments(pathname) {
  const path = (pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')).replace(/\/$/, '') ?? '/';
  if (path === '' || path === '/') return [];
  return path.split('/').filter(Boolean);
}

/** True only when path contains BASE_FOLDER and has at least country + lang before it. */
function hasLocaleInPath(segments) {
  const idx = segments.indexOf(BASE_FOLDER);
  return idx >= 2;
}

/**
 * Get country code from URL path (first segment) or fallbacks.
 * Only uses path when URL contains BASE_FOLDER (e.g. /uk/en/.../future-menus-4/); otherwise GB/en.
 */
export function getCountry(pathname) {
  const segments = getPathSegments(pathname);
  let rawCountry;
  if (hasLocaleInPath(segments)) {
    rawCountry = segments[0].toUpperCase();
  }
  if (!rawCountry && typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="country"]')?.content?.trim();
    if (meta) rawCountry = meta.toUpperCase();
  }
  if (!rawCountry) {
    rawCountry = DEFAULT_COUNTRY;
  }
  return COUNTRY_CODE_MAP[rawCountry] ?? rawCountry;
}

/**
 * Get language code from URL path (second segment) or fallbacks.
 * Only uses path when URL contains BASE_FOLDER; otherwise en.
 */
export function getLang(pathname) {
  const segments = getPathSegments(pathname);
  if (hasLocaleInPath(segments)) {
    return segments[1].toLowerCase();
  }
  if (typeof document !== 'undefined') {
    //TODO: to refactor this variable in global scope
    const meta = document.querySelector('meta[name="language"]')?.content?.trim();
    if (meta) return meta.toLowerCase().split(/[-_]/)[0] ?? DEFAULT_LANG;
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) {
      const primary = htmlLang.toLowerCase().split(/[-_]/)[0];
      return primary ?? DEFAULT_LANG;
    }
  }
  return DEFAULT_LANG;
}
