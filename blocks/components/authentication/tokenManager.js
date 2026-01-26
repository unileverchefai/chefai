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
