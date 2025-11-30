import { ethers } from 'ethers';
import { generateBatchHash } from './hash';

const CONTRACT_ABI = [
  "function getBatchHash(string _batchId) public view returns (bytes32, uint256, address)"
];

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const RPC_URL = process.env.REACT_APP_RPC_URL || 'https://rpc.ankr.com/polygon_amoy';

/**
 * Verify batch data against blockchain
 */
export async function verifyOnBlockchain(batchData) {
  try {
    if (!CONTRACT_ADDRESS) {
      return {
        status: 'NOT_CONFIGURED',
        message: 'Blockchain verification not configured. Missing CONTRACT_ADDRESS.'
      };
    }

    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Fetch on-chain hash
    const [onChainHash, timestamp, registrar] = await contract.getBatchHash(batchData.batch_id);

    // Check if batch exists on blockchain
    if (onChainHash === '0x' + '0'.repeat(64)) {
      return {
        status: 'NOT_FOUND',
        message: 'Batch not found on blockchain'
      };
    }

    // Recompute hash from current data
    const batchForHashing = {
      batch_id: batchData.batch_id,
      village_name: batchData.village_name,
      product: batchData.product,
      farmers: batchData.farmers
    };

    const computedHash = generateBatchHash(batchForHashing);

    // Compare hashes
    const verified = onChainHash.toLowerCase() === computedHash.toLowerCase();

    return {
      status: verified ? 'AUTHENTIC' : 'TAMPERED',
      message: verified
        ? 'Data verified on blockchain - no tampering detected'
        : 'WARNING: Data does not match blockchain record',
      onChainHash,
      computedHash,
      timestamp: Number(timestamp),
      registrar,
      verified
    };

  } catch (error) {
    console.error('Blockchain verification error:', error);
    return {
      status: 'ERROR',
      message: 'Failed to verify on blockchain: ' + error.message,
      error: error.message
    };
  }
}

/**
 * Get blockchain transaction details
 */
export async function getTransactionDetails(txHash) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    return {
      tx,
      receipt,
      explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

/**
 * Check if wallet is connected (for future admin features)
 */
export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      provider,
      signer,
      address,
      accounts
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}
