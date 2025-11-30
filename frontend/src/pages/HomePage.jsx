import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function HomePage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/batches`);
      setBatches(response.data.batches);
      setError(null);
    } catch (err) {
      setError('Failed to load batches. Please try again later.');
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchBatches();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/search?q=${searchQuery}`);
      setBatches(response.data.results);
      setError(null);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewBatch = (batchId) => {
    navigate(`/batch/${encodeURIComponent(batchId)}`);
  };

  return (
    <div className="home-page himalayan-pattern">
      <div className="container">
        {/* Hero Section */}
        <div className="hero-section fade-in">
          <h1 className="hero-title">Himalayan Organic Traceability</h1>
          <p className="hero-subtitle">
            Authentic products from the Himalayas, verified on blockchain
          </p>
          <div className="hero-decoration"></div>
        </div>

        {/* Search Bar */}
        <div className="search-section slide-in-left">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by batch ID, product, or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchBatches();
                }}
                className="btn btn-secondary ml-sm"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading batches...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message card fade-in">
            <p>{error}</p>
            <button onClick={fetchBatches} className="btn btn-primary mt-sm">
              Retry
            </button>
          </div>
        )}

        {/* Batches Grid */}
        {!loading && !error && (
          <>
            <div className="batches-header slide-in-right">
              <h2>Available Batches</h2>
              <p className="batch-count">
                {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
              </p>
            </div>

            {batches.length === 0 ? (
              <div className="no-batches card fade-in">
                <p>No batches found. Try a different search query.</p>
              </div>
            ) : (
              <div className="batches-grid">
                {batches.map((batch, index) => (
                  <div
                    key={batch.batch_id}
                    className="batch-card card fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => viewBatch(batch.batch_id)}
                  >
                    <div className="batch-card-header">
                      <h3 className="batch-product">{batch.product.replace(/_/g, ' ')}</h3>
                      <span className="badge badge-success">
                        {batch.blockchain_tx_hash ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="batch-card-body">
                      <div className="batch-info-item">
                        <span className="info-label">Batch ID:</span>
                        <span className="info-value">{batch.batch_id}</span>
                      </div>

                      <div className="batch-info-item">
                        <span className="info-label">Village:</span>
                        <span className="info-value">{batch.village_name}</span>
                      </div>

                      <div className="batch-info-item">
                        <span className="info-label">Location:</span>
                        <span className="info-value">
                          {batch.district}, {batch.state}
                        </span>
                      </div>

                      <div className="batch-info-item">
                        <span className="info-label">Farmers:</span>
                        <span className="info-value">{batch.farmer_count}</span>
                      </div>

                      <div className="batch-info-item">
                        <span className="info-label">Created:</span>
                        <span className="info-value">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="batch-card-footer">
                      <button className="btn btn-primary btn-block">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="footer-actions fade-in">
          <button
            onClick={() => navigate('/analytics')}
            className="btn btn-outline"
          >
            View Analytics
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="btn btn-secondary ml-sm"
          >
            Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
