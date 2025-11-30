import crypto from 'crypto';

export function generateBatchHash(batchData) {
  // Strip out metadata fields that shouldn't be part of the hash
  const {
    batch_hash,
    blockchain_tx_hash,
    blockchain_timestamp,
    blockchain_registrar,
    created_at,
    updated_at,
    ...hashableData
  } = batchData;

  // Normalize data to ensure consistent hashing
  // Removes empty/null/undefined fields completely for optional field handling
  function normalizeAndSort(obj) {
    // Return undefined for empty values (will be filtered out)
    if (obj === undefined || obj === null || obj === '') return undefined;

    if (Array.isArray(obj)) {
      // Filter out empty items and normalize remaining
      const filtered = obj
        .map(normalizeAndSort)
        .filter(item => item !== undefined);
      return filtered.length > 0 ? filtered : undefined;
    }

    if (typeof obj === 'object') {
      const normalized = {};
      Object.keys(obj).sort().forEach(key => {
        const value = normalizeAndSort(obj[key]);
        // Only include fields with actual values (not undefined/null/empty)
        if (value !== undefined) {
          normalized[key] = value;
        }
      });
      // Return undefined if object is empty after filtering
      return Object.keys(normalized).length > 0 ? normalized : undefined;
    }

    return obj;
  }

  const normalized = normalizeAndSort(hashableData);
  const canonical = JSON.stringify(normalized);
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}
