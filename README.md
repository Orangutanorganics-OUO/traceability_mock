# Orangutan Organics - Blockchain Traceability System

A blockchain-based traceability system for organic products with tamper-proof verification.

## What This System Does

- Collects complete farmer and batch information through admin portal
- Stores data securely in Firebase Realtime Database (cloud-hosted)
- Records immutable hash on Polygon blockchain for verification
- Provides mobile-friendly customer view showing all product details
- Displays blockchain verification status with simple explanation

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start backend
cd backend
npm start

# 3. Start frontend (in new terminal)
cd frontend
npm start
```

Visit **http://localhost:3000** in your browser.

## System Components

### 1. Smart Contract (Polygon Blockchain)
- Network: Polygon Amoy Testnet
- Contract: `0xc9e993d7DF047751D92E85D3746c8833F6d4d72d`
- Purpose: Stores tamper-proof SHA-256 hashes of batch data

### 2. Backend API (Node.js + Firebase)
- Database: Firebase Realtime Database (cloud-hosted)
- Data Structure: `/batches/{batchId}` with nested village and farmers array
- Stores complete batch information:
  - Batch ID and product type
  - Village information (name, location, elevation, history)
  - Farmer details (name, age, story, land information)
  - Crop rotation and yield profiles
  - Season calendar (sowing, staking, harvest)
  - Post-harvest processing information
  - Soil organic carbon data (topsoil, subsoil, pH, nutrients)
  - Media links (images and videos)
  - Farm GPS locations

### 3. Frontend (React)
- **Home Page**: Browse all batches
- **Customer View**: Scan QR → View complete batch information
- **Admin Portal**: Create new batches with complete data
- **Mobile-friendly**: Simple, clean design optimized for all devices

## Data Collection

The admin form collects comprehensive batch information:

**Batch Information:**
- Batch ID
- Product name

**Village Information:**
- Village name, district, state
- Elevation
- Village history and cultural significance

**Farmer Information (multiple farmers per batch):**
- Personal: Name, age, gender, background story
- Land: Total land, cultivated land (in Nali and Acres)
- Crop Rotation: White rajma and amaranth distribution
- Yield Profile: Ideal and average yields, seed requirements
- Season Calendar: Sowing, staking, and harvest windows
- Post-Harvest: Processing practices, family involvement
- Packaging: Quality and packaging information
- Media: Multiple images and videos with descriptions
- Locations: GPS coordinates of farm locations
- Soil Quality: Complete soil organic carbon analysis
  - Sampling year and depth
  - Topsoil and subsoil organic carbon percentages
  - Soil rating, organic matter, pH
  - Bulk density
  - Available nitrogen, phosphorus, potassium
  - Additional soil comments

## Customer Experience

When customers scan a QR code on the product:

1. **Blockchain Verification Badge** - Shows if the batch is verified on blockchain
2. **Simple Explanation** - Why blockchain provides trust
3. **Village Story** - Learn about the village and its heritage
4. **Farmer Stories** - Meet the farmers (with tabs for multiple farmers)
5. **Photo Gallery** - View images from the farm
6. **Videos** - Watch videos about the farming process
7. **Land Information** - See farm size and cultivation details
8. **Crop Details** - Understand crop rotation practices
9. **Yield Information** - View expected and actual yields
10. **Season Calendar** - Visual timeline of farming activities
11. **Post-Harvest** - How the product was processed
12. **Soil Quality** - Detailed soil health information
13. **Farm Locations** - GPS coordinates with Google Maps links

## Blockchain Verification

**How it works:**
1. Admin creates batch → System computes SHA-256 hash
2. Hash is stored on Polygon blockchain (immutable)
3. Customer scans QR → System fetches hash from blockchain
4. System compares blockchain hash with current data hash
5. If hashes match → **VERIFIED** ✓ (data hasn't been altered)
6. If hashes don't match → **TAMPERED** ⚠ (data has been changed)

**Why blockchain?**
- Data cannot be altered or deleted once stored
- Permanent, transparent record
- No central authority can modify it
- Cryptographically secure

## Admin Portal Access

Admin portal: **http://localhost:3000/admin**

Password is set in backend `.env` file:
```
ADMIN_PASSWORD=your_password_here
```

## API Endpoints

**Public:**
- `GET /api/batches` - List all batches
- `GET /api/batches/:batchId` - Get complete batch data
- `GET /api/search?q=query` - Search batches
- `GET /api/stats` - Dashboard statistics
- `GET /health` - Health check

**Admin (requires password):**
- `POST /api/admin/verify-password` - Verify admin password
- `POST /api/admin/batches` - Create new batch

## Tech Stack

- **Blockchain:** Solidity, Polygon Network, ethers.js
- **Backend:** Node.js, Express.js
- **Database:** Firebase Realtime Database (cloud-hosted, NoSQL)
- **Frontend:** React, React Router, Axios
- **Hashing:** SHA-256

## Database Structure

Firebase Realtime Database with nested JSON structure:
- `/batches/{batchId}` - Root batch node containing:
  - Batch ID and product type
  - Blockchain hash and transaction info
  - Village object (name, location, elevation, history)
  - Farmers array with nested objects for each farmer:
    - Basic info (name, age, gender, story)
    - Land details (total, cultivated in Nali and Acres)
    - Crop rotation data
    - Yield profiles
    - Season calendar
    - Post-harvest info
    - Media arrays (images, videos)
    - Location arrays (GPS coordinates)
    - Soil organic carbon data

## Cost

- **Testnet (current):** FREE
- **Production (Polygon Mainnet):** ~$0.001-$0.01 per batch transaction

## Documentation

- [HOW_IT_WORKS.md](HOW_IT_WORKS.md) - Detailed explanation of blockchain verification
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Technical implementation details

## Environment Variables

**Backend (.env):**
```
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0xc9e993d7DF047751D92E85D3746c8833F6d4d72d
ADMIN_PASSWORD=your_admin_password
PORT=4000
```

**Note:** Firebase credentials are hardcoded in `backend/src/db/firebase.js`. No environment variable needed for Firebase.

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:4000
```

## License

This project is open source and available for agricultural traceability applications.
