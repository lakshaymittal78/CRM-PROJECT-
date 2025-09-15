// pages/CreateCampaignPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RuleBuilder from '../components/RuleBuilder';
import MessageGenerator from '../components/MessageGenerator';
import AudiencePreview from '../components/AudiencePreview';
import './CreateCampaignPage.css';

const CreateCampaignPage = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [campaignName, setCampaignName] = useState('');
  const [rules, setRules] = useState([{
    id: Date.now(),
    field: 'totalSpends',
    operator: '>',
    value: '',
    logicalOperator: null
  }]);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [message, setMessage] = useState('');
  const [audienceSize, setAudienceSize] = useState(0);
  const [audiencePreview, setAudiencePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  useEffect(() => {
    if (rules.length > 0 && rules.some(rule => rule.value)) {
      debouncePreview();
    }
  }, [rules]);

  const debouncePreview = () => {
    const timeoutId = setTimeout(() => {
      fetchAudiencePreview();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  const fetchAudiencePreview = async () => {
    try {
      setPreviewLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/campaigns/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ rules }),
      });

      if (response.ok) {
        const data = await response.json();
        setAudienceSize(data.count);
        setAudiencePreview(data.preview || []);
      }
    } catch (error) {
      console.error('Error fetching audience preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleNaturalLanguageConvert = async () => {
    if (!naturalLanguageInput.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/ai/convert-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ prompt: naturalLanguageInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data.rules);
        setNaturalLanguageInput('');
      }
    } catch (error) {
      console.error('Error converting natural language:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAiMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/ai/generate-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          rules,
          campaignObjective: 'customer engagement' // You can make this dynamic
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.messages);
        setShowAiSuggestions(true);
      }
    } catch (error) {
      console.error('Error generating AI messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !message || rules.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: campaignName,
          rules,
          message,
          audienceSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate('/campaigns');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign-page">
      <div className="campaign-header">
        <h1>Create New Campaign</h1>
        <p>Define your audience and craft personalized messages</p>
      </div>

      <div className="campaign-form">
        {/* Campaign Name */}
        <div className="form-section">
          <h2>Campaign Details</h2>
          <div className="form-group">
            <label htmlFor="campaignName">Campaign Name *</label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Winter Sale Campaign"
              className="form-input"
            />
          </div>
        </div>

        {/* AI Natural Language Input */}
        <div className="form-section">
          <h2>AI-Powered Segment Builder</h2>
          <div className="ai-input-section">
            <div className="form-group">
              <label>Describe your audience in natural language</label>
              <div className="ai-input-container">
                <textarea
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="e.g., 'Customers who spent more than ₹10,000 and haven't visited in 3 months'"
                  className="ai-textarea"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleNaturalLanguageConvert}
                  disabled={!naturalLanguageInput.trim() || loading}
                  className="ai-convert-btn"
                >
                  {loading ? '🤖 Converting...' : '🤖 Convert to Rules'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rule Builder */}
        <div className="form-section">
          <h2>Audience Rules</h2>
          <RuleBuilder rules={rules} setRules={setRules} />
        </div>

        {/* Audience Preview */}
        <div className="form-section">
          <h2>Audience Preview</h2>
          <AudiencePreview 
            audienceSize={audienceSize}
            audiencePreview={audiencePreview}
            loading={previewLoading}
          />
        </div>

        {/* Message Section */}
        <div className="form-section">
          <h2>Campaign Message</h2>
          <div className="message-section">
            <div className="form-group">
              <label>Message Template *</label>
              <div className="message-input-container">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi {{name}}, here's a special offer just for you!"
                  className="message-textarea"
                  rows={4}
                />
                <button
                  type="button"
                  onClick={generateAiMessages}
                  disabled={loading || rules.length === 0}
                  className="ai-generate-btn"
                >
                  {loading ? '🤖 Generating...' : '🤖 AI Suggest Messages'}
                </button>
              </div>
              <div className="message-help">
                <p>Use placeholders: {'{{name}}'}, {'{{totalSpends}}'}, {'{{lastVisit}}'}</p>

              </div>
            </div>

            {/* AI Message Suggestions */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <MessageGenerator
                suggestions={aiSuggestions}
                onSelectMessage={setMessage}
                onClose={() => setShowAiSuggestions(false)}
              />
            )}
          </div>
        </div>

        {/* Preview Message */}
        {message && audiencePreview.length > 0 && (
          <div className="form-section">
            <h2>Message Preview</h2>
            <div className="message-preview">
              <div className="preview-card">
                <h4>Sample message for {audiencePreview[0]?.name || 'Customer'}:</h4>
                <div className="preview-message">
                  {message
                    .replace(/\{\{name\}\}/g, audiencePreview[0]?.name || 'Customer')
                    .replace(/\{\{totalSpends\}\}/g, `₹${audiencePreview[0]?.totalSpends || 0}`)
                    .replace(/\{\{lastVisit\}\}/g, audiencePreview[0]?.lastVisit ? new Date(audiencePreview[0].lastVisit).toLocaleDateString() : 'recently')
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Summary */}
        <div className="form-section">
          <h2>Campaign Summary</h2>
          <div className="campaign-summary">
            <div className="summary-item">
              <span className="summary-label">Campaign Name:</span>
              <span className="summary-value">{campaignName || 'Untitled Campaign'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Target Audience:</span>
              <span className="summary-value">{audienceSize.toLocaleString()} customers</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Estimated Cost:</span>
              <span className="summary-value">₹{(audienceSize * 0.10).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={loading || !campaignName || !message || audienceSize === 0}
            className="create-btn"
          >
            {loading ? 'Creating Campaign...' : `Launch Campaign (${audienceSize} recipients)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;