import { database, ref, set, get, push, child, query, orderByChild, equalTo } from './firebase.js';
import { generateBatchHash } from '../hash.js';

/**
 * Firebase Realtime Database Models
 *
 * Data Structure:
 * /batches/{batchId}
 *   - id
 *   - batch_id
 *   - product
 *   - batch_hash
 *   - blockchain_tx_hash
 *   - blockchain_timestamp
 *   - blockchain_registrar
 *   - created_at
 *   - updated_at
 *   - village: {}
 *   - farmers: []
 */

class Batch {
  /**
   * Create a new batch with all nested data
   */
  static async create(batchData, villageData, farmersData) {
    try {
      const batch_id = batchData.batch_id;
      const timestamp = new Date().toISOString();

      // Prepare complete batch object
      const batchObject = {
        batch_id: batch_id,
        product: batchData.product,
        batch_hash: null,
        blockchain_tx_hash: null,
        blockchain_timestamp: null,
        blockchain_registrar: null,
        created_at: timestamp,
        updated_at: timestamp,
        village: {
          name: villageData.name,
          district: villageData.district,
          state: villageData.state,
          elevation_m: villageData.elevation_m || null,
          village_info: villageData.village_info || null
        },
        farmers: []
      };

      // Add farmers with all nested data
      for (const farmerData of farmersData) {
        const farmer = {
          farmer_name: farmerData.farmer_name,
          age: farmerData.age || null,
          gender: farmerData.gender || 'male',
          farmer_info: farmerData.farmer_info || null,
          total_land_nali: farmerData.total_land_nali || null,
          cultivated_land_nali: farmerData.cultivated_land_nali || null,
          cultivated_land_acre: farmerData.cultivated_land_acre || null,
          packaging_status: farmerData.packaging_status || null,

          // Crop rotation
          crop_rotation: farmerData.crop_rotation || {
            white_rajma_nali: null,
            white_rajma_share_pct: null,
            amaranth_nali: null,
            amaranth_share_pct: null
          },

          // Yield profile
          yield_profile: farmerData.yield_profile || {
            ideal_yield_kg_per_nali: null,
            avg_yield_range_kg_per_nali: { min: null, max: null },
            estimated_rajma_ideal_yield_kg: null,
            estimated_rajma_avg_yield_range_kg: { min: null, max: null },
            seed_required_kg_per_nali: { min: null, max: null },
            estimated_seed_required_kg: null
          },

          // Season calendar
          season_calendar: farmerData.season_calendar || {
            seed_sowing_window: null,
            staking_window: null,
            harvest_window: null
          },

          // Post harvest info
          post_harvest_info: farmerData.post_harvest_info || {
            primary_practices: [],
            family_involvement: null
          },

          // Media
          media: farmerData.media || {
            image_links: [],
            video_links: []
          },

          // Locations
          locations: farmerData.locations || [],

          // Soil organic carbon
          soil_organic_carbon: farmerData.soil_organic_carbon || {
            sampling_year: null,
            sampling_depth_cm: null,
            topsoil_oc_pct: null,
            subsoil_oc_pct: null,
            rating: null,
            organic_matter_pct_est: null,
            ph: null,
            bulk_density_g_cc: null,
            available_n_kg_per_ha: null,
            available_p_kg_per_ha: null,
            available_k_kg_per_ha: null,
            comment: null
          }
        };

        batchObject.farmers.push(farmer);
      }

      // Generate hash
      const hash = generateBatchHash(batchObject);
      batchObject.batch_hash = hash;

      // Save to Firebase
      const batchRef = ref(database, `batches/${batch_id}`);
      await set(batchRef, batchObject);

      return {
        batch: batchObject,
        batchHash: hash
      };
    } catch (error) {
      console.error('Error creating batch in Firebase:', error);
      throw error;
    }
  }

