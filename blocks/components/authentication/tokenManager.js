const TOKEN_KEY = 'ufs-auth-token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
  return !!getToken();
}

export function getUserIdFromToken() {
  try {
    const token = getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));

    return (
      payload.user_id
      || payload.userId
      || payload.sub
      || null
    );
  } catch {
    return null;
  }
}
