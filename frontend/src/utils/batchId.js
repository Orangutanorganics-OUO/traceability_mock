import { sha256 } from 'js-sha256';

/**
 * Generate a hash-based batch ID from batch data
 * This creates a unique, tamper-proof identifier
 */
export function generateBatchId(product, villageName, timestamp) {
  const data = `${product}-${villageName}-${timestamp || Date.now()}`;
  const hash = sha256(data);
  // Take first 12 characters for readability
  return `BATCH-${hash.substring(0, 12).toUpperCase()}`;
}

/**
 * Validate batch ID format
 */
export function isValidBatchId(batchId) {
  return /^BATCH-[A-F0-9]{12}$/.test(batchId);
}
