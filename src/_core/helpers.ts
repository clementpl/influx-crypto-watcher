/**
 * Sleep helper
 *
 * @export
 * @param {number} ms
 * @returns {Promise<{}>}
 */
export function sleep(ms: number): Promise<{}> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
