/**
 * Sleep helper
 *
 * @export
 * @param {number} ms
 * @returns {Promise<{}>}
 */
export function sleep(ms: number, intervalRef?: { id: NodeJS.Timeout | undefined }): Promise<{}> {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    if (intervalRef) {
      intervalRef.id = id;
    }
  });
}
