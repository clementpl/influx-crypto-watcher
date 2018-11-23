import { IPoint } from 'influx';

// Loop over keys
// example symbol
/**
 * Loop over tags and return string usable for query
 * example for tags = {symbol:'BTC/USDT', lala:'lolo'}
 *        RETURN 'symbol=BTC/USDT AND lala=lolo'
 * @export
 * @param {{ [name: string]: string }} tags
 */
export function tagsToString(tags: { [name: string]: string }) {
  let str = '';
  const keys = Object.keys(tags);
  keys.forEach(
    (key, idx) =>
      (str += `${key}='${tags[key]}'${idx === keys.length - 1 ? '' : ' AND '}`)
  );
  return str;
}
