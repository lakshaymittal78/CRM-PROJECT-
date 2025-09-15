// pages/CampaignBuilderPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CampaignBuilderPage.css';

const CampaignBuilderPage = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [rules, setRules] = useState([]);
  const [message, setMessage] = useState('');
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Integration states
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [selectedAiMessage, setSelectedAiMessage] = useState(null);
  const [campaignObjective, setCampaignObjective] = useState('engagement');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Add new rule
  const addRule = () => {
    const newRule = {
      id: Date.now(),
      field: 'totalSpends',
      operator: '>',
      value: '',
      logicalOperator: rules.length > 0 ? 'AND' : null,
    };
    setRules([...rules, newRule]);
  };

  // Remove rule
  const removeRule = (id) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    if (updatedRules.length > 0) {
      updatedRules[0].logicalOperator = null;
    }
    setRules(updatedRules);
  };

  // Update rule
  const updateRule = (id, field, value) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  // AI: Convert natural language to rules
  const convertNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/ai/convert-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ prompt: naturalLanguageInput })
      });
      
      const data = await response.json();
      
      if (data.success && data.rules) {
        setRules(data.rules);
        setNaturalLanguageInput('');
        previewAudience(data.rules);
      } else {
        setError('Failed to convert natural language to rules');
      }
    } catch (error) {
      console.error('AI conversion failed:', error);
      setError('AI service temporarily unavailable. Please use manual rule builder.');
    } finally {
      setIsLoading(false);
    }
  };

  // AI: Generate message suggestions
  const generateAIMessages = async () => {
    if (rules.length === 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ rules, campaignObjective })
      });
      
      const data = await response.json();
      
      if (data.success && data.messages) {
        setAiMessages(data.messages);
        setStep(3);
      } else {
        setError('Failed to generate AI messages');
      }
    } catch (error) {
      console.error('AI message generation failed:', error);
      setError('AI service temporarily unavailable. Please write a custom message.');
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Preview audience
  const previewAudience = async (rulesToPreview = rules) => {
    if (rulesToPreview.length === 0) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ rules: rulesToPreview })
      });
      
      const data = await response.json();
      setAudiencePreview({
        count: data.count,
        preview: data.preview
      });
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  // Create campaign
  const createCampaign = async () => {
    if (!campaignName || (!selectedAiMessage && !message) || rules.length === 0) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const campaignData = {
        name: campaignName,
        rules,
        message: selectedAiMessage ? selectedAiMessage.message : message,
        audienceSize: audiencePreview?.count || 0,
        objective: campaignObjective,
        aiGenerated: !!selectedAiMessage,
        variant: selectedAiMessage?.variant
      };

      const response = await fetch(`${API_BASE}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(campaignData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to campaigns page
        navigate('/campaigns', { 
          state: { 
            message: 'Campaign created successfully and is being delivered!',
            campaignId: data.campaign.id 
          }
        });
      } else {
        setError(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Campaign creation failed:', error);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className="step-indicator-container">
          <div className={`step-circle ${step >= stepNum ? 'active' : ''}`}>
            {stepNum}
          </div>
          {stepNum < 4 && <div className={`step-line ${step > stepNum ? 'active' : ''}`} />}
        </div>
      ))}
    </div>
  );

  const renderRuleDescription = (rule) => {
    const { field, operator, value } = rule;
    
    let description = '';
    switch (field) {
      case 'totalSpends':
        description = `Total spending ${operator === '>' ? 'more than' : operator === '<' ? 'less than' : 'equals'} ₹${value}`;
        break;
      case 'visits':
        description = `${operator === '>' ? 'More than' : operator === '<' ? 'Fewer than' : 'Exactly'} ${value} visits`;
        break;
      case 'lastVisit':
        description = `${operator === '>' ? 'Inactive for more than' : 'Active within'} ${value} days`;
        break;
      case 'createdAt':
        description = `${operator === '<' ? 'Joined within' : 'Joined more than'} ${value} days ago`;
        break;
      default:
        description = `${field} ${operator} ${value}`;
    }
    
    return description;
  };

  return (
    <div className="campaign-builder">
      <div className="campaign-builder-header">
        <h1>Create New Campaign</h1>
        <p>Build targeted campaigns with AI assistance</p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="campaign-builder-content">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="step-content">
            <h2>Campaign Information</h2>
            
            <div className="form-group">
              <label>Campaign Name *</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Holiday VIP Campaign"
              />
            </div>

            <div className="form-group">
              <label>Campaign Objective</label>
              <select
                value={campaignObjective}
                onChange={(e) => setCampaignObjective(e.target.value)}
              >
                <option value="engagement">Engagement</option>
                <option value="winback">Win-back</option>
                <option value="retention">Retention</option>
                <option value="conversion">Conversion</option>
              </select>
            </div>

            <div className="step-actions">
              <button
                onClick={() => setStep(2)}
                disabled={!campaignName}
                className="primary-btn"
              >
                Continue to Audience
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Define Audience */}
        {step === 2 && (
          <div className="step-content">
            <h2>Define Target Audience</h2>
            
            {/* AI Natural Language Input */}
            <div className="ai-section">
              <h3>🤖 AI-Powered Audience Builder</h3>
              <p>Describe your target audience in plain English</p>
              
              <div className="ai-input-group">
                <input
                  type="text"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="e.g., customers who spent more than 10000 rupees but haven't visited in 30 days"
                />
                <button
                  onClick={convertNaturalLanguage}
                  disabled={!naturalLanguageInput.trim() || isLoading}
                  className="ai-btn"
                >
                  {isLoading ? 'Converting...' : 'Convert with AI'}
                </button>
              </div>

              <div className="ai-examples">
                <span>Examples:</span>
                <button onClick={() => setNaturalLanguageInput("high value customers who spent more than 15000 rupees")}>
                  High value customers
                </button>
                <button onClick={() => setNaturalLanguageInput("customers inactive for 30 days")}>
                  Inactive customers
                </button>
                <button onClick={() => setNaturalLanguageInput("new customers who joined in last 7 days")}>
                  New customers
                </button>
              </div>
            </div>

            {/* Manual Rule Builder */}
            <div className="rules-section">
              <div className="rules-header">
                <h3>Audience Rules</h3>
                <button onClick={addRule} className="add-rule-btn">
                  + Add Rule
                </button>
              </div>

              {rules.map((rule, index) => (
                <div key={rule.id} className="rule-row">
                  {index > 0 && (
                    <select
                      value={rule.logicalOperator}
                      onChange={(e) => updateRule(rule.id, 'logicalOperator', e.target.value)}
                      className="logical-operator"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                  >
                    <option value="totalSpends">Total Spending</option>
                    <option value="visits">Visit Count</option>
                    <option value="lastVisit">Last Visit</option>
                    <option value="createdAt">Customer Age</option>
                    <option value="email">Email</option>
                    <option value="name">Name</option>
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                  >
                    <option value=">">Greater than</option>
                    <option value="<">Less than</option>
                    <option value=">=">Greater or equal</option>
                    <option value="<=">Less or equal</option>
                    <option value="=">Equal to</option>
                    <option value="!=">Not equal</option>
                    {(rule.field === 'email' || rule.field === 'name') && (
                      <>
                        <option value="contains">Contains</option>
                        <option value="startsWith">Starts with</option>
                        <option value="endsWith">Ends with</option>
                      </>
                    )}
                  </select>

                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                    placeholder="Value"
                  />

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="remove-rule-btn"
                  >
                    ×
                  </button>
                </div>
              ))}

              {rules.length === 0 && (
                <div className="empty-rules">
                  <p>No audience rules defined. Add rules manually or use AI conversion above.</p>
                </div>
              )}
            </div>

            {/* Audience Preview */}
            {audiencePreview && (
              <div className="audience-preview">
                <h3>👁️ Audience Preview</h3>
                <div className="preview-stats">
                  <span className="audience-count">{audiencePreview.count.toLocaleString()} customers</span>
                  {audiencePreview.preview.length > 0 && (
                    <div className="preview-names">
                      Sample: {audiencePreview.preview.map(c => c.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="step-actions">
              <button onClick={() => setStep(1)} className="secondary-btn">
                Back
              </button>
              <button
                onClick={() => previewAudience()}
                disabled={rules.length === 0 || isLoading}
                className="secondary-btn"
              >
                Preview Audience
              </button>
              <button
                onClick={generateAIMessages}
                disabled={rules.length === 0 || isLoading}
                className="primary-btn ai-btn"
              >
                {isLoading ? 'Generating...' : '🤖 Generate AI Messages'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Message Creation */}
        {step === 3 && (
          <div className="step-content">
            <h2>Campaign Message</h2>
            
            {aiMessages.length > 0 && (
              <div className="ai-messages-section">
                <h3>🤖 AI-Generated Messages</h3>
                <div className="ai-messages-grid">
                  {aiMessages.map((msg, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedAiMessage(msg)}
                      className={`ai-message-card ${selectedAiMessage?.message === msg.message ? 'selected' : ''}`}
                    >
                      <div className="message-header">
                        <span className="message-variant">{msg.variant}</span>
                        {selectedAiMessage?.message === msg.message && <span className="selected-indicator">✓</span>}
                      </div>
                      <div className="message-content">{msg.message}</div>
                      <div className="message-focus">Focus: {msg.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="custom-message-section">
              <h3>Custom Message {aiMessages.length > 0 ? '(Optional)' : ''}</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi {name}, your personalized message here..."
                rows={4}
              />
              <p className="message-help">Use {'{name}'} to personalize with customer names</p>
            </div>

            <div className="step-actions">
              <button onClick={() => setStep(2)} className="secondary-btn">
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedAiMessage && !message}
                className="primary-btn"
              >
                Review Campaign
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="step-content">
            <h2>Campaign Summary</h2>
            
            <div className="campaign-summary">
              <div className="summary-section">
                <h3>Campaign Details</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Campaign Name</label>
                    <span>{campaignName}</span>
                  </div>
                  <div className="summary-item">
                    <label>Objective</label>
                    <span className="capitalize">{campaignObjective}</span>
                  </div>
                  <div className="summary-item">
                    <label>Target Audience</label>
                    <span>{audiencePreview?.count.toLocaleString() || 0} customers</span>
                  </div>
                  <div className="summary-item">
                    <label>Message Type</label>
                    <span>
                      {selectedAiMessage ? `🤖 AI-Generated (${selectedAiMessage.variant})` : 'Custom Message'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h3>Final Message</h3>
                <div className="final-message">
                  {selectedAiMessage ? selectedAiMessage.message : message}
                </div>
              </div>

              <div className="summary-section">
                <h3>Targeting Rules</h3>
                <div className="rules-summary">
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="rule-summary">
                      {index > 0 && rule.logicalOperator && (
                        <span className="logical-op">{rule.logicalOperator}</span>
                      )}
                      <span>{renderRuleDescription(rule)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button onClick={() => setStep(3)} className="secondary-btn">
                Back
              </button>
              <button
                onClick={createCampaign}
                disabled={isLoading}
                className="primary-btn launch-btn"
              >
                {isLoading ? 'Launching...' : '🚀 Launch Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignBuilderPage;