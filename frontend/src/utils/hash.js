import { sha256 } from 'js-sha256';

export function generateBatchHash(batchData) {
  function sortKeys(obj) {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((r, k) => { r[k] = sortKeys(obj[k]); return r; }, {});
    }
    return obj;
  }
  const canonical = JSON.stringify(sortKeys(batchData));
  return '0x' + sha256(canonical);
}
