import React, { useState } from 'react';
import { generateBatchHash } from '../utils/hash.js';
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function getBatchHash(string _batchId) public view returns (bytes32, uint256, address)"
];
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const RPC = process.env.REACT_APP_RPC_URL || 'https://rpc.ankr.com/polygon_amoy';

export default function BatchVerifier() {
  const [batchId, setBatchId] = useState('');
  const [status, setStatus] = useState(null);
  const [batchData, setBatchData] = useState(null);

  async function verify() {
    setStatus('loading');
    try {
      const resp = await fetch(`/api/batches/${batchId}`);
      if (!resp.ok) throw new Error('batch not found');
      const json = await resp.json();
      setBatchData(json.batchData);

      const computed = generateBatchHash(json.batchData);

      const provider = new ethers.JsonRpcProvider(RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const onChain = await contract.getBatchHash(batchId);
      const onChainHash = onChain[0];

      if (computed.toLowerCase() === onChainHash.toLowerCase()) {
        setStatus('Authentic — hash matches on-chain');
      } else {
        setStatus('Data mismatch — possible tamper');
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h3>Batch Verifier</h3>
      <input value={batchId} onChange={e => setBatchId(e.target.value)} placeholder="Enter batch ID" />
      <button onClick={verify}>Verify</button>

      {status && <p><strong>{status}</strong></p>}

      {batchData && (
        <pre style={{ background: '#eee', padding: 12 }}>{JSON.stringify(batchData, null, 2)}</pre>
      )}
    </div>
  );
}
