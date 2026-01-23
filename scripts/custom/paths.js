/**
 * Path resolution utility for cleaner imports
 * Provides absolute path resolution from project root
 */

const BASE_PATH = window.hlx?.codeBasePath || '';

/**
 * Resolves a path from the project root
 * @param {string} path - Path relative to project root (e.g., 'blocks/modal/index.js')
 * @returns {string} Absolute path
 */
export function resolvePath(path) {
  if (path.startsWith('/') || path.startsWith('http')) {
    return path;
  }
  return `${BASE_PATH}/${path}`;
}

/**
 * Import helper that resolves paths automatically
 * @param {string} path - Path relative to project root
 * @returns {Promise<Module>} Imported module
 */
export async function importFrom(path) {
  return import(resolvePath(path));
}
