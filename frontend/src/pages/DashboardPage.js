// pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalCampaigns: 0,
    campaignStats: { sent: 0, failed: 0, pending: 0 }
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };

    try {
      // --- STATS ---
      const statsUrl = `${API_BASE}/api/dashboard/stats`;
      console.log('[Dashboard] GET', statsUrl);
      const statsRes = await fetch(statsUrl, { headers });

      if (!statsRes.ok) {
        const txt = await statsRes.text().catch(() => '<no body>');
        console.error('[Dashboard] stats fetch failed', statsRes.status, txt);
        // show friendly message for 401/403
        if (statsRes.status === 401 || statsRes.status === 403) {
          setError('Not authorized. Please login again.');
        } else {
          setError('Failed to load dashboard stats.');
        }
      } else {
        const json = await statsRes.json().catch(err => {
          console.error('[Dashboard] stats json parse error', err);
          return null;
        });
        console.log('[Dashboard] stats response:', json);

        if (json) {
          // Normalize various possible keys/shapes
          const normalized = {
            totalCustomers: json.totalCustomers ?? json.total_customers ?? json.total_customers_count ?? json.total_customers_count ?? 0,
            totalOrders: json.totalOrders ?? json.total_orders ?? json.totalOrdersCount ?? 0,
            totalCampaigns: json.totalCampaigns ?? json.total_campaigns ?? json.campaignsCount ?? json.totalCampaigns ?? 0,
            campaignStats: {
              sent: json.campaignStats?.sent ?? json.campaignStats?.sentCount ?? json.sent ?? 0,
              failed: json.campaignStats?.failed ?? json.campaignStats?.failedCount ?? json.failed ?? 0,
              pending: json.campaignStats?.pending ?? json.campaignStats?.pendingCount ?? json.pending ?? 0
            }
          };
          setStats(prev => ({ ...prev, ...normalized }));
        }
      }

      // --- RECENT CAMPAIGNS ---
      const campaignsUrl = `${API_BASE}/api/campaigns?limit=5`;
      console.log('[Dashboard] GET', campaignsUrl);
      const campaignsRes = await fetch(campaignsUrl, { headers });

      if (!campaignsRes.ok) {
        const txt = await campaignsRes.text().catch(() => '<no body>');
        console.error('[Dashboard] campaigns fetch failed', campaignsRes.status, txt);
        // don't overwrite existing data, but set an error if necessary
        if (!error) setError('Failed to load recent campaigns.');
      } else {
        const cjson = await campaignsRes.json().catch(err => {
          console.error('[Dashboard] campaigns json parse error', err);
          return null;
        });
        // server may return array directly or { campaigns: [...] } or { data: [...] }
        const arr = Array.isArray(cjson) ? cjson : (cjson?.campaigns ?? cjson?.data ?? []);
        console.log('[Dashboard] recent campaigns:', arr);
        setRecentCampaigns(Array.isArray(arr) ? arr : []);
      }
    } catch (err) {
      console.error('[Dashboard] Unexpected fetch error:', err);
      setError('Unexpected error while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const safeNumber = (n) => {
    const num = Number(n || 0);
    return Number.isFinite(num) ? num : 0;
  };

  // Delivery rate safe calculation
  const sent = safeNumber(stats.campaignStats?.sent);
  const failed = safeNumber(stats.campaignStats?.failed);
  const deliveryRate = (sent + failed) > 0 ? ((sent / (sent + failed)) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'friend'}!</h1>
        <p>Here's an overview of your CRM performance</p>
      </div>

      {error && (
        <div className="dashboard-error">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{safeNumber(stats.totalCustomers).toLocaleString()}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>{safeNumber(stats.totalOrders).toLocaleString()}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>{safeNumber(stats.totalCampaigns).toLocaleString()}</h3>
            <p>Total Campaigns</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{deliveryRate}%</h3>
            <p>Delivery Rate</p>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Campaign Performance</h2>
        </div>
        <div className="campaign-performance">
          <div className="performance-item">
            <span className="performance-label">Sent</span>
            <span className="performance-value success">{sent}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Failed</span>
            <span className="performance-value error">{failed}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Pending</span>
            <span className="performance-value pending">{safeNumber(stats.campaignStats?.pending)}</span>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Campaigns</h2>
          <Link to="/campaigns" className="view-all-btn">View All</Link>
        </div>

        {recentCampaigns.length > 0 ? (
          <div className="recent-campaigns">
            {recentCampaigns.map((campaign) => (
              <div key={campaign._id || campaign.id || Math.random()} className="campaign-item">
                <div className="campaign-info">
                  <h4>{campaign.name || `Campaign ${String(campaign._id || campaign.id).slice(-6)}`}</h4>
                  <p>Audience: {campaign.audienceSize ?? campaign.reach ?? '-'} customers</p>
                  <span className="campaign-date">{formatDate(campaign.createdAt ?? campaign.created_at ?? campaign.created)}</span>
                </div>
                <div className="campaign-stats">
                  <div className="stat-item">
                    <span className="stat-number">{safeNumber(campaign.sentCount)}</span>
                    <span className="stat-label">Sent</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{safeNumber(campaign.failedCount)}</span>
                    <span className="stat-label">Failed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📧</div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start engaging with customers</p>
            <Link to="/campaigns/create" className="cta-button">Create Campaign</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/campaigns/create" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Create Campaign</h3>
            <p>Build a new targeted campaign with custom segments</p>
          </Link>
          <Link to="/campaigns" className="action-card">
            <div className="action-icon">📊</div>
            <h3>View Analytics</h3>
            <p>Analyze your campaign performance and insights</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
