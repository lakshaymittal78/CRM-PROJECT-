// pages/CampaignsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CampaignsPage.css';

const CampaignsPage = () => {
  const { getAuthHeaders } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/campaigns`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      } else {
        console.error('Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      if (filter === 'all') return true;
      if (filter === 'active') return campaign.status === 'ACTIVE';
      if (filter === 'completed') return campaign.status === 'COMPLETED';
      if (filter === 'failed') return campaign.failedCount > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'audience') {
        return (b.audienceSize || 0) - (a.audienceSize || 0);
      }
      if (sortBy === 'performance') {
        const aRate = (a.sentCount || 0) / (a.audienceSize || 1);
        const bRate = (b.sentCount || 0) / (b.audienceSize || 1);
        return bRate - aRate;
      }
      return 0;
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryRate = (campaign) => {
    const total = campaign.audienceSize || 0;
    const sent = campaign.sentCount || 0;
    return total > 0 ? ((sent / total) * 100).toFixed(1) : '0';
  };

  const getStatusBadge = (campaign) => {
    if (campaign.status === 'COMPLETED') {
      return 'status-completed';
    }
    if (campaign.status === 'ACTIVE') {
      return 'status-active';
    }
    if (campaign.failedCount > 0) {
      return 'status-warning';
    }
    return 'status-pending';
  };

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
      <div className="campaigns-header">
        <div className="header-left">
          <h1>Campaign History</h1>
          <p>Manage and track your marketing campaigns</p>
        </div>
        <div className="header-right">
          <Link to="/campaigns/create" className="create-campaign-btn">
            ➕ Create Campaign
          </Link>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="campaigns-controls">
        <div className="filters">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">With Failures</option>
          </select>
        </div>
        
        <div className="sort">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="audience">Audience Size</option>
            <option value="performance">Performance</option>
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredAndSortedCampaigns.length > 0 ? (
        <div className="campaigns-list">
          {filteredAndSortedCampaigns.map((campaign) => (
            <div key={campaign._id} className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-title">
                  <h3>{campaign.name || `Campaign ${campaign._id.slice(-6)}`}</h3>
                  <span className={`status-badge ${getStatusBadge(campaign)}`}>
                    {campaign.status || 'PENDING'}
                  </span>
                </div>
                <div className="campaign-date">
                  {formatDate(campaign.createdAt)}
                </div>
              </div>

              <div className="campaign-details">
                <div className="detail-item">
                  <span className="detail-label">Audience Size:</span>
                  <span className="detail-value">{(campaign.audienceSize || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Messages Sent:</span>
                  <span className="detail-value">{(campaign.sentCount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Failed:</span>
                  <span className="detail-value error">{(campaign.failedCount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Delivery Rate:</span>
                  <span className="detail-value success">{getDeliveryRate(campaign)}%</span>
                </div>
              </div>

              {campaign.message && (
                <div className="campaign-message">
                  <strong>Message Preview:</strong>
                  <p>"{campaign.message.length > 100 ? campaign.message.substring(0, 100) + '...' : campaign.message}"</p>
                </div>
              )}

              <div className="campaign-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${getDeliveryRate(campaign)}%`,
                      backgroundColor: getDeliveryRate(campaign) > 90 ? '#10b981' : getDeliveryRate(campaign) > 70 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
                <span className="progress-text">{getDeliveryRate(campaign)}% delivered</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-campaigns">
          <div className="empty-icon">📧</div>
          <h2>No campaigns found</h2>
          <p>
            {filter === 'all' 
              ? "You haven't created any campaigns yet." 
              : `No campaigns match the selected filter: ${filter}`
            }
          </p>
          <Link to="/campaigns/create" className="cta-button">
            Create Your First Campaign
          </Link>
        </div>
      )}

      {/* Campaign Summary */}
      {campaigns.length > 0 && (
        <div className="campaigns-summary">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-value">{campaigns.length}</span>
              <span className="summary-label">Total Campaigns</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {campaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0).toLocaleString()}
              </span>
              <span className="summary-label">Total Audience Reached</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0).toLocaleString()}
              </span>
              <span className="summary-label">Messages Sent</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {(
                  (campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0) / 
                   Math.max(campaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0), 1)) * 100
                ).toFixed(1)}%
              </span>
              <span className="summary-label">Overall Delivery Rate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;