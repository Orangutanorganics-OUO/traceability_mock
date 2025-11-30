import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://rpc.ankr.com/polygon_amoy");
const wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;

const abi = [
  "function registerBatch(string _batchId, bytes32 _hash) public",
  "function getBatchHash(string _batchId) public view returns (bytes32, uint256, address)"
];

export const contract = wallet ? new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet) : null;
export const readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
