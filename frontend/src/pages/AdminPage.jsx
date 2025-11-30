import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state matching the exact format provided by user
  const [formData, setFormData] = useState({
    batch_id: '',
    product: '',
    village: {
      name: '',
      district: '',
      state: '',
      elevation_m: '',
      village_info: ''
    },
    farmers: [{
      farmer_name: '',
      age: '',
      gender: 'male',
      farmer_info: '',
      total_land_nali: '',
      cultivated_land_nali: '',
      cultivated_land_acre: '',
      crop_rotation: {
        white_rajma_nali: '',
        white_rajma_share_pct: '',
        amaranth_nali: '',
        amaranth_share_pct: ''
      },
      yield_profile: {
        ideal_yield_kg_per_nali: '',
        avg_yield_range_kg_per_nali: { min: '', max: '' },
        estimated_rajma_ideal_yield_kg: '',
        estimated_rajma_avg_yield_range_kg: { min: '', max: '' },
        seed_required_kg_per_nali: { min: '', max: '' },
        estimated_seed_required_kg: ''
      },
      season_calendar: {
        seed_sowing_window: '',
        staking_window: '',
        harvest_window: ''
      },
      post_harvest_info: {
        primary_practices: [],
        family_involvement: ''
      },
      packaging_status: '',
      media: {
        image_links: [{ url: '', description: '' }],
        video_links: [{ url: '', description: '' }]
      },
      locations: [{ farm_1: '' }],
      soil_organic_carbon: {
        sampling_year: new Date().getFullYear(),
        sampling_depth_cm: '0-15',
        topsoil_oc_pct: '',
        subsoil_oc_pct: '',
        rating: '',
        organic_matter_pct_est: '',
        ph: '',
        bulk_density_g_cc: '',
        available_n_kg_per_ha: '',
        available_p_kg_per_ha: '',
        available_k_kg_per_ha: '',
        comment: ''
      }
    }]
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/admin/verify-password`, { password });
      if (response.data.valid) {
        setIsAuthenticated(true);
        setAuthError('');
        localStorage.setItem('adminPassword', password);
      }
    } catch (error) {
      setAuthError('Invalid password. Please try again.');
    }
  };

  const updateFormData = (path, value) => {
    const newData = { ...formData };
    const keys = path.split('.');
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const match = key.match(/(\w+)\[(\d+)\]/);
      if (match) {
        const arrayKey = match[1];
        const index = parseInt(match[2]);
        current = current[arrayKey][index];
      } else {
        current = current[key];
      }
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    setFormData(newData);
  };

  const addFarmer = () => {
    setFormData({
      ...formData,
      farmers: [...formData.farmers, {
        farmer_name: '',
        age: '',
        gender: 'male',
        farmer_info: '',
        total_land_nali: '',
        cultivated_land_nali: '',
        cultivated_land_acre: '',
        crop_rotation: {
          white_rajma_nali: '',
          white_rajma_share_pct: '',
          amaranth_nali: '',
          amaranth_share_pct: ''
        },
        yield_profile: {
          ideal_yield_kg_per_nali: '',
          avg_yield_range_kg_per_nali: { min: '', max: '' },
          estimated_rajma_ideal_yield_kg: '',
          estimated_rajma_avg_yield_range_kg: { min: '', max: '' },
          seed_required_kg_per_nali: { min: '', max: '' },
          estimated_seed_required_kg: ''
        },
        season_calendar: {
          seed_sowing_window: '',
          staking_window: '',
          harvest_window: ''
        },
        post_harvest_info: {
          primary_practices: [],
          family_involvement: ''
        },
        packaging_status: '',
        media: {
          image_links: [{ url: '', description: '' }],
          video_links: [{ url: '', description: '' }]
        },
        locations: [{ farm_1: '' }],
        soil_organic_carbon: {
          sampling_year: new Date().getFullYear(),
          sampling_depth_cm: '0-15',
          topsoil_oc_pct: '',
          subsoil_oc_pct: '',
          rating: '',
          organic_matter_pct_est: '',
          ph: '',
          bulk_density_g_cc: '',
          available_n_kg_per_ha: '',
          available_p_kg_per_ha: '',
          available_k_kg_per_ha: '',
          comment: ''
        }
      }]
    });
  };

  const removeFarmer = (index) => {
    const newFarmers = formData.farmers.filter((_, i) => i !== index);
    setFormData({ ...formData, farmers: newFarmers });
  };

  const addMedia = (farmerIndex, type) => {
    const newFarmers = [...formData.farmers];
    newFarmers[farmerIndex].media[type].push({ url: '', description: '' });
    setFormData({ ...formData, farmers: newFarmers });
  };

  const addLocation = (farmerIndex) => {
    const newFarmers = [...formData.farmers];
    const count = newFarmers[farmerIndex].locations.length + 1;
    newFarmers[farmerIndex].locations.push({ [`farm_${count}`]: '' });
    setFormData({ ...formData, farmers: newFarmers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Ensure primary_practices is an array before submitting
      const submissionData = {
        ...formData,
        farmers: formData.farmers.map(farmer => ({
          ...farmer,
          post_harvest_info: {
            ...farmer.post_harvest_info,
            primary_practices: typeof farmer.post_harvest_info.primary_practices === 'string'
              ? farmer.post_harvest_info.primary_practices.split(',').map(p => p.trim()).filter(p => p)
              : farmer.post_harvest_info.primary_practices
          }
        }))
      };

      const response = await axios.post(
        `${API_URL}/api/admin/batches`,
        submissionData,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );

      setSubmitStatus({
        type: 'success',
        message: `Batch ${formData.batch_id} created successfully!`
      });

      setTimeout(() => {
        navigate(`/batch/${encodeURIComponent(formData.batch_id)}`);
      }, 2000);

    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to create batch. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="login-box">
            <h1>Admin Portal</h1>
            <p>Enter admin password to continue</p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              {authError && <p className="error">{authError}</p>}
              <div className="button-group">
                <button type="submit" className="btn-primary">Login</button>
                <button type="button" onClick={() => navigate('/')} className="btn-secondary">Back</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin form
  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Create New Batch</h1>
          <button onClick={() => navigate('/')} className="btn-secondary">Back to Home</button>
        </div>

        {submitStatus.message && (
          <div className={`status-message ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">

          {/* Batch Information */}
          <div className="form-section">
            <h2>Batch Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Batch ID *</label>
                <input
                  type="text"
                  value={formData.batch_id}
                  onChange={(e) => updateFormData('batch_id', e.target.value)}
                  placeholder="OUO_Batch_12345"
                  required
                />
              </div>
              <div className="form-group">
                <label>Product *</label>
                <input
                  type="text"
                  value={formData.product}
                  onChange={(e) => updateFormData('product', e.target.value)}
                  placeholder="white_rajma"
                  required
                />
              </div>
            </div>
          </div>

          {/* Village Information */}
          <div className="form-section">
            <h2>Village Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Village Name *</label>
                <input
                  type="text"
                  value={formData.village.name}
                  onChange={(e) => updateFormData('village.name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  value={formData.village.district}
                  onChange={(e) => updateFormData('village.district', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.village.state}
                  onChange={(e) => updateFormData('village.state', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Elevation (m)</label>
                <input
                  type="number"
                  value={formData.village.elevation_m}
                  onChange={(e) => updateFormData('village.elevation_m', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Village Information</label>
              <textarea
                value={formData.village.village_info}
                onChange={(e) => updateFormData('village.village_info', e.target.value)}
                rows="5"
                placeholder="Describe the village, its history, culture, and significance..."
              />
            </div>
          </div>

          {/* Farmers */}
          {formData.farmers.map((farmer, farmerIndex) => (
            <div key={farmerIndex} className="farmer-section form-section">
              <div className="section-header">
                <h2>Farmer {farmerIndex + 1}</h2>
                {formData.farmers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFarmer(farmerIndex)}
                    className="btn-danger"
                  >
                    Remove Farmer
                  </button>
                )}
              </div>

              {/* Basic Farmer Info */}
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Farmer Name *</label>
                  <input
                    type="text"
                    value={farmer.farmer_name}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].farmer_name`, e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={farmer.age}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].age`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={farmer.gender}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].gender`, e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Farmer Information</label>
                <textarea
                  value={farmer.farmer_info}
                  onChange={(e) => updateFormData(`farmers[${farmerIndex}].farmer_info`, e.target.value)}
                  rows="4"
                  placeholder="Tell the farmer's story..."
                />
              </div>

              {/* Land Details */}
              <h3>Land Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Land (Nali)</label>
                  <input
                    type="number"
                    value={farmer.total_land_nali}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].total_land_nali`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cultivated Land (Nali)</label>
                  <input
                    type="number"
                    value={farmer.cultivated_land_nali}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].cultivated_land_nali`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cultivated Land (Acre)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={farmer.cultivated_land_acre}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].cultivated_land_acre`, e.target.value)}
                  />
                </div>
              </div>

              {/* Crop Rotation */}
              <h3>Crop Rotation</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>White Rajma (Nali)</label>
                  <input
                    type="number"
                    value={farmer.crop_rotation.white_rajma_nali}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].crop_rotation.white_rajma_nali`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>White Rajma Share (%)</label>
                  <input
                    type="number"
                    value={farmer.crop_rotation.white_rajma_share_pct}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].crop_rotation.white_rajma_share_pct`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Amaranth (Nali)</label>
                  <input
                    type="number"
                    value={farmer.crop_rotation.amaranth_nali}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].crop_rotation.amaranth_nali`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Amaranth Share (%)</label>
                  <input
                    type="number"
                    value={farmer.crop_rotation.amaranth_share_pct}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].crop_rotation.amaranth_share_pct`, e.target.value)}
                  />
                </div>
              </div>

              {/* Yield Profile */}
              <h3>Yield Profile</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Ideal Yield (kg/Nali)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.ideal_yield_kg_per_nali}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.ideal_yield_kg_per_nali`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Avg Yield Min (kg/Nali)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.avg_yield_range_kg_per_nali.min}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.avg_yield_range_kg_per_nali.min`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Avg Yield Max (kg/Nali)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.avg_yield_range_kg_per_nali.max}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.avg_yield_range_kg_per_nali.max`, e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Rajma Ideal Yield (kg)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.estimated_rajma_ideal_yield_kg}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.estimated_rajma_ideal_yield_kg`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Rajma Yield Min (kg)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.estimated_rajma_avg_yield_range_kg.min}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.estimated_rajma_avg_yield_range_kg.min`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Rajma Yield Max (kg)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.estimated_rajma_avg_yield_range_kg.max}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.estimated_rajma_avg_yield_range_kg.max`, e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Seed Required Min (kg/Nali)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.seed_required_kg_per_nali.min}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.seed_required_kg_per_nali.min`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Seed Required Max (kg/Nali)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.seed_required_kg_per_nali.max}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.seed_required_kg_per_nali.max`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Seed Required (kg)</label>
                  <input
                    type="number"
                    value={farmer.yield_profile.estimated_seed_required_kg}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].yield_profile.estimated_seed_required_kg`, e.target.value)}
                  />
                </div>
              </div>

              {/* Season Calendar */}
              <h3>Season Calendar</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Seed Sowing Window</label>
                  <input
                    type="text"
                    value={farmer.season_calendar.seed_sowing_window}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].season_calendar.seed_sowing_window`, e.target.value)}
                    placeholder="late May to early June"
                  />
                </div>
                <div className="form-group">
                  <label>Staking Window</label>
                  <input
                    type="text"
                    value={farmer.season_calendar.staking_window}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].season_calendar.staking_window`, e.target.value)}
                    placeholder="August"
                  />
                </div>
                <div className="form-group">
                  <label>Harvest Window</label>
                  <input
                    type="text"
                    value={farmer.season_calendar.harvest_window}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].season_calendar.harvest_window`, e.target.value)}
                    placeholder="October"
                  />
                </div>
              </div>

              {/* Post Harvest */}
              <h3>Post-Harvest Information</h3>
              <div className="form-group">
                <label>Primary Practices (comma-separated)</label>
                <textarea
                  value={Array.isArray(farmer.post_harvest_info.primary_practices)
                    ? farmer.post_harvest_info.primary_practices.join(', ')
                    : farmer.post_harvest_info.primary_practices}
                  onChange={(e) => {
                    // Store as-is to allow typing commas
                    updateFormData(`farmers[${farmerIndex}].post_harvest_info.primary_practices`, e.target.value);
                  }}
                  onBlur={(e) => {
                    // Convert to array on blur
                    const practices = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                    updateFormData(`farmers[${farmerIndex}].post_harvest_info.primary_practices`, practices);
                  }}
                  rows="2"
                  placeholder="sun_dried, hand_sorted, stone_polished"
                />
              </div>
              <div className="form-group">
                <label>Family Involvement</label>
                <textarea
                  value={farmer.post_harvest_info.family_involvement}
                  onChange={(e) => updateFormData(`farmers[${farmerIndex}].post_harvest_info.family_involvement`, e.target.value)}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Packaging Status</label>
                <textarea
                  value={farmer.packaging_status}
                  onChange={(e) => updateFormData(`farmers[${farmerIndex}].packaging_status`, e.target.value)}
                  rows="2"
                />
              </div>

              {/* Media Links */}
              <h3>Media (Images & Videos)</h3>
              <div className="media-section">
                <label>Image Links</label>
                {farmer.media.image_links.map((img, imgIndex) => (
                  <div key={imgIndex} className="media-item">
                    <input
                      type="url"
                      value={img.url}
                      onChange={(e) => {
                        const newFarmers = [...formData.farmers];
                        newFarmers[farmerIndex].media.image_links[imgIndex].url = e.target.value;
                        setFormData({ ...formData, farmers: newFarmers });
                      }}
                      placeholder="Image URL (Google Drive link)"
                    />
                    <input
                      type="text"
                      value={img.description}
                      onChange={(e) => {
                        const newFarmers = [...formData.farmers];
                        newFarmers[farmerIndex].media.image_links[imgIndex].description = e.target.value;
                        setFormData({ ...formData, farmers: newFarmers });
                      }}
                      placeholder="Image description (e.g., Photo of the farm, Harvesting process)"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMedia(farmerIndex, 'image_links')}
                  className="btn-secondary btn-sm"
                >
                  + Add Image
                </button>
              </div>

              <div className="media-section">
                <label>Video Links</label>
                {farmer.media.video_links.map((vid, vidIndex) => (
                  <div key={vidIndex} className="media-item">
                    <input
                      type="url"
                      value={vid.url}
                      onChange={(e) => {
                        const newFarmers = [...formData.farmers];
                        newFarmers[farmerIndex].media.video_links[vidIndex].url = e.target.value;
                        setFormData({ ...formData, farmers: newFarmers });
                      }}
                      placeholder="Video URL (Google Drive link)"
                    />
                    <input
                      type="text"
                      value={vid.description}
                      onChange={(e) => {
                        const newFarmers = [...formData.farmers];
                        newFarmers[farmerIndex].media.video_links[vidIndex].description = e.target.value;
                        setFormData({ ...formData, farmers: newFarmers });
                      }}
                      placeholder="Video description (e.g., Farm tour, Planting techniques)"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMedia(farmerIndex, 'video_links')}
                  className="btn-secondary btn-sm"
                >
                  + Add Video
                </button>
              </div>

              {/* Farm Locations */}
              <h3>Farm Locations (Google Maps URLs)</h3>
              {farmer.locations.map((loc, locIndex) => {
                const key = Object.keys(loc)[0];
                return (
                  <div key={locIndex} className="form-group">
                    <label>{key.replace(/_/g, ' ')}</label>
                    <input
                      type="url"
                      value={loc[key]}
                      onChange={(e) => {
                        const newFarmers = [...formData.farmers];
                        newFarmers[farmerIndex].locations[locIndex][key] = e.target.value;
                        setFormData({ ...formData, farmers: newFarmers });
                      }}
                      placeholder="Google Maps URL"
                    />
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => addLocation(farmerIndex)}
                className="btn-secondary btn-sm"
              >
                + Add Location
              </button>

              {/* Soil Organic Carbon */}
              <h3>Soil Organic Carbon</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Sampling Year</label>
                  <input
                    type="number"
                    value={farmer.soil_organic_carbon.sampling_year}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.sampling_year`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Sampling Depth (cm)</label>
                  <input
                    type="text"
                    value={farmer.soil_organic_carbon.sampling_depth_cm}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.sampling_depth_cm`, e.target.value)}
                    placeholder="0-15"
                  />
                </div>
                <div className="form-group">
                  <label>Topsoil OC (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={farmer.soil_organic_carbon.topsoil_oc_pct}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.topsoil_oc_pct`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Subsoil OC (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={farmer.soil_organic_carbon.subsoil_oc_pct}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.subsoil_oc_pct`, e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rating</label>
                  <select
                    value={farmer.soil_organic_carbon.rating}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.rating`, e.target.value)}
                  >
                    <option value="">Select rating</option>
                    <option value="very_high">Very High</option>
                    <option value="high">High</option>
                    <option value="moderately_high">Moderately High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Organic Matter (% est.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={farmer.soil_organic_carbon.organic_matter_pct_est}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.organic_matter_pct_est`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={farmer.soil_organic_carbon.ph}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.ph`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Bulk Density (g/cc)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={farmer.soil_organic_carbon.bulk_density_g_cc}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.bulk_density_g_cc`, e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Available N (kg/ha)</label>
                  <input
                    type="number"
                    value={farmer.soil_organic_carbon.available_n_kg_per_ha}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.available_n_kg_per_ha`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Available P (kg/ha)</label>
                  <input
                    type="number"
                    value={farmer.soil_organic_carbon.available_p_kg_per_ha}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.available_p_kg_per_ha`, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Available K (kg/ha)</label>
                  <input
                    type="number"
                    value={farmer.soil_organic_carbon.available_k_kg_per_ha}
                    onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.available_k_kg_per_ha`, e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={farmer.soil_organic_carbon.comment}
                  onChange={(e) => updateFormData(`farmers[${farmerIndex}].soil_organic_carbon.comment`, e.target.value)}
                  rows="3"
                  placeholder="Additional soil information..."
                />
              </div>
            </div>
          ))}

          <div className="form-actions">
            <button
              type="button"
              onClick={addFarmer}
              className="btn-secondary"
            >
              + Add Another Farmer
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Batch...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPage;
