import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CustomerView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Helper to convert Google Drive links to viewable format
const convertDriveUrl = (url) => {
  if (url && url.includes('drive.google.com/file/d/')) {
    const fileId = url.match(/\/d\/(.*?)\//)?.[1] || url.match(/\/d\/([^/?]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  return url;
};

// Helper to convert Google Maps URL to embeddable iframe URL
const convertToEmbedUrl = (mapsUrl) => {
  if (!mapsUrl) return null;

  // If it's a My Maps link (maps/d/...), convert to embed format
  if (mapsUrl.includes('google.com/maps/d/')) {
    const midMatch = mapsUrl.match(/mid=([^&]+)/);
    if (midMatch) {
      return `https://www.google.com/maps/d/embed?mid=${midMatch[1]}`;
    }
  }

  // If it's already an embed URL, return as is
  if (mapsUrl.includes('/embed')) {
    return mapsUrl;
  }

  // For other Google Maps URLs, try to convert to embed format
  if (mapsUrl.includes('google.com/maps')) {
    // If it has place ID
    const placeMatch = mapsUrl.match(/place\/([^/]+)/);
    if (placeMatch) {
      return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(placeMatch[1])}`;
    }
  }

  // Return original URL as fallback
  return mapsUrl;
};

function CustomerView() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarmerIndex, setSelectedFarmerIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchBatchData();
  }, [batchId]);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching batch:', batchId);
      const response = await axios.get(`${API_URL}/api/batches/${encodeURIComponent(batchId)}`);
      setBatch(response.data.batch);
      setVerification(response.data.verification);
      setError(null);
    } catch (err) {
      setError('Batch not found');
      console.error('Error fetching batch:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-view">
        <div className="loading">Loading batch information...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="customer-view">
        <div className="error-box">
          <h2>Batch Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn">Back to Home</button>
        </div>
      </div>
    );
  }

  const currentFarmer = batch.farmers?.[selectedFarmerIndex];
  const images = currentFarmer?.media?.image_links || [];
  const videos = currentFarmer?.media?.video_links || [];
  const locations = currentFarmer?.locations || [];

  return (
    <div className="customer-view">
      {/* Header */}
      <div className="header">
        <button onClick={() => navigate('/')} className="back-btn">← Back</button>
        <h1>{batch.product.replace(/_/g, ' ').toUpperCase()}</h1>
        {verification && verification.status === 'verified' ? (
          <div className="verified-badge">✓ Blockchain Verified</div>
        ) : verification && verification.status === 'tampered' ? (
          <div className="tampered-badge">⚠ Data Tampered</div>
        ) : verification && verification.status === 'not_registered' ? (
          <div className="not-registered-badge">Not Registered</div>
        ) : (
          <div className="pending-badge">Pending</div>
        )}
      </div>

      <div className="content">
        {/* Batch ID */}
        <div className="section">
          <div className="batch-id">Batch ID: {batch.batch_id}</div>
        </div>

        {/* Blockchain Verification Explanation */}
        {batch.blockchain_tx_hash && verification && (
          <div className="section blockchain-info">
            <h2>Why Blockchain?</h2>
            <p>
              This batch is secured on the blockchain, a digital ledger that cannot be altered or faked.
              Every detail about this product - from the farmer to the harvest - has been recorded permanently.
              {verification.status === 'verified' && (
                <> This means you can trust that the information you see here is authentic and hasn't been changed.</>
              )}
              {verification.status === 'tampered' && (
                <> <strong style={{ color: '#d32f2f' }}>WARNING: The current data does not match what was originally recorded on the blockchain. The information may have been modified.</strong></>
              )}
            </p>
            <div className="blockchain-details">
              <small>
                <strong>Transaction Hash:</strong><br />
                {batch.blockchain_tx_hash}
                <br />
                <a
                  href={`https://amoy.polygonscan.com/tx/${batch.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blockchain-link"
                  style={{ color: '#4CAF50', textDecoration: 'underline', fontSize: '12px' }}
                >
                  View on Polygonscan →
                </a>
                <br /><br />
                <strong>Verification Status:</strong> {verification.status.replace(/_/g, ' ').toUpperCase()}<br />
                {verification.blockchain_hash && (
                  <>
                    <strong>Blockchain Hash:</strong><br />
                    <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{verification.blockchain_hash}</code>
                    <br />
                  </>
                )}
                {verification.current_hash && (
                  <>
                    <strong>Current Data Hash:</strong><br />
                    <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{verification.current_hash}</code>
                  </>
                )}
              </small>
            </div>
          </div>
        )}

        {/* Village Information */}
        <div className="section">
          <h2>From the Village of {batch.village?.name}</h2>
          <p className="location-info">
            📍 {batch.village?.district}, {batch.village?.state}
            {batch.village?.elevation_m && ` • ${batch.village?.elevation_m}m elevation`}
          </p>
          <p className="village-story">{batch.village?.village_info}</p>
        </div>

        {/* Farmer Tabs */}
        {batch.farmers && batch.farmers.length > 1 && (
          <div className="section">
            <h3>Our Farmers ({batch.farmers.length})</h3>
            <div className="farmer-tabs">
              {batch.farmers.map((farmer, index) => (
                <button
                  key={index}
                  className={`tab ${index === selectedFarmerIndex ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFarmerIndex(index);
                    setSelectedImageIndex(0);
                  }}
                >
                  {farmer.farmer_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Farmer Details */}
        {currentFarmer && (
          <>
            {/* Farmer Profile */}
            <div className="section farmer-profile">
              <h2>{currentFarmer.farmer_name}</h2>
              <p className="farmer-meta">Age {currentFarmer.age} • {currentFarmer.gender}</p>
              <p>{currentFarmer.farmer_info}</p>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="section">
                <h3>Gallery</h3>
                <div className="image-gallery">
                  <img
                    src={convertDriveUrl(images[selectedImageIndex].url || Object.values(images[selectedImageIndex])[0])}
                    alt={images[selectedImageIndex].description || Object.keys(images[selectedImageIndex])[0]}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Image'; }}
                  />
                  <p className="image-caption">
                    {images[selectedImageIndex].description || Object.keys(images[selectedImageIndex])[0].replace(/_/g, ' ')}
                  </p>
                  {images.length > 1 && (
                    <div className="thumbnails">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={convertDriveUrl(img.url || Object.values(img)[0])}
                            alt={img.description || Object.keys(img)[0]}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Img'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="section">
                <h3>Videos</h3>
                {videos.map((video, index) => (
                  <div key={index} className="video-item">
                    <p>{video.description || Object.keys(video)[0].replace(/_/g, ' ')}</p>
                    <a
                      href={video.url || Object.values(video)[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      Watch Video →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Land Details */}
            <div className="section">
              <h3>Land Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Total Land</span>
                  <span className="value">{currentFarmer.total_land_nali} Nali</span>
                </div>
                <div className="info-item">
                  <span className="label">Cultivated Land</span>
                  <span className="value">{currentFarmer.cultivated_land_nali} Nali ({currentFarmer.cultivated_land_acre} Acres)</span>
                </div>
              </div>
            </div>

            {/* Crop Rotation */}
            {currentFarmer.crop_rotation && (
              <div className="section">
                <h3>Crop Rotation</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">White Rajma</span>
                    <span className="value">{currentFarmer.crop_rotation.white_rajma_nali} Nali ({currentFarmer.crop_rotation.white_rajma_share_pct}%)</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Amaranth</span>
                    <span className="value">{currentFarmer.crop_rotation.amaranth_nali} Nali ({currentFarmer.crop_rotation.amaranth_share_pct}%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Yield Profile */}
            {currentFarmer.yield_profile && (
              <div className="section">
                <h3>Yield Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Ideal Yield</span>
                    <span className="value">{currentFarmer.yield_profile.ideal_yield_kg_per_nali} kg/Nali</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Average Yield Range</span>
                    <span className="value">
                      {currentFarmer.yield_profile.avg_yield_range_kg_per_nali?.min} - {currentFarmer.yield_profile.avg_yield_range_kg_per_nali?.max} kg/Nali
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Estimated Total Yield</span>
                    <span className="value">
                      {currentFarmer.yield_profile.estimated_rajma_avg_yield_range_kg?.min} - {currentFarmer.yield_profile.estimated_rajma_avg_yield_range_kg?.max} kg
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Seed Required</span>
                    <span className="value">{currentFarmer.yield_profile.estimated_seed_required_kg} kg</span>
                  </div>
                </div>
              </div>
            )}

            {/* Season Calendar */}
            {currentFarmer.season_calendar && (
              <div className="section">
                <h3>Farming Calendar</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="icon">🌱</div>
                    <div className="timeline-content">
                      <h4>Sowing</h4>
                      <p>{currentFarmer.season_calendar.seed_sowing_window}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="icon">🌿</div>
                    <div className="timeline-content">
                      <h4>Staking</h4>
                      <p>{currentFarmer.season_calendar.staking_window}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="icon">🌾</div>
                    <div className="timeline-content">
                      <h4>Harvest</h4>
                      <p>{currentFarmer.season_calendar.harvest_window}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Post Harvest */}
            {currentFarmer.post_harvest_info && (
              <div className="section">
                <h3>Post-Harvest Processing</h3>
                {currentFarmer.post_harvest_info.primary_practices?.length > 0 && (
                  <div className="practices">
                    {currentFarmer.post_harvest_info.primary_practices.map((practice, index) => (
                      <span key={index} className="practice-tag">
                        {practice.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {currentFarmer.post_harvest_info.family_involvement && (
                  <p className="family-info">{currentFarmer.post_harvest_info.family_involvement}</p>
                )}
              </div>
            )}

            {/* Packaging */}
            {currentFarmer.packaging_status && (
              <div className="section">
                <h3>Quality & Packaging</h3>
                <p>{currentFarmer.packaging_status}</p>
              </div>
            )}

            {/* Soil Organic Carbon */}
            {currentFarmer.soil_organic_carbon && (
              <div className="section soil-section">
                <h3>Soil Quality</h3>
                <p className="soil-rating">
                  Rating: <strong>{currentFarmer.soil_organic_carbon.rating?.replace(/_/g, ' ').toUpperCase()}</strong>
                </p>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Sampling Year</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.sampling_year}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Sampling Depth</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.sampling_depth_cm} cm</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Topsoil Organic Carbon</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.topsoil_oc_pct}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Subsoil Organic Carbon</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.subsoil_oc_pct}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Organic Matter</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.organic_matter_pct_est}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">pH Level</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.ph}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Bulk Density</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.bulk_density_g_cc} g/cc</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Available Nitrogen</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.available_n_kg_per_ha} kg/ha</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Available Phosphorus</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.available_p_kg_per_ha} kg/ha</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Available Potassium</span>
                    <span className="value">{currentFarmer.soil_organic_carbon.available_k_kg_per_ha} kg/ha</span>
                  </div>
                </div>
                {currentFarmer.soil_organic_carbon.comment && (
                  <p className="soil-comment">{currentFarmer.soil_organic_carbon.comment}</p>
                )}
              </div>
            )}

            {/* Farm Locations */}
            {locations.length > 0 && (
              <div className="section">
                <h3>Farm Locations</h3>
                {locations.map((location, index) => {
                  const farmName = Object.keys(location)[0];
                  const mapsUrl = Object.values(location)[0];
                  const embedUrl = convertToEmbedUrl(mapsUrl);

                  return (
                    <div key={index} className="location-item">
                      <h4>{farmName.replace(/_/g, ' ')}</h4>
                      {embedUrl && (
                        <div className="map-container">
                          <iframe
                            src={embedUrl}
                            width="100%"
                            height="400"
                            style={{ border: 0, borderRadius: '8px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Map for ${farmName}`}
                          ></iframe>
                        </div>
                      )}
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ marginTop: '10px' }}
                        >
                          Open in Google Maps →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerView;