  /**
   * Get batch by ID
   */
  static async getByBatchId(batch_id) {
    try {
      const batchRef = ref(database, `batches/${batch_id}`);
      const snapshot = await get(batchRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val();
    } catch (error) {
      console.error('Error fetching batch from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get all batches
   */
  static async getAll(limit = 50, offset = 0) {
    try {
      const batchesRef = ref(database, 'batches');
      const snapshot = await get(batchesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const batchesObj = snapshot.val();
      const batches = Object.keys(batchesObj).map(key => {
        const batch = batchesObj[key];
        return {
          batch_id: batch.batch_id,
          product: batch.product,
          batch_hash: batch.batch_hash,
          blockchain_tx_hash: batch.blockchain_tx_hash,
          blockchain_timestamp: batch.blockchain_timestamp,
          blockchain_registrar: batch.blockchain_registrar,
          created_at: batch.created_at,
          updated_at: batch.updated_at,
          village_name: batch.village?.name,
          district: batch.village?.district,
          state: batch.village?.state,
          farmer_count: batch.farmers?.length || 0
        };
      });

      // Sort by created_at descending
      batches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply pagination
      const start = offset;
      const end = offset + limit;
      return batches.slice(start, end);
    } catch (error) {
      console.error('Error fetching all batches from Firebase:', error);
      throw error;
    }
  }

  /**
   * Search batches
   */
  static async search(searchQuery) {
    try {
      const batchesRef = ref(database, 'batches');
      const snapshot = await get(batchesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const batchesObj = snapshot.val();
      const searchLower = searchQuery.toLowerCase();

      const results = Object.keys(batchesObj)
        .map(key => batchesObj[key])
        .filter(batch => {
          return (
            batch.batch_id?.toLowerCase().includes(searchLower) ||
            batch.product?.toLowerCase().includes(searchLower) ||
            batch.village?.name?.toLowerCase().includes(searchLower) ||
            batch.village?.district?.toLowerCase().includes(searchLower) ||
            batch.village?.state?.toLowerCase().includes(searchLower)
          );
        })
        .map(batch => ({
          batch_id: batch.batch_id,
          product: batch.product,
          batch_hash: batch.batch_hash,
          blockchain_tx_hash: batch.blockchain_tx_hash,
          created_at: batch.created_at,
          village_name: batch.village?.name,
          district: batch.village?.district,
          state: batch.village?.state
        }));

      return results;
    } catch (error) {
      console.error('Error searching batches in Firebase:', error);
      throw error;
    }
  }

  /**
   * Update blockchain info
   */
  static async updateBlockchainInfo(batch_id, txHash, timestamp, registrar) {
    try {
      const updates = {
        blockchain_tx_hash: txHash,
        blockchain_timestamp: timestamp,
        blockchain_registrar: registrar,
        updated_at: new Date().toISOString()
      };

      const batchRef = ref(database, `batches/${batch_id}`);
      const snapshot = await get(batchRef);

      if (!snapshot.exists()) {
        throw new Error('Batch not found');
      }

      const currentBatch = snapshot.val();
      const updatedBatch = { ...currentBatch, ...updates };

      await set(batchRef, updatedBatch);

      return updatedBatch;
    } catch (error) {
      console.error('Error updating blockchain info in Firebase:', error);
      throw error;
    }
  }
}

class Stats {
  /**
   * Get dashboard statistics
   */
  static async getDashboard() {
    try {
      const batchesRef = ref(database, 'batches');
      const snapshot = await get(batchesRef);

      if (!snapshot.exists()) {
        return {
          total_batches: 0,
          total_farmers: 0,
          total_villages: 0,
          verified_batches: 0
        };
      }

      const batchesObj = snapshot.val();
      const batches = Object.values(batchesObj);

      const uniqueVillages = new Set();
      let totalFarmers = 0;
      let verifiedBatches = 0;

      batches.forEach(batch => {
        if (batch.village?.name) {
          uniqueVillages.add(batch.village.name);
        }
        totalFarmers += batch.farmers?.length || 0;
        if (batch.blockchain_tx_hash) {
          verifiedBatches++;
        }
      });

      return {
        total_batches: batches.length,
        total_farmers: totalFarmers,
        total_villages: uniqueVillages.size,
        verified_batches: verifiedBatches
      };
    } catch (error) {
      console.error('Error getting dashboard stats from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get product distribution
   */
  static async getProductDistribution() {
    try {
      const batchesRef = ref(database, 'batches');
      const snapshot = await get(batchesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const batchesObj = snapshot.val();
      const batches = Object.values(batchesObj);

      const productCounts = {};
      batches.forEach(batch => {
        const product = batch.product || 'unknown';
        productCounts[product] = (productCounts[product] || 0) + 1;
      });

      return Object.keys(productCounts).map(product => ({
        product: product,
        count: productCounts[product]
      }));
    } catch (error) {
      console.error('Error getting product distribution from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get farmer yield comparison
   */
  static async getFarmerYieldComparison() {
    try {
      const batchesRef = ref(database, 'batches');
      const snapshot = await get(batchesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const batchesObj = snapshot.val();
      const batches = Object.values(batchesObj);

      const farmerData = [];
      batches.forEach(batch => {
        if (batch.farmers) {
          batch.farmers.forEach(farmer => {
            farmerData.push({
              farmer_name: farmer.farmer_name,
              ideal_yield: farmer.yield_profile?.ideal_yield_kg_per_nali || 0,
              avg_yield_min: farmer.yield_profile?.avg_yield_range_kg_per_nali?.min || 0,
              avg_yield_max: farmer.yield_profile?.avg_yield_range_kg_per_nali?.max || 0
            });
          });
        }
      });

      return farmerData;
    } catch (error) {
      console.error('Error getting farmer yield comparison from Firebase:', error);
      throw error;
    }
  }
}

export { Batch, Stats };
