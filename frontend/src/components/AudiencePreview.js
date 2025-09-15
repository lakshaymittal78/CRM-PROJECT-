// components/AudiencePreview.js
import React from 'react';
import './AudiencePreview.css';

const AudiencePreview = ({ audienceSize, audiencePreview, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="audience-preview loading">
        <div className="preview-header">
          <div className="spinner"></div>
          <p>Calculating audience size...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audience-preview">
      <div className="preview-header">
        <div className="audience-size">
          <h3>{audienceSize.toLocaleString()}</h3>
          <p>customers match your criteria</p>
        </div>
        
        <div className="audience-stats">
          <div className="stat-item">
            <span className="stat-value">
              {audienceSize > 0 ? `₹${(audienceSize * 0.10).toFixed(2)}` : '₹0.00'}
            </span>
            <span className="stat-label">Estimated Cost</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {audienceSize > 1000 ? `${(audienceSize / 1000).toFixed(1)}K` : audienceSize}
            </span>
            <span className="stat-label">Reach</span>
          </div>
        </div>
      </div>

      {audienceSize === 0 ? (
        <div className="empty-audience">
          <div className="empty-icon">🔍</div>
          <h4>No customers match your criteria</h4>
          <p>Try adjusting your rules to target a broader audience</p>
        </div>
      ) : (
        <div className="preview-content">
          <div className="preview-info">
            <h4>Sample Customers ({Math.min(audiencePreview.length, 5)} of {audienceSize})</h4>
            <p>Here's a preview of customers who match your segment rules:</p>
          </div>

          <div className="customer-list">
            {audiencePreview.slice(0, 5).map((customer, index) => (
              <div key={customer._id || index} className="customer-card">
                <div className="customer-info">
                  <div className="customer-name">
                    <span className="name">{customer.name || 'Anonymous Customer'}</span>
                    <span className="email">{customer.email}</span>
                  </div>
                  
                  <div className="customer-stats">
                    <div className="stat">
                      <span className="stat-label">Total Spent</span>
                      <span className="stat-value spending">
                        {formatCurrency(customer.totalSpends || 0)}
                      </span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-label">Visits</span>
                      <span className="stat-value visits">
                        {customer.visits || 0}
                      </span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-label">Last Visit</span>
                      <span className="stat-value last-visit">
                        {formatDate(customer.lastVisit)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="customer-tags">
                  {customer.totalSpends > 10000 && (
                    <span className="tag high-value">High Value</span>
                  )}
                  {customer.visits > 10 && (
                    <span className="tag frequent">Frequent</span>
                  )}
                  {customer.lastVisit && new Date() - new Date(customer.lastVisit) > 30 * 24 * 60 * 60 * 1000 && (
                    <span className="tag inactive">Inactive</span>
                  )}
                  {customer.createdAt && new Date() - new Date(customer.createdAt) < 30 * 24 * 60 * 60 * 1000 && (
                    <span className="tag new">New Customer</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {audienceSize > 5 && (
            <div className="preview-footer">
              <p>
                And {(audienceSize - Math.min(audiencePreview.length, 5)).toLocaleString()} more customers...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audience Insights */}
      {audienceSize > 0 && audiencePreview.length > 0 && (
        <div className="audience-insights">
          <h4>Quick Insights</h4>
          <div className="insights-grid">
            <div className="insight-item">
              <span className="insight-label">Avg. Spending</span>
              <span className="insight-value">
                {formatCurrency(
                  audiencePreview.reduce((sum, c) => sum + (c.totalSpends || 0), 0) / audiencePreview.length
                )}
              </span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Avg. Visits</span>
              <span className="insight-value">
                {Math.round(audiencePreview.reduce((sum, c) => sum + (c.visits || 0), 0) / audiencePreview.length)}
              </span>
            </div>
            <div className="insight-item">
              <span className="insight-label">High Value %</span>
              <span className="insight-value">
                {Math.round((audiencePreview.filter(c => c.totalSpends > 10000).length / audiencePreview.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiencePreview;