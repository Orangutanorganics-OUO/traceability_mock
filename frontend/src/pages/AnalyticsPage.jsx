import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AnalyticsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const COLORS = ['#2d5016', '#4a7c2f', '#c8a65d', '#87ceeb', '#8b7355'];

function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [yieldData, setYieldData] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch multiple endpoints in parallel
      const [statsRes, yieldRes, batchesRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats`),
        axios.get(`${API_URL}/api/analytics/yield-comparison`),
        axios.get(`${API_URL}/api/batches?limit=100`)
      ]);

      setStats(statsRes.data);
      setYieldData(yieldRes.data.data || []);
      setBatches(batchesRes.data.batches || []);
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
  const productData = stats?.products || [];
  const dashboardStats = stats?.dashboard || {};

  // Yield comparison data (farmers)
  const farmerYieldData = yieldData.filter(f => f.estimated_rajma_ideal_yield_kg).map(farmer => ({
    name: farmer.farmer_name || 'Unknown',
    idealYield: parseInt(farmer.estimated_rajma_ideal_yield_kg) || 0,
    minYield: parseInt(farmer.estimated_rajma_min_yield_kg) || 0,
    maxYield: parseInt(farmer.estimated_rajma_max_yield_kg) || 0,
    landAcre: parseFloat(farmer.cultivated_land_acre) || 0,
    soilPH: parseFloat(farmer.ph) || 0,
    soilOC: parseFloat(farmer.topsoil_oc_pct) || 0,
    village: farmer.village_name || 'N/A'
  }));

  // Soil quality data
  const soilData = yieldData.filter(f => f.topsoil_oc_pct && f.ph).map(farmer => ({
    name: farmer.farmer_name || 'Unknown',
    organicCarbon: parseFloat(farmer.topsoil_oc_pct),
    pH: parseFloat(farmer.ph)
  }));

  // Land distribution
  const landData = yieldData.filter(f => f.cultivated_land_acre).map(farmer => ({
    name: farmer.farmer_name || 'Unknown',
    acres: parseFloat(farmer.cultivated_land_acre)
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
              <h3>Verified on Blockchain</h3>
              <p className="stat-value">{dashboardStats.blockchain_verified || 0}</p>
            </div>
          </div>
        </div>

        {/* Product Distribution */}
        {productData.length > 0 && (
          <div className="chart-section card slide-in-right">
            <h2 className="section-title">Product Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product, count }) => `${product.replace(/_/g, ' ')}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="product"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Farmer Yield Comparison */}
        {farmerYieldData.length > 0 && (
          <div className="chart-section card fade-in">
            <h2 className="section-title">Farmer Yield Comparison</h2>
            <p className="chart-description">
              Comparing ideal vs actual yield ranges across farmers
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={farmerYieldData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Yield (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="minYield" name="Min Yield" fill={COLORS[0]} />
                <Bar dataKey="idealYield" name="Ideal Yield" fill={COLORS[1]} />
                <Bar dataKey="maxYield" name="Max Yield" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Land Distribution */}
        {landData.length > 0 && (
          <div className="chart-section card slide-in-left">
            <h2 className="section-title">Cultivated Land by Farmer</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={landData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Acres', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="acres" name="Cultivated Land (Acres)" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Soil Quality Comparison */}
        {soilData.length > 0 && (
          <div className="chart-section card slide-in-right">
            <h2 className="section-title">Soil Quality Indicators</h2>
            <p className="chart-description">
              Organic carbon content and pH levels across farms
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={soilData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" label={{ value: 'Organic Carbon (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'pH', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="organicCarbon" name="Organic Carbon (%)" stroke={COLORS[0]} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="pH" name="pH" stroke={COLORS[4]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Farmer Table */}
        {farmerYieldData.length > 0 && (
          <div className="table-section card fade-in">
            <h2 className="section-title">Detailed Farmer Data</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Village</th>
                    <th>Land (Acres)</th>
                    <th>Ideal Yield (kg)</th>
                    <th>Min-Max Yield (kg)</th>
                    <th>Soil pH</th>
                    <th>Organic Carbon (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {farmerYieldData.map((farmer, index) => (
                    <tr key={index}>
                      <td className="farmer-name">{farmer.name}</td>
                      <td>{farmer.village}</td>
                      <td>{farmer.landAcre.toFixed(2)}</td>
                      <td>{farmer.idealYield}</td>
                      <td>{farmer.minYield} - {farmer.maxYield}</td>
                      <td>{farmer.soilPH.toFixed(1)}</td>
                      <td>{farmer.soilOC.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Section */}
        <div className="insights-section card fade-in">
          <h2 className="section-title">Key Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>🌱 Average Yield</h3>
              <p>
                {farmerYieldData.length > 0
                  ? `${(farmerYieldData.reduce((sum, f) => sum + f.idealYield, 0) / farmerYieldData.length).toFixed(0)} kg per farmer`
                  : 'No data available'}
              </p>
            </div>
            <div className="insight-card">
              <h3>🏞️ Total Land</h3>
              <p>
                {farmerYieldData.length > 0
                  ? `${farmerYieldData.reduce((sum, f) => sum + f.landAcre, 0).toFixed(2)} acres cultivated`
                  : 'No data available'}
              </p>
            </div>
            <div className="insight-card">
              <h3>🌾 Soil Quality</h3>
              <p>
                {soilData.length > 0
                  ? `Average OC: ${(soilData.reduce((sum, s) => sum + s.organicCarbon, 0) / soilData.length).toFixed(2)}%`
                  : 'No data available'}
              </p>
            </div>
            <div className="insight-card">
              <h3>⚖️ pH Balance</h3>
              <p>
                {soilData.length > 0
                  ? `Average pH: ${(soilData.reduce((sum, s) => sum + s.pH, 0) / soilData.length).toFixed(1)}`
                  : 'No data available'}
              </p>
            </div>
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
