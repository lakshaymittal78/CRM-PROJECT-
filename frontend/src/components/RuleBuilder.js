// components/RuleBuilder.js
import React from 'react';
import './RuleBuilder.css';

const RuleBuilder = ({ rules, setRules }) => {
  const fieldOptions = [
    { value: 'totalSpends', label: 'Total Spending', type: 'number' },
    { value: 'visits', label: 'Number of Visits', type: 'number' },
    { value: 'lastVisit', label: 'Days Since Last Visit', type: 'number' },
    { value: 'createdAt', label: 'Customer Since (days)', type: 'number' },
    { value: 'email', label: 'Email Domain', type: 'text' },
    { value: 'name', label: 'Name Contains', type: 'text' }
  ];

  const operatorOptions = {
    number: [
      { value: '>', label: 'Greater than' },
      { value: '<', label: 'Less than' },
      { value: '=', label: 'Equal to' },
      { value: '>=', label: 'Greater than or equal' },
      { value: '<=', label: 'Less than or equal' },
      { value: '!=', label: 'Not equal to' }
    ],
    text: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
      { value: 'notContains', label: 'Does not contain' }
    ]
  };

  const addRule = () => {
    const newRule = {
      id: Date.now(),
      field: 'totalSpends',
      operator: '>',
      value: '',
      logicalOperator: rules.length > 0 ? 'AND' : null
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id, field, value) => {
    setRules(rules.map(rule => 
      rule.id === id 
        ? { ...rule, [field]: value }
        : rule
    ));
  };

  const removeRule = (id) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    // Remove logical operator from first rule if it exists
    if (updatedRules.length > 0) {
      updatedRules[0].logicalOperator = null;
    }
    setRules(updatedRules);
  };

  const getFieldType = (fieldValue) => {
    const field = fieldOptions.find(f => f.value === fieldValue);
    return field ? field.type : 'number';
  };

  const renderRule = (rule, index) => {
    const fieldType = getFieldType(rule.field);
    const operators = operatorOptions[fieldType] || operatorOptions.number;

    return (
      <div key={rule.id} className="rule-item">
        {/* Logical Operator */}
        {index > 0 && (
          <div className="logical-operator">
            <select
              value={rule.logicalOperator || 'AND'}
              onChange={(e) => updateRule(rule.id, 'logicalOperator', e.target.value)}
              className="logical-select"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        )}

        <div className="rule-content">
          {/* Field Selection */}
          <div className="rule-field">
            <select
              value={rule.field}
              onChange={(e) => {
                updateRule(rule.id, 'field', e.target.value);
                // Reset operator when field changes
                const newFieldType = getFieldType(e.target.value);
                const defaultOperator = operatorOptions[newFieldType][0].value;
                updateRule(rule.id, 'operator', defaultOperator);
              }}
              className="field-select"
            >
              {fieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Selection */}
          <div className="rule-operator">
            <select
              value={rule.operator}
              onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
              className="operator-select"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div className="rule-value">
            {fieldType === 'number' ? (
              <input
                type="number"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                placeholder="Enter value"
                className="value-input"
              />
            ) : (
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                placeholder="Enter text"
                className="value-input"
              />
            )}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => removeRule(rule.id)}
            className="remove-rule-btn"
            disabled={rules.length === 1}
          >
            ✕
          </button>
        </div>

        {/* Rule Preview */}
        <div className="rule-preview">
          {index > 0 && <span className="preview-operator">{rule.logicalOperator}</span>}
          <span className="preview-text">
            {fieldOptions.find(f => f.value === rule.field)?.label} {' '}
            {operators.find(op => op.value === rule.operator)?.label.toLowerCase()} {' '}
            <strong>{rule.value || '___'}</strong>
          </span>
        </div>
      </div>
    );
  };

  const getRulesSummary = () => {
    if (rules.length === 0) return 'No rules defined';
    
    return rules.map((rule, index) => {
      const field = fieldOptions.find(f => f.value === rule.field)?.label;
      const operator = operatorOptions[getFieldType(rule.field)]?.find(op => op.value === rule.operator)?.label;
      const logicalOp = index > 0 ? rule.logicalOperator : '';
      
      return `${logicalOp} ${field} ${operator?.toLowerCase()} ${rule.value}`.trim();
    }).join(' ');
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-header">
        <h3>Define Audience Segments</h3>
        <p>Create rules to target specific customer groups</p>
      </div>

      <div className="rules-container">
        {rules.map((rule, index) => renderRule(rule, index))}
      </div>

      <div className="rule-actions">
        <button
          type="button"
          onClick={addRule}
          className="add-rule-btn"
        >
          ➕ Add Rule
        </button>
      </div>

      {/* Rules Summary */}
      <div className="rules-summary">
        <h4>Audience Criteria:</h4>
        <div className="summary-text">
          {getRulesSummary()}
        </div>
      </div>

      {/* Helper Examples */}
      <div className="rule-examples">
        <h4>Example Rules:</h4>
        <div className="examples-grid">
          <div className="example-item">
            <strong>High Value Customers:</strong>
            <span>Total Spending &gt; ₹10,000</span>
          </div>
          <div className="example-item">
            <strong>Inactive Users:</strong>
            <span>Days Since Last Visit &gt; 30</span>
          </div>
          <div className="example-item">
            <strong>Frequent Visitors:</strong>
            <span>Number of Visits &gt; 5 AND Total Spending &gt; ₹5,000</span>
          </div>
          <div className="example-item">
            <strong>New Customers:</strong>
            <span>Customer Since (days) &lt; 30</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleBuilder;