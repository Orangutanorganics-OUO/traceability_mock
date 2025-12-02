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

// Helper to convert video URL to embeddable format
const convertVideoUrl = (url) => {
  if (!url) return null;

  // YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    if (videoId) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${videoId}` };
    }
  }

  // Google Drive video URLs
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/(.*?)\//)?.[1] || url.match(/\/d\/([^/?]+)/)?.[1];
    if (fileId) {
      return { type: 'gdrive', url: `https://drive.google.com/file/d/${fileId}/preview` };
    }
  }

  // Vimeo URLs
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('/')[0];
    if (videoId) {
      return { type: 'vimeo', url: `https://player.vimeo.com/video/${videoId}` };
    }
  }

  // Direct video files
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return { type: 'direct', url };
  }

  return { type: 'link', url };
};

// Helper to convert Google Maps URL to embeddable iframe URL
const convertToEmbedUrl = (mapsUrl) => {
  if (!mapsUrl) return null;

  // If it's a My Maps link (maps/d/...), convert to embed format
  if (mapsUrl.includes('google.com/maps/d/')) {
    const midMatch = mapsUrl.match(/mid=([^&]+)/);
    if (midMatch) {
      return `https://www.google.com/maps/d/embed?mid=${midMatch[1]}&maptype=satellite`;
    }
  }

  // If it's already an embed URL, add satellite view if not present
  if (mapsUrl.includes('/embed')) {
    return mapsUrl.includes('maptype=') ? mapsUrl : `${mapsUrl}${mapsUrl.includes('?') ? '&' : '?'}maptype=satellite`;
  }

  // For other Google Maps URLs, try to convert to embed format
  if (mapsUrl.includes('google.com/maps')) {
    // If it has place ID
    const placeMatch = mapsUrl.match(/place\/([^/]+)/);
    if (placeMatch) {
      return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(placeMatch[1])}&maptype=satellite`;
    }
  }

  // Return original URL with satellite view parameter
  return mapsUrl.includes('?') ? `${mapsUrl}&maptype=satellite` : `${mapsUrl}?maptype=satellite`;
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

  // Carousel navigation
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="customer-view">
      {/* Compact Header */}
      <header className="cv-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-content">
          <h1 className="product-title">{batch.product.replace(/_/g, ' ')}</h1>
          <p className="batch-id-compact">ID: {batch.batch_id}</p>
        </div>
        {verification && verification.status === 'verified' ? (
          <span className="badge-verified">✓ Verified</span>
        ) : verification && verification.status === 'tampered' ? (
          <span className="badge-tampered">⚠</span>
        ) : (
          <span className="badge-pending">···</span>
        )}
      </header>
      {/* Hero Section - Traceability Message */}
      <section className="traceability-hero">
        <div className="hero-content-box">
          <h2 className="hero-headline">Know Your Food's Journey</h2>
          <p className="hero-subline">From Himalayan Farms to Your Table</p>
          <p className="hero-description">
            Because real organic isn't just about the label. It's about transparency, trust & traceability at every step.
          </p>
        </div>
      </section>

      {/* Traceability Information Table */}
      <section className="traceability-info">
        <h3 className="traceability-title">What You — the Discerning Organic Customer — Will Be Glad You Know</h3>

        <div className="traceability-grid">
          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>Where It Was Grown</h4>
              <p>Which farm, which altitude</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Farm origin, GPS/geographic location, elevation tags — e.g. 2,300m Himalayan valley</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>When It Was Grown</h4>
              <p>Date, season, harvest time</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Batch-level harvest date, crop cycle, seasonal context</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>How It Was Grown</h4>
              <p>Input practices, pesticide-free status, soil/eco practices</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Organic certification records, soil-health documentation, pesticide/natural-input logs</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>Supply Chain Journey</h4>
              <p>Processing, packaging, transport</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Processing & packaging history, batch numbers, traceable barcodes/QR codes linking to records</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>Certification & Compliance</h4>
              <p>Organic standards, audit logs</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Proof of compliance with relevant organic/regulatory standards, third-party audits or internal trace-records</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>The Farmer's Story</h4>
              <p>Community, social impact</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Farmer/co-op name, community info, social impact: empowering farmers, fair practices, sustainability</p>
            </div>
          </div>

          <div className="trace-item">
            <div className="trace-expect">
              <span className="trace-icon">📄</span>
              <h4>Sustainability Impact</h4>
              <p>Environmental footprint, ethical sourcing</p>
            </div>
            <div className="trace-provides">
              <span className="check-mark">✅</span>
              <p>Real data on carbon footprint, sustainability practices, ethical sourcing, social impact — not just marketing claims</p>
            </div>
          </div>
        </div>
      </section>

      <main className="cv-main">
        {/* Image Carousel - Priority for mobile */}
        {images.length > 0 && (
          <section className="image-carousel-section">
            <div className="carousel-container">
              <div className="carousel-image-wrapper">
                <img
                  src={convertDriveUrl(images[selectedImageIndex].url || Object.values(images[selectedImageIndex])[0])}
                  alt={images[selectedImageIndex].description || 'Product image'}
                  className="carousel-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available'; }}
                />
                {images.length > 1 && (
                  <>
                    <button className="carousel-btn prev" onClick={prevImage} aria-label="Previous image">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <button className="carousel-btn next" onClick={nextImage} aria-label="Next image">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                    <div className="carousel-indicators">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === selectedImageIndex ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {images[selectedImageIndex].description && (
                <p className="image-caption">
                  {images[selectedImageIndex].description || Object.keys(images[selectedImageIndex])[0]?.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Village Card */}
        <section className="info-card village-card">
          <div className="card-icon">🏔️</div>
          <h2 className="card-title">{batch.village?.name}</h2>
          <p className="location-text">
            📍 {batch.village?.district}, {batch.village?.state}
            {batch.village?.elevation_m && <span className="elevation"> • {batch.village?.elevation_m}m</span>}
          </p>
          {batch.village?.village_info && <p className="village-desc">{batch.village.village_info}</p>}
        </section>

        {/* Blockchain Badge (if verified) */}
        {batch.blockchain_tx_hash && verification && verification.status === 'verified' && (
          <section className="blockchain-card">
            <div className="blockchain-badge">
              <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>Blockchain Verified</span>
            </div>
            <p className="blockchain-text">
              Secured on an immutable blockchain ledger. All product information is permanently recorded and cannot be altered.
            </p>
            <a
              href={`https://amoy.polygonscan.com/tx/${batch.blockchain_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="blockchain-link"
            >
              View on Blockchain →
            </a>
          </section>
        )}

        {/* Farmer Selector */}
        {batch.farmers && batch.farmers.length > 1 && (
          <section className="farmer-selector">
            <h3 className="section-label">Our Farmers ({batch.farmers.length})</h3>
            <div className="farmer-pills">
              {batch.farmers.map((farmer, index) => (
                <button
                  key={index}
                  className={`farmer-pill ${index === selectedFarmerIndex ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFarmerIndex(index);
                    setSelectedImageIndex(0);
                  }}
                >
                  {farmer.farmer_name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Current Farmer Details */}
        {currentFarmer && (
          <>
            {/* Farmer Profile Card */}
            <section className="info-card farmer-card">
              <div className="card-icon">👨‍🌾</div>
              <h2 className="card-title">{currentFarmer.farmer_name}</h2>
              {(currentFarmer.age || currentFarmer.gender) && (
                <p className="farmer-meta">
                  {currentFarmer.age && `Age ${currentFarmer.age}`}
                  {currentFarmer.age && currentFarmer.gender && ' • '}
                  {currentFarmer.gender}
                </p>
              )}
              {currentFarmer.farmer_info && <p className="farmer-info">{currentFarmer.farmer_info}</p>}
            </section>

            {/* Videos Section with Embedded Players */}
            {videos.length > 0 && (
              <section className="videos-section">
                <h3 className="section-label">Videos</h3>
                {videos.map((video, index) => {
                  const videoUrl = video.url || Object.values(video)[0];
                  const videoData = convertVideoUrl(videoUrl);

                  return (
                    <div key={index} className="video-card">
                      {video.description && (
                        <p className="video-caption">{video.description || Object.keys(video)[0]?.replace(/_/g, ' ')}</p>
                      )}
                      {videoData.type === 'direct' ? (
                        <video controls className="video-player">
                          <source src={videoData.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : videoData.type !== 'link' ? (
                        <iframe
                          src={videoData.url}
                          className="video-iframe"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={video.description || `Video ${index + 1}`}
                        />
                      ) : (
                        <a
                          href={videoData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="video-link-btn"
                        >
                          Watch Video →
                        </a>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Land & Crop Info - Compact Grid
            {(currentFarmer.total_land_nali || currentFarmer.crop_rotation) && (
              <section className="data-grid">
                <h3 className="section-label">Farm Details</h3>
                <div className="grid-2">
                  {currentFarmer.total_land_nali && (
                    <div className="data-item">
                      <span className="data-label">Total Land</span>
                      <span className="data-value">{currentFarmer.total_land_nali} Nali</span>
                    </div>
                  )}
                  {currentFarmer.cultivated_land_acre && (
                    <div className="data-item">
                      <span className="data-label">Cultivated</span>
                      <span className="data-value">{currentFarmer.cultivated_land_acre} Acres</span>
                    </div>
                  )}
                  {currentFarmer.crop_rotation?.white_rajma_nali && (
                    <div className="data-item">
                      <span className="data-label">White Rajma</span>
                      <span className="data-value">{currentFarmer.crop_rotation.white_rajma_nali} Nali</span>
                    </div>
                  )}
                  {currentFarmer.crop_rotation?.amaranth_nali && (
                    <div className="data-item">
                      <span className="data-label">Amaranth</span>
                      <span className="data-value">{currentFarmer.crop_rotation.amaranth_nali} Nali</span>
                    </div>
                  )}
                </div>
              </section>
            )} */}

            
            {/* {currentFarmer.yield_profile && (
              <section className="data-grid">
                <h3 className="section-label">Yield Information</h3>
                <div className="grid-2">
                  {currentFarmer.yield_profile.ideal_yield_kg_per_nali && (
                    <div className="data-item">
                      <span className="data-label">Ideal Yield</span>
                      <span className="data-value">{currentFarmer.yield_profile.ideal_yield_kg_per_nali} kg/Nali</span>
                    </div>
                  )}
                  {currentFarmer.yield_profile.estimated_rajma_ideal_yield_kg && (
                    <div className="data-item">
                      <span className="data-label">Est. Total</span>
                      <span className="data-value">{currentFarmer.yield_profile.estimated_rajma_ideal_yield_kg} kg</span>
                    </div>
                  )}
                  {currentFarmer.yield_profile.estimated_seed_required_kg && (
                    <div className="data-item">
                      <span className="data-label">Seed Required</span>
                      <span className="data-value">{currentFarmer.yield_profile.estimated_seed_required_kg} kg</span>
                    </div>
                  )}
                </div>
              </section>
            )} */}

            {/* Season Timeline - Compact */}
            {currentFarmer.season_calendar && (
              <section className="season-section">
                <h3 className="section-label">Farming Calendar</h3>
                <div className="season-timeline">
                  {currentFarmer.season_calendar.seed_sowing_window && (
                    <div className="season-item">
                      <div className="season-icon">🌱</div>
                      <div className="season-content">
                        <h4>Sowing</h4>
                        <p>{currentFarmer.season_calendar.seed_sowing_window}</p>
                      </div>
                    </div>
                  )}
                  {currentFarmer.season_calendar.staking_window && (
                    <div className="season-item">
                      <div className="season-icon">🌿</div>
                      <div className="season-content">
                        <h4>Staking</h4>
                        <p>{currentFarmer.season_calendar.staking_window}</p>
                      </div>
                    </div>
                  )}
                  {currentFarmer.season_calendar.harvest_window && (
                    <div className="season-item">
                      <div className="season-icon">🌾</div>
                      <div className="season-content">
                        <h4>Harvest</h4>
                        <p>{currentFarmer.season_calendar.harvest_window}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Post Harvest & Packaging */}
            {(currentFarmer.post_harvest_info || currentFarmer.packaging_status) && (
              <section className="info-card">
                <div className="card-icon">📦</div>
                <h3 className="card-title">Processing & Quality</h3>
                {currentFarmer.post_harvest_info?.primary_practices?.length > 0 && (
                  <div className="tag-list">
                    {currentFarmer.post_harvest_info.primary_practices.map((practice, index) => (
                      <span key={index} className="tag">{practice.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}
                {currentFarmer.post_harvest_info?.family_involvement && (
                  <p className="card-text">{currentFarmer.post_harvest_info.family_involvement}</p>
                )}
                {currentFarmer.packaging_status && (
                  <p className="card-text">{currentFarmer.packaging_status}</p>
                )}
              </section>
            )}

            
            {/* {currentFarmer.soil_organic_carbon && (
              <section className="soil-section">
                <h3 className="section-label">Soil Quality</h3>
                {currentFarmer.soil_organic_carbon.rating && (
                  <div className="soil-rating-badge">
                    {currentFarmer.soil_organic_carbon.rating.replace(/_/g, ' ').toUpperCase()}
                  </div>
                )}
                <div className="grid-2">
                  {currentFarmer.soil_organic_carbon.ph && (
                    <div className="data-item highlight">
                      <span className="data-label">pH Level</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.ph}</span>
                    </div>
                  )}
                  {currentFarmer.soil_organic_carbon.topsoil_oc_pct && (
                    <div className="data-item highlight">
                      <span className="data-label">Organic Carbon</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.topsoil_oc_pct}%</span>
                    </div>
                  )}
                  {currentFarmer.soil_organic_carbon.available_n_kg_per_ha && (
                    <div className="data-item">
                      <span className="data-label">Nitrogen (N)</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.available_n_kg_per_ha} kg/ha</span>
                    </div>
                  )}
                  {currentFarmer.soil_organic_carbon.available_p_kg_per_ha && (
                    <div className="data-item">
                      <span className="data-label">Phosphorus (P)</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.available_p_kg_per_ha} kg/ha</span>
                    </div>
                  )}
                  {currentFarmer.soil_organic_carbon.available_k_kg_per_ha && (
                    <div className="data-item">
                      <span className="data-label">Potassium (K)</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.available_k_kg_per_ha} kg/ha</span>
                    </div>
                  )}
                  {currentFarmer.soil_organic_carbon.organic_matter_pct_est && (
                    <div className="data-item">
                      <span className="data-label">Organic Matter</span>
                      <span className="data-value">{currentFarmer.soil_organic_carbon.organic_matter_pct_est}%</span>
                    </div>
                  )}
                </div>
                {currentFarmer.soil_organic_carbon.comment && (
                  <p className="soil-comment">{currentFarmer.soil_organic_carbon.comment}</p>
                )}
              </section>
            )} */}

            {/* Farm Locations - Compact Maps */}
            {locations.length > 0 && (
              <section className="locations-section">
                <h3 className="section-label">Farm Locations</h3>
                {locations.map((location, index) => {
                  const farmName = Object.keys(location)[0];
                  const mapsUrl = Object.values(location)[0];
                  const embedUrl = convertToEmbedUrl(mapsUrl);

                  return (
                    <div key={index} className="location-card">
                      <h4 className="location-name">{farmName.replace(/_/g, ' ')}</h4>
                      {embedUrl && (
                        <div className="map-wrapper">
                          <iframe
                            src={embedUrl}
                            className="map-iframe"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Map for ${farmName}`}
                          />
                        </div>
                      )}
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          Open in Google Maps →
                        </a>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default CustomerView;
