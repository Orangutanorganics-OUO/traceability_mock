import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AnalyticsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const COLORS = ['#2d5016', '#4a7c2f', '#c8a65d', '#87ceeb', '#8b7355', '#ff8042', '#00C49F', '#FFBB28'];

function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch stats and all batches with full details
      const [statsRes, batchesRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats`),
        axios.get(`${API_URL}/api/batches?limit=1000`)
      ]);

      setStats(statsRes.data);
      const batchList = batchesRes.data.batches || [];
      setBatches(batchList);

      // Fetch full batch details for each batch to get farmer data
      const fullBatchPromises = batchList.slice(0, 50).map(batch =>
        axios.get(`${API_URL}/api/batches/${batch.batch_id}`)
          .catch(err => {
            console.error(`Failed to fetch batch ${batch.batch_id}:`, err);
            return null;
          })
      );

      const fullBatchesResponses = await Promise.all(fullBatchPromises);
      const fullBatches = fullBatchesResponses
        .filter(res => res && res.data && res.data.batch)
        .map(res => res.data.batch);

      // Extract all farmers from all batches
      const farmersData = [];
      fullBatches.forEach(batch => {
        if (batch.farmers && Array.isArray(batch.farmers)) {
          batch.farmers.forEach(farmer => {
            farmersData.push({
              ...farmer,
              batch_id: batch.batch_id,
              product: batch.product,
              village_name: batch.village?.name || 'Unknown',
              district: batch.village?.district || 'Unknown',
              state: batch.village?.state || 'Unknown',
              elevation_m: batch.village?.elevation_m || 0
            });
          });
        }
      });

      setAllFarmers(farmersData);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data.');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="error-message card">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchAnalyticsData} className="btn btn-primary mt-md">
              Retry
            </button>
            <button onClick={() => navigate('/')} className="btn btn-outline mt-sm ml-sm">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const productData = stats?.productDistribution || [];
  const dashboardStats = stats?.dashboard || {};

  // 1. Product Distribution Data
  const productChartData = productData.map(p => ({
    name: p.product.replace(/_/g, ' ').toUpperCase(),
    value: p.count,
    count: p.count
  }));

  // 2. Batch Timeline Data (batches created over time)
  const batchTimelineData = batches.reduce((acc, batch) => {
    if (batch.created_at) {
      const date = new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  // 3. Village Distribution Data
  const villageDistribution = batches.reduce((acc, batch) => {
    const village = batch.village_name || 'Unknown';
    acc[village] = (acc[village] || 0) + 1;
    return acc;
  }, {});
  const villageData = Object.entries(villageDistribution).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  // 4. Blockchain Verification Status
  const verificationData = [
    { name: 'Verified', value: dashboardStats.verified_batches || 0 },
    { name: 'Not Verified', value: (dashboardStats.total_batches || 0) - (dashboardStats.verified_batches || 0) }
  ];

  // 5. Farmer Yield Data (from nested farmer data)
  const farmerYieldData = allFarmers
    .filter(f => f.yield_profile?.estimated_rajma_ideal_yield_kg)
    .slice(0, 20)
    .map(farmer => ({
      name: farmer.farmer_name || 'Unknown',
      idealYield: parseFloat(farmer.yield_profile?.estimated_rajma_ideal_yield_kg) || 0,
      minYield: parseFloat(farmer.yield_profile?.estimated_rajma_avg_yield_range_kg?.min) || 0,
      maxYield: parseFloat(farmer.yield_profile?.estimated_rajma_avg_yield_range_kg?.max) || 0,
      yieldPerNali: parseFloat(farmer.yield_profile?.ideal_yield_kg_per_nali) || 0,
      landAcre: parseFloat(farmer.cultivated_land_acre) || 0,
      village: farmer.village_name
    }));

  // 6. Soil Quality Data
  const soilData = allFarmers
    .filter(f => f.soil_organic_carbon?.topsoil_oc_pct && f.soil_organic_carbon?.ph)
    .slice(0, 30)
    .map(farmer => ({
      name: farmer.farmer_name || 'Unknown',
      organicCarbon: parseFloat(farmer.soil_organic_carbon.topsoil_oc_pct) || 0,
      pH: parseFloat(farmer.soil_organic_carbon.ph) || 0,
      nitrogen: parseFloat(farmer.soil_organic_carbon.available_n_kg_per_ha) || 0,
      phosphorus: parseFloat(farmer.soil_organic_carbon.available_p_kg_per_ha) || 0,
      potassium: parseFloat(farmer.soil_organic_carbon.available_k_kg_per_ha) || 0,
      village: farmer.village_name
    }));

  // 7. Soil NPK Analysis
  const soilNPKData = allFarmers
    .filter(f =>
      f.soil_organic_carbon?.available_n_kg_per_ha ||
      f.soil_organic_carbon?.available_p_kg_per_ha ||
      f.soil_organic_carbon?.available_k_kg_per_ha
    )
    .slice(0, 20)
    .map(farmer => ({
      name: farmer.farmer_name?.substring(0, 15) || 'Unknown',
      nitrogen: parseFloat(farmer.soil_organic_carbon.available_n_kg_per_ha) || 0,
      phosphorus: parseFloat(farmer.soil_organic_carbon.available_p_kg_per_ha) || 0,
      potassium: parseFloat(farmer.soil_organic_carbon.available_k_kg_per_ha) || 0
    }));

  // 8. Land Distribution by Farmer
  const landData = allFarmers
    .filter(f => f.cultivated_land_acre)
    .slice(0, 20)
    .map(farmer => ({
      name: farmer.farmer_name || 'Unknown',
      acres: parseFloat(farmer.cultivated_land_acre) || 0,
      nali: parseFloat(farmer.cultivated_land_nali) || 0
    }));

  // 9. Crop Rotation Analysis
  const cropRotationData = allFarmers
    .filter(f => f.crop_rotation?.white_rajma_nali || f.crop_rotation?.amaranth_nali)
    .slice(0, 15)
    .map(farmer => ({
      name: farmer.farmer_name?.substring(0, 12) || 'Unknown',
      rajma: parseFloat(farmer.crop_rotation.white_rajma_nali) || 0,
      amaranth: parseFloat(farmer.crop_rotation.amaranth_nali) || 0
    }));

  return (
    <div className="analytics-page himalayan-pattern">
      <div className="container-wide">
        {/* Header */}
        <div className="page-header fade-in">
          <h1 className="page-title">Analytics Dashboard</h1>
          <button onClick={() => navigate('/')} className="btn btn-outline">
            ← Back to Home
          </button>
        </div>

        {/* Summary Cards */}
        <div className="stats-grid slide-in-left">
          <div className="stat-card card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>Total Batches</h3>
              <p className="stat-value">{dashboardStats.total_batches || 0}</p>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">👨‍🌾</div>
            <div className="stat-content">
              <h3>Total Farmers</h3>
              <p className="stat-value">{dashboardStats.total_farmers || 0}</p>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">🏘️</div>
            <div className="stat-content">
              <h3>Villages</h3>
              <p className="stat-value">{dashboardStats.total_villages || 0}</p>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Blockchain Verified</h3>
              <p className="stat-value">{dashboardStats.verified_batches || 0}</p>
            </div>
          </div>
        </div>

        {/* Row 1: Product Distribution & Batch Timeline */}
        <div className="charts-row">
          {productChartData.length > 0 && (
            <div className="chart-section card slide-in-left">
              <h2 className="section-title">Product Distribution</h2>
              <p className="chart-description">Distribution of products across all batches</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {batchTimelineData.length > 0 && (
            <div className="chart-section card slide-in-right">
              <h2 className="section-title">Batch Creation Timeline</h2>
              <p className="chart-description">Batches created over time</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={batchTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Number of Batches', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Batches Created" stroke={COLORS[1]} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Village Distribution & Verification Status */}
        <div className="charts-row">
          {villageData.length > 0 && (
            <div className="chart-section card fade-in">
              <h2 className="section-title">Top Villages (by Batch Count)</h2>
              <p className="chart-description">Villages with the most batches registered</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={villageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" name="Batch Count" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {verificationData.some(d => d.value > 0) && (
            <div className="chart-section card fade-in">
              <h2 className="section-title">Blockchain Verification Status</h2>
              <p className="chart-description">Verification status of all batches</p>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS[1]} />
                    <Cell fill="#ddd" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 3: Farmer Yield Analysis */}
        {farmerYieldData.length > 0 && (
          <div className="chart-section card fade-in">
            <h2 className="section-title">Farmer Yield Analysis</h2>
            <p className="chart-description">
              Comparing ideal yield vs average yield ranges across farmers (in kg)
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={farmerYieldData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                <YAxis label={{ value: 'Yield (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="minYield" name="Min Yield (kg)" fill={COLORS[0]} />
                <Bar dataKey="idealYield" name="Ideal Yield (kg)" fill={COLORS[1]} />
                <Bar dataKey="maxYield" name="Max Yield (kg)" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Row 4: Land Distribution & Crop Rotation */}
        <div className="charts-row">
          {landData.length > 0 && (
            <div className="chart-section card slide-in-left">
              <h2 className="section-title">Land Distribution by Farmer</h2>
              <p className="chart-description">Cultivated land across farmers (in acres)</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={landData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Acres', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acres" name="Cultivated Land (Acres)" fill={COLORS[3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {cropRotationData.length > 0 && (
            <div className="chart-section card slide-in-right">
              <h2 className="section-title">Crop Rotation Analysis</h2>
              <p className="chart-description">White Rajma vs Amaranth cultivation (in nali)</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={cropRotationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Land (Nali)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rajma" name="White Rajma (Nali)" fill={COLORS[0]} stackId="a" />
                  <Bar dataKey="amaranth" name="Amaranth (Nali)" fill={COLORS[2]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 5: Soil Quality pH & Organic Carbon */}
        {soilData.length > 0 && (
          <div className="chart-section card fade-in">
            <h2 className="section-title">Soil Quality: pH & Organic Carbon</h2>
            <p className="chart-description">
              Soil pH levels and organic carbon percentage across farms - Key indicators for soil health
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={soilData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                <YAxis yAxisId="left" label={{ value: 'Organic Carbon (%)', angle: -90, position: 'insideLeft' }} domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'pH Level', angle: 90, position: 'insideRight' }} domain={[0, 14]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="organicCarbon" name="Organic Carbon (%)" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="pH" name="pH Level" stroke={COLORS[4]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Row 6: Soil NPK Analysis */}
        {soilNPKData.length > 0 && (
          <div className="chart-section card fade-in">
            <h2 className="section-title">Soil Nutrient Analysis (NPK)</h2>
            <p className="chart-description">
              Nitrogen, Phosphorus, and Potassium levels (kg/ha) - Critical nutrients for crop growth
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={soilNPKData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Nutrient Level (kg/ha)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="nitrogen" name="Nitrogen (N)" fill={COLORS[5]} />
                <Bar dataKey="phosphorus" name="Phosphorus (P)" fill={COLORS[6]} />
                <Bar dataKey="potassium" name="Potassium (K)" fill={COLORS[7]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Farmer Table */}
        {allFarmers.length > 0 && (
          <div className="table-section card fade-in">
            <h2 className="section-title">Detailed Farmer Data</h2>
            <p className="chart-description">Comprehensive farmer information across all batches (showing first 30)</p>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Village</th>
                    <th>Land (Acres)</th>
                    <th>Ideal Yield (kg)</th>
                    <th>Yield Range (kg)</th>
                    <th>Soil pH</th>
                    <th>Organic Carbon (%)</th>
                    <th>Product</th>
                  </tr>
                </thead>
                <tbody>
                  {allFarmers.slice(0, 30).map((farmer, index) => (
                    <tr key={index}>
                      <td className="farmer-name">{farmer.farmer_name || 'N/A'}</td>
                      <td>{farmer.village_name || 'N/A'}</td>
                      <td>{farmer.cultivated_land_acre ? parseFloat(farmer.cultivated_land_acre).toFixed(2) : 'N/A'}</td>
                      <td>{farmer.yield_profile?.estimated_rajma_ideal_yield_kg || 'N/A'}</td>
                      <td>
                        {farmer.yield_profile?.estimated_rajma_avg_yield_range_kg?.min && farmer.yield_profile?.estimated_rajma_avg_yield_range_kg?.max
                          ? `${farmer.yield_profile.estimated_rajma_avg_yield_range_kg.min} - ${farmer.yield_profile.estimated_rajma_avg_yield_range_kg.max}`
                          : 'N/A'}
                      </td>
                      <td>{farmer.soil_organic_carbon?.ph ? parseFloat(farmer.soil_organic_carbon.ph).toFixed(1) : 'N/A'}</td>
                      <td>{farmer.soil_organic_carbon?.topsoil_oc_pct ? parseFloat(farmer.soil_organic_carbon.topsoil_oc_pct).toFixed(2) : 'N/A'}</td>
                      <td>{farmer.product?.replace(/_/g, ' ') || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Section */}
        <div className="insights-section card fade-in">
          <h2 className="section-title">Key Insights & Trends</h2>
          <p className="chart-description">Data-driven insights to identify patterns and opportunities</p>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>🌱 Average Ideal Yield</h3>
              <p>
                {farmerYieldData.length > 0
                  ? `${(farmerYieldData.reduce((sum, f) => sum + f.idealYield, 0) / farmerYieldData.length).toFixed(0)} kg per farmer`
                  : 'No data available'}
              </p>
              <small>Based on {farmerYieldData.length} farmers</small>
            </div>
            <div className="insight-card">
              <h3>🏞️ Total Cultivated Land</h3>
              <p>
                {allFarmers.length > 0 && allFarmers.some(f => f.cultivated_land_acre)
                  ? `${allFarmers.filter(f => f.cultivated_land_acre).reduce((sum, f) => sum + parseFloat(f.cultivated_land_acre), 0).toFixed(2)} acres`
                  : 'No data available'}
              </p>
              <small>Across {allFarmers.filter(f => f.cultivated_land_acre).length} farmers</small>
            </div>
            <div className="insight-card">
              <h3>🌾 Average Soil Organic Carbon</h3>
              <p>
                {soilData.length > 0
                  ? `${(soilData.reduce((sum, s) => sum + s.organicCarbon, 0) / soilData.length).toFixed(2)}%`
                  : 'No data available'}
              </p>
              <small>Higher OC improves soil fertility</small>
            </div>
            <div className="insight-card">
              <h3>⚖️ Average Soil pH</h3>
              <p>
                {soilData.length > 0
                  ? `${(soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length).toFixed(1)}`
                  : 'No data available'}
              </p>
              <small>{soilData.length > 0 && (soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length) >= 6.5 && (soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length) <= 7.5 ? 'Optimal range for crops' : 'May need adjustment'}</small>
            </div>
            <div className="insight-card">
              <h3>📍 Villages Covered</h3>
              <p>{dashboardStats.total_villages || 0}</p>
              <small>Across {dashboardStats.total_batches || 0} batches</small>
            </div>
            <div className="insight-card">
              <h3>✅ Blockchain Verification</h3>
              <p>
                {dashboardStats.total_batches > 0
                  ? `${((dashboardStats.verified_batches / dashboardStats.total_batches) * 100).toFixed(0)}%`
                  : '0%'}
              </p>
              <small>{dashboardStats.verified_batches || 0} of {dashboardStats.total_batches || 0} verified</small>
            </div>
            <div className="insight-card">
              <h3>🌾 Average Nitrogen (N)</h3>
              <p>
                {soilNPKData.length > 0 && soilNPKData.some(s => s.nitrogen > 0)
                  ? `${(soilNPKData.filter(s => s.nitrogen > 0).reduce((sum, s) => sum + s.nitrogen, 0) / soilNPKData.filter(s => s.nitrogen > 0).length).toFixed(1)} kg/ha`
                  : 'No data available'}
              </p>
              <small>Essential for plant growth</small>
            </div>
            <div className="insight-card">
              <h3>📊 Yield Efficiency</h3>
              <p>
                {farmerYieldData.length > 0 && farmerYieldData.some(f => f.landAcre > 0)
                  ? `${(farmerYieldData.filter(f => f.landAcre > 0).reduce((sum, f) => sum + (f.idealYield / f.landAcre), 0) / farmerYieldData.filter(f => f.landAcre > 0).length).toFixed(0)} kg/acre`
                  : 'No data available'}
              </p>
              <small>Average yield per acre</small>
            </div>
          </div>

          {/* Trend Insights */}
          <div className="trend-insights" style={{ marginTop: '2rem' }}>
            <h3>📈 Trend Analysis</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {batchTimelineData.length > 1 && (
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <strong>Batch Growth:</strong> {batchTimelineData[batchTimelineData.length - 1].count > batchTimelineData[0].count ? '📈 Increasing' : '📉 Decreasing'} batch registrations over time
                </li>
              )}
              {soilData.length > 0 && (
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <strong>Soil Health:</strong> Average pH of {(soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length).toFixed(1)}
                  {(soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length) >= 6.5 && (soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length) <= 7.5
                    ? ' is in optimal range for most crops ✅'
                    : ' may require soil amendments ⚠️'}
                </li>
              )}
              {villageData.length > 0 && (
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <strong>Geographic Concentration:</strong> Top village ({villageData[0].name}) accounts for {((villageData[0].count / dashboardStats.total_batches) * 100).toFixed(0)}% of all batches
                </li>
              )}
              {cropRotationData.length > 0 && (
                <li style={{ padding: '0.5rem 0' }}>
                  <strong>Crop Diversity:</strong> Farmers practicing crop rotation with both Rajma and Amaranth showing sustainable farming practices
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="footer-actions fade-in">
          <button onClick={() => navigate('/')} className="btn btn-primary btn-large">
            View All Batches
          </button>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary btn-large ml-sm">
            Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
