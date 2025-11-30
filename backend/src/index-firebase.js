import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateBatchHash } from './hash.js';
import { contract, readContract } from './contract.js';
import { Batch, Stats } from './db/models-firebase.js';
import { testConnection } from './db/firebase.js';

dotenv.config();

const app = express();

// Admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Simple admin authentication middleware
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide admin password in Authorization header'
    });
  }

  const password = authHeader.replace('Bearer ', '');

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({
      error: 'Invalid password',
      message: 'Incorrect admin password'
    });
  }

  next();
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const firebaseConnected = await testConnection();
    const contractConfigured = !!contract && !!process.env.CONTRACT_ADDRESS;

    res.json({
      status: 'healthy',
      database: firebaseConnected ? 'connected' : 'disconnected',
      blockchain: contractConfigured ? 'configured' : 'not configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/verify-password
 */
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.json({ valid: true });
  }

  return res.status(401).json({ valid: false });
});

/**
 * POST /api/admin/batches
 * Create a new batch (Admin only)
 */
app.post('/api/admin/batches', adminAuth, async (req, res) => {
  try {
    const { batch_id, product, village, farmers } = req.body;

    // Validate required fields
    if (!batch_id || !product) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'batch_id and product are required'
      });
    }

    if (!village || !village.name) {
      return res.status(400).json({
        error: 'Missing village information',
        message: 'Village name is required'
      });
    }

    if (!farmers || !Array.isArray(farmers) || farmers.length === 0) {
      return res.status(400).json({
        error: 'Missing farmer information',
        message: 'At least one farmer is required'
      });
    }

    console.log(`Creating batch: ${batch_id}`);

    // Create batch in Firebase
    const result = await Batch.create(
      { batch_id, product },
      village,
      farmers
    );

    console.log(`Batch created in Firebase: ${batch_id}`);
    console.log(`Batch hash: ${result.batchHash}`);

    // Register on blockchain
    if (contract) {
      try {
        console.log(`Registering batch ${batch_id} on blockchain...`);

        const tx = await contract.registerBatch(batch_id, result.batchHash);
        console.log(`Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

        // Update Firebase with blockchain info
        await Batch.updateBlockchainInfo(
          batch_id,
          receipt.hash,
          Date.now().toString(),
          receipt.from
        );

        console.log(`Blockchain info updated in Firebase for batch: ${batch_id}`);

        // Fetch updated batch
        const updatedBatch = await Batch.getByBatchId(batch_id);

        return res.json({
          success: true,
          batch: updatedBatch,
          batchHash: result.batchHash,
          blockchain: {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            from: receipt.from
          }
        });
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);

        // Batch still created in Firebase, return success with warning
        return res.json({
          success: true,
          batch: result.batch,
          batchHash: result.batchHash,
          warning: 'Batch created but blockchain registration failed',
          blockchainError: blockchainError.message
        });
      }
    } else {
      // No blockchain configured
      return res.json({
        success: true,
        batch: result.batch,
        batchHash: result.batchHash,
        warning: 'Blockchain not configured'
      });
    }
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      error: 'Failed to create batch',
      message: error.message
    });
  }
});

/**
 * GET /api/batches
 * Get all batches with pagination
 */
app.get('/api/batches', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const batches = await Batch.getAll(limit, offset);

    res.json({
      batches,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      error: 'Failed to fetch batches',
      message: error.message
    });
  }
});

/**
 * GET /api/batches/:batchId
 * Get complete batch data with verification
 */
app.get('/api/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch from Firebase
    const batch = await Batch.getByBatchId(batchId);

    if (!batch) {
      return res.status(404).json({
        error: 'Batch not found',
        message: `No batch found with ID: ${batchId}`
      });
    }

    // Verify blockchain hash if registered
    let verificationStatus = 'not_registered';
    let blockchainHash = null;

    if (batch.blockchain_tx_hash && readContract) {
      try {
        const [hash, timestamp, registrar] = await readContract.getBatchHash(batchId);
        blockchainHash = hash;

        // Compare hashes
        const currentHash = generateBatchHash(batch);
        verificationStatus = (hash === currentHash) ? 'verified' : 'tampered';
      } catch (error) {
        console.error('Blockchain verification failed:', error);
        verificationStatus = 'verification_failed';
      }
    }

    res.json({
      batch,
      verification: {
        status: verificationStatus,
        blockchain_hash: blockchainHash,
        current_hash: generateBatchHash(batch)
      }
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      error: 'Failed to fetch batch',
      message: error.message
    });
  }
});

/**
 * GET /api/search
 * Search batches by query
 */
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing search query',
        message: 'Please provide a search query parameter "q"'
      });
    }

    const results = await Batch.search(q.trim());

    res.json({
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching batches:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * POST /api/verify/:batchId
 * Standalone verification endpoint
 */
app.post('/api/verify/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.getByBatchId(batchId);

    if (!batch) {
      return res.status(404).json({
        error: 'Batch not found'
      });
    }

    if (!batch.blockchain_tx_hash) {
      return res.json({
        verified: false,
        reason: 'Batch not registered on blockchain'
      });
    }

    // Fetch hash from blockchain
    const [blockchainHash, timestamp, registrar] = await readContract.getBatchHash(batchId);

    // Compute current hash
    const currentHash = generateBatchHash(batch);

    const verified = (blockchainHash === currentHash);

    res.json({
      verified,
      blockchain_hash: blockchainHash,
      current_hash: currentHash,
      timestamp,
      registrar
    });
  } catch (error) {
    console.error('Error verifying batch:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

/**
 * GET /api/stats
 * Get dashboard statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const dashboard = await Stats.getDashboard();
    const productDistribution = await Stats.getProductDistribution();

    res.json({
      dashboard,
      productDistribution
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/yield-comparison
 * Get farmer yield comparison data
 */
app.get('/api/analytics/yield-comparison', async (req, res) => {
  try {
    const yieldData = await Stats.getFarmerYieldComparison();

    res.json({
      farmers: yieldData
    });
  } catch (error) {
    console.error('Error fetching yield comparison:', error);
    res.status(500).json({
      error: 'Failed to fetch yield comparison',
      message: error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log('\n✓ Backend server running on port', PORT);
  console.log('✓ Environment:', process.env.NODE_ENV || 'development');

  // Test Firebase connection
  try {
    const connected = await testConnection();
    console.log('✓ Firebase:', connected ? 'Connected' : 'Disconnected');
  } catch (error) {
    console.log('✗ Firebase: Connection failed');
  }

  console.log('✓ Blockchain:', contract ? 'Configured' : 'Not configured');
  console.log('✓ Admin password:', ADMIN_PASSWORD === 'admin123' ? 'Using default (CHANGE THIS!)' : 'Using custom password');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
