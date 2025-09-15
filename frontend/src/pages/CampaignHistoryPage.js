// pages/CampaignHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CampaignHistoryPage.css';

const CampaignHistoryPage = () => {
  const { getAuthHeaders } = useAuth();
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchCampaigns();
    
    // Show success message if redirected from campaign creation
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/campaigns`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'ACTIVE': return 'status-active';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-error';
      default: return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'ACTIVE': return '🔄';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      default: return '⏸️';
    }
  };

  const calculateDeliveryRate = (campaign) => {
    const total = (campaign.sentCount || 0) + (campaign.failedCount || 0);
    if (total === 0) return 0;
    return ((campaign.sentCount || 0) / total * 100).toFixed(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate overall stats
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0);
  const totalAudience = campaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0);
  const overallDeliveryRate = totalSent + totalFailed > 0 ? 
    (totalSent / (totalSent + totalFailed) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="campaigns-loading">
        <div className="spinner"></div>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="campaigns-page">
      {/* Header */}
      <div className="campaigns-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Campaign History</h1>
            <p>Track your campaign performance and delivery statistics</p>
          </div>
          <Link to="/campaigns/create" className="create-campaign-btn">
            + Create Campaign
          </Link>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span>✅ {successMessage}</span>
          </div>
        )}

        {/* Stats Overview */}
        <div className="campaigns-stats">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3>{totalSent.toLocaleString()}</h3>
              <p>Messages Sent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{totalAudience.toLocaleString()}</h3>
              <p>Total Reach</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{overallDeliveryRate}%</h3>
              <p>Delivery Rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <h3>{campaigns.length}</h3>
              <p>Total Campaigns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="campaigns-controls">
        <div className="filter-tabs">
          <button 
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            All ({campaigns.length})
          </button>
          <button 
            onClick={() => setFilter('COMPLETED')}
            className={filter === 'COMPLETED' ? 'active' : ''}
          >
            Completed ({campaigns.filter(c => c.status === 'COMPLETED').length})
          </button>
          <button 
            onClick={() => setFilter('ACTIVE')}
            className={filter === 'ACTIVE' ? 'active' : ''}
          >
            Active ({campaigns.filter(c => c.status === 'ACTIVE').length})
          </button>
          <button 
            onClick={() => setFilter('PENDING')}
            className={filter === 'PENDING' ? 'active' : ''}
          >
            Pending ({campaigns.filter(c => c.status === 'PENDING').length})
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Campaigns List */}
      <div className="campaigns-list">
        {filteredCampaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No campaigns found</h3>
            <p>
              {campaigns.length === 0 
                ? "Create your first campaign to start engaging with customers"
                : "Try adjusting your filters or search terms"
              }
            </p>
            {campaigns.length === 0 && (
              <Link to="/campaigns/create" className="cta-button">
                Create Your First Campaign
              </Link>
            )}
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div key={campaign._id} className="campaign-card">
              {/* Campaign Header */}
              <div className="campaign-header">
                <div className="campaign-title-section">
                  <h3 className="campaign-name">
                    {campaign.name || `Campaign ${campaign._id.slice(-6)}`}
                  </h3>
                  <div className="campaign-meta">
                    <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)} {campaign.status}
                    </span>
                    {campaign.objective && (
                      <span className="objective-badge">
                        {campaign.objective}
                      </span>
                    )}
                    {campaign.aiGenerated && (
                      <span className="ai-badge">
                        🤖 AI Generated
                      </span>
                    )}
                  </div>
                </div>
                <div className="campaign-date">
                  {formatDate(campaign.createdAt)}
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="campaign-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Audience</span>
                  <span className="stat-value">{(campaign.audienceSize || 0).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sent</span>
                  <span className="stat-value success">{(campaign.sentCount || 0).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Failed</span>
                  <span className="stat-value error">{(campaign.failedCount || 0).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Delivery Rate</span>
                  <span className={`stat-value ${parseFloat(calculateDeliveryRate(campaign)) >= 80 ? 'success' : parseFloat(calculateDeliveryRate(campaign)) >= 60 ? 'warning' : 'error'}`}>
                    {calculateDeliveryRate(campaign)}%
                  </span>
                </div>
              </div>

              {/* Campaign Message Preview */}
              <div className="campaign-message">
                <div className="message-label">Message:</div>
                <div className="message-content">
                  {campaign.message?.replace('{name}', 'Customer Name') || 'No message available'}
                </div>
              </div>

              {/* AI Insights (if available) */}
              {campaign.aiGenerated && (
                <div className="ai-insights">
                  <div className="insights-header">
                    <span className="insights-icon">🧠</span>
                    <span className="insights-label">AI Insights</span>
                  </div>
                  <div className="insights-content">
                    <div className="insight-item">
                      • Campaign generated with {campaign.variant || 'optimized'} messaging strategy
                    </div>
                    <div className="insight-item">
                      • Personalized content for {campaign.objective || 'engagement'} objective
                    </div>
                    <div className="insight-item">
                      • Automated audience targeting based on behavioral patterns
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Actions */}
              <div className="campaign-actions">
                <button className="action-btn view-btn">
                  👁️ View Details
                </button>
                <button className="action-btn analytics-btn">
                  📊 Analytics
                </button>
                {campaign.status === 'PENDING' && (
                  <button className="action-btn cancel-btn">
                    ❌ Cancel
                  </button>
                )}
              </div>

              {/* Progress Bar (for active campaigns) */}
              {campaign.status === 'ACTIVE' && (
                <div className="progress-section">
                  <div className="progress-label">
                    Delivery Progress: {campaign.sentCount + campaign.failedCount} / {campaign.audienceSize}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${((campaign.sentCount + campaign.failedCount) / campaign.audienceSize) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignHistoryPage;