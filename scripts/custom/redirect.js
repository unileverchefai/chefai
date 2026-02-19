import { redirectToHomeIfNotLoggedIn, isUserLoggedIn } from './api/authentication/authService.js';
import { hasConfirmedBusiness } from '../../helpers/personalized-hub/hasSavedBusinessName.js';

const FUTURE_MENUS_4_BASE = 'future-menus-4';

function redirectToParentPage(pathname, segment) {
  const parentPath = pathname.replace(new RegExp(`/${segment}.*$`), '');
  window.location.href = parentPath ? `${parentPath}/` : '/';
}

export function getFutureMenus4BasePath(pathname = window.location.pathname ?? '/') {
  if (pathname.includes(FUTURE_MENUS_4_BASE)) {
    const idx = pathname.indexOf(FUTURE_MENUS_4_BASE);
    const base = pathname.slice(0, idx + FUTURE_MENUS_4_BASE.length);
    return base.replace(/\/$/, '') || base;
  }
  return `/${FUTURE_MENUS_4_BASE}`;
}

export function getRedirectUrlToPage(pageName, pathname = window.location.pathname ?? '/') {
  return `${getFutureMenus4BasePath(pathname)}/${pageName}`;
}

export async function checkPageAccess() {
  const pathname = window.location.pathname ?? '/';

  if (pathname === '/' || pathname === '') {
    return true;
  }

  if (pathname.includes(FUTURE_MENUS_4_BASE) && !pathname.includes('personalized-hub') && !pathname.includes('sneak-peek')) {
    return true;
  }

  if (isUserLoggedIn()) {
    return true;
  }

  const isSneakPeekPage = pathname.includes('sneak-peek');
  if (isSneakPeekPage && hasConfirmedBusiness()) {
    return true;
  }

  if (isSneakPeekPage && pathname.includes(FUTURE_MENUS_4_BASE)) {
    redirectToParentPage(pathname, 'sneak-peek');
    return false;
  }

  if (pathname.includes('personalized-hub') && pathname.includes(FUTURE_MENUS_4_BASE)) {
    redirectToParentPage(pathname, 'personalized-hub');
    return false;
  }

  return redirectToHomeIfNotLoggedIn();
}
