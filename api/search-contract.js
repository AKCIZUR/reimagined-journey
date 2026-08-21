/**
 * Server-side search adapter contract.
 *
 * Implement your provider here and expose it through GET /api/search?q=...
 * The browser must never receive provider API credentials.
 */

/** @typedef {{
 * id?: string,
 * title: string,
 * url: string,
 * domain?: string,
 * snippet?: string,
 * type?: 'web'|'news'|'docs'|'github'|'image'|'video',
 * publishedAt?: string
 * }} WebResult */

/**
 * @param {string} query
 * @returns {Promise<WebResult[]>}
 */
export async function search(query) {
  throw new Error(`Connect a server-side provider for query: ${query}`);
}
