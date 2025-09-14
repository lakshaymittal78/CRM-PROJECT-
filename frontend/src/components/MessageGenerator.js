// components/MessageGenerator.js
import React from 'react';
import './MessageGenerator.css';

const MessageGenerator = ({ suggestions, onSelectMessage, onClose }) => {
  const handleSelectMessage = (message) => {
    onSelectMessage(message);
    onClose();
  };

  return (
    <div className="message-generator">
      <div className="message-generator-header">
        <h3>🤖 AI Message Suggestions</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      
      <div className="message-suggestions">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="suggestion-card">
            <div className="suggestion-content">
              <div className="suggestion-text">
                "{suggestion}"
              </div>
              <div className="suggestion-meta">
                <span className="suggestion-type">
                  {suggestion.includes('discount') || suggestion.includes('off') ? '💰 Promotional' : 
                   suggestion.includes('back') || suggestion.includes('return') ? '🔄 Re-engagement' : 
                   '👋 General'}
                </span>
                <span className="suggestion-length">
                  {suggestion.length} characters
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSelectMessage(suggestion)}
              className="select-suggestion-btn"
            >
              Use This Message
            </button>
          </div>
        ))}
      </div>
      
      <div className="message-generator-footer">
        <p>💡 Tip: You can edit any selected message to better fit your campaign goals</p>
      </div>
    </div>
  );
};

export default MessageGenerator;