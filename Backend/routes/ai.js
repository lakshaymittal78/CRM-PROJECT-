// Backend/routes/ai.js
const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Enhanced natural language parsing with Grok API fallback
const parseNaturalLanguageToRules = async (text) => {
  console.log('🤖 Parsing natural language:', text);
  
  // Try Grok API first for better accuracy
  try {
    const grokRules = await parseWithGrokAPI(text);
    if (grokRules && grokRules.length > 0) {
      console.log('✅ Used Grok API for parsing');
      return grokRules;
    }
  } catch (error) {
    console.warn('⚠️ Grok API failed, using pattern matching fallback:', error.message);
  }
  
  // Fallback to pattern matching (your existing logic)
  return parseWithPatterns(text);
};

// New Grok API integration
const parseWithGrokAPI = async (text) => {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    throw new Error('Grok API key not configured');
  }

  const systemPrompt = `You are an expert at converting natural language queries into customer segmentation rules for a CRM system.

Available fields and their types:
- totalSpends (number): Total amount spent by customer in INR
- visits (number): Number of visits/orders by customer  
- lastVisit (date): Days since last visit (use > for "more than X days ago")
- createdAt (date): Days since customer registration (use < for "within X days")
- email (text): Customer email address
- name (text): Customer name

Available operators:
- Numbers: >, <, >=, <=, =, !=
- Dates (days ago): >, <, >=, <=, =
- Text: contains, equals, startsWith, endsWith, notContains

Convert the user's natural language into JSON rules array. Each rule should have:
{
  "id": number (starting from 1),
  "field": "fieldName",
  "operator": "operator", 
  "value": "value as string",
  "logicalOperator": "AND" or "OR" (null for first rule)
}

Examples:
"customers who spent more than 10000 rupees" → [{"id": 1, "field": "totalSpends", "operator": ">", "value": "10000", "logicalOperator": null}]
"users inactive for 30 days" → [{"id": 1, "field": "lastVisit", "operator": ">", "value": "30", "logicalOperator": null}]
"high spenders with more than 5 visits" → [{"id": 1, "field": "totalSpends", "operator": ">", "value": "10000", "logicalOperator": null}, {"id": 2, "field": "visits", "operator": ">", "value": "5", "logicalOperator": "AND"}]

Return ONLY the JSON array, no other text.`;

  const response = await axios.post('https://api.x.ai/v1/chat/completions', {
    model: 'grok-beta',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    temperature: 0.1,
    max_tokens: 500
  }, {
    headers: {
      'Authorization': `Bearer ${grokApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  const aiResponse = response.data.choices[0].message.content.trim();
  
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error('Failed to parse Grok response:', aiResponse);
    throw new Error('AI returned invalid JSON format');
  }
};

// Your existing pattern matching as fallback (enhanced)
const parseWithPatterns = (text) => {
  const rules = [];
  let ruleId = 1;
  
  // Enhanced patterns with better coverage
  const patterns = [
    // Spending patterns
    { 
      regex: /spent?\s+(?:more than|over|above|greater than|\>)\s*₹?(\d+)/i,
      field: 'totalSpends', operator: '>', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /spent?\s+(?:less than|under|below|smaller than|\<)\s*₹?(\d+)/i,
      field: 'totalSpends', operator: '<', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /spent?\s+(?:exactly|equal to|\=)\s*₹?(\d+)/i,
      field: 'totalSpends', operator: '=', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /(?:high value|premium|vip)\s+customers?/i,
      field: 'totalSpends', operator: '>', getValue: () => 15000
    },
    {
      regex: /(?:low value|budget|economy)\s+customers?/i,
      field: 'totalSpends', operator: '<', getValue: () => 5000
    },
    
    // Visit patterns
    {
      regex: /(?:visited|shopped|ordered)\s+(?:more than|over|above|\>)\s*(\d+)/i,
      field: 'visits', operator: '>', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /(?:visited|shopped|ordered)\s+(?:less than|under|below|\<)\s*(\d+)/i,
      field: 'visits', operator: '<', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /(?:frequent|loyal|regular)\s+(?:customers?|shoppers?)/i,
      field: 'visits', operator: '>', getValue: () => 5
    },
    
    // Time-based patterns - inactive customers
    {
      regex: /(?:haven't|have not|no).*(?:visited|shopped|bought).*(?:in|for|since)\s*(\d+)\s*(?:days?)/i,
      field: 'lastVisit', operator: '>', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /(?:haven't|have not|no).*(?:visited|shopped|bought).*(?:in|for|since)\s*(\d+)\s*(?:months?)/i,
      field: 'lastVisit', operator: '>', getValue: (match) => parseInt(match[1]) * 30
    },
    {
      regex: /(?:inactive|dormant).*(?:for|since)\s*(\d+)\s*(?:days?)/i,
      field: 'lastVisit', operator: '>', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /(?:inactive|dormant).*(?:for|since)\s*(\d+)\s*(?:months?)/i,
      field: 'lastVisit', operator: '>', getValue: (match) => parseInt(match[1]) * 30
    },
    
    // New/recent customers
    {
      regex: /(?:new|recent)\s+customers?/i,
      field: 'createdAt', operator: '<', getValue: () => 30
    },
    {
      regex: /customers?\s+(?:joined|registered|signed up)\s+(?:in|within)\s*(?:last\s*)?(\d+)\s*(?:days?)/i,
      field: 'createdAt', operator: '<', getValue: (match) => parseInt(match[1])
    },
    {
      regex: /customers?\s+(?:joined|registered|signed up)\s+(?:in|within)\s*(?:last\s*)?(\d+)\s*(?:months?)/i,
      field: 'createdAt', operator: '<', getValue: (match) => parseInt(match[1]) * 30
    },
    
    // Email patterns
    {
      regex: /gmail\s+(?:users?|customers?)/i,
      field: 'email', operator: 'contains', getValue: () => 'gmail.com'
    },
    {
      regex: /email.*contains?\s*['""]([^'""]+)['""]?/i,
      field: 'email', operator: 'contains', getValue: (match) => match[1]
    },
    
    // Name patterns
    {
      regex: /(?:customers?|users?)\s+(?:named|called)\s+['""]([^'""]+)['""]?/i,
      field: 'name', operator: 'contains', getValue: (match) => match[1]
    },
  ];
  
  // Check for logical operators
  const hasAnd = /\band\b/i.test(text);
  const hasOr = /\bor\b/i.test(text);
  
  // Find matches
  patterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    if (match) {
      const value = pattern.getValue(match);
      const logicalOperator = rules.length > 0 ? (hasOr ? 'OR' : 'AND') : null;
      
      rules.push({
        id: ruleId++,
        field: pattern.field,
        operator: pattern.operator,
        value: value.toString(),
        logicalOperator,
      });
    }
  });
  
  // If no patterns matched, create a default rule
  if (rules.length === 0) {
    console.log('⚠️ No patterns matched, using default rule');
    rules.push({
      id: 1,
      field: 'totalSpends',
      operator: '>',
      value: '0',
      logicalOperator: null,
    });
  }
  
  console.log('✅ Pattern-parsed rules:', rules);
  return rules;
};

// Enhanced message generation with Grok API
const generateMessageSuggestions = async (rules, objective = 'engagement') => {
  console.log('💬 Generating messages for rules:', rules);
  
  try {
    const grokMessages = await generateWithGrokAPI(rules, objective);
    if (grokMessages && grokMessages.length > 0) {
      console.log('✅ Used Grok API for message generation');
      return grokMessages;
    }
  } catch (error) {
    console.warn('⚠️ Grok API failed for messages, using fallback:', error.message);
  }
  
  // Fallback to your existing logic
  return generateMessagesWithPatterns(rules, objective);
};

// Grok API message generation
const generateWithGrokAPI = async (rules, objective) => {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    throw new Error('Grok API key not configured');
  }

  // Analyze rules to create context
  const ruleDescriptions = rules.map(rule => {
    const field = rule.field;
    const operator = rule.operator;
    const value = rule.value;
    
    switch (field) {
      case 'totalSpends':
        return `spending ${operator === '>' ? 'more than' : operator === '<' ? 'less than' : 'exactly'} ₹${value}`;
      case 'visits':
        return `${operator === '>' ? 'more than' : operator === '<' ? 'fewer than' : 'exactly'} ${value} visits`;
      case 'lastVisit':
        return `${operator === '>' ? 'inactive for more than' : 'active within'} ${value} days`;
      case 'createdAt':
        return `${operator === '<' ? 'new customers (within' : 'old customers (more than'} ${value} days)`;
      default:
        return `${field} ${operator} ${value}`;
    }
  }).join(' AND ');

  const systemPrompt = `You are a marketing expert creating personalized campaign messages for Indian customers.

Create 3 different message variants that:
- Are personalized with {name} placeholder (use {name}, not {{name}})
- Are concise and engaging (max 150 characters)
- Use Indian currency (₹) and context
- Include clear call-to-action
- Match the campaign objective
- Are appropriate for the customer segment

Campaign objective: ${objective}
Customer segment: ${ruleDescriptions}

Return ONLY a JSON array with 3 objects:
[
  {
    "message": "Hi {name}, your message here",
    "variant": "Brief variant name",
    "focus": "What this variant emphasizes"
  }
]

Examples:
[
  {
    "message": "Hi {name}, we miss you! Here's 20% off your next order - valid for 48 hours only!",
    "variant": "Win-back",
    "focus": "Urgency and discount"
  }
]`;

  const response = await axios.post('https://api.x.ai/v1/chat/completions', {
    model: 'grok-beta',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate messages for: ${objective} campaign targeting ${ruleDescriptions}` }
    ],
    temperature: 0.7,
    max_tokens: 400
  }, {
    headers: {
      'Authorization': `Bearer ${grokApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  const aiResponse = response.data.choices[0].message.content.trim();
  
  try {
    const jsonMatch = aiResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error('Failed to parse Grok message response:', aiResponse);
    throw new Error('AI returned invalid message format');
  }
};

// Your existing message generation logic (enhanced)
const generateMessagesWithPatterns = (rules, objective = 'engagement') => {
  const messages = [];
  
  // Analyze rules to determine customer segment
  const hasHighSpending = rules.some(r => r.field === 'totalSpends' && r.operator === '>' && parseInt(r.value) > 10000);
  const hasLowSpending = rules.some(r => r.field === 'totalSpends' && r.operator === '<' && parseInt(r.value) < 5000);
  const hasInactivity = rules.some(r => r.field === 'lastVisit' && r.operator === '>' && parseInt(r.value) > 30);
  const hasHighVisits = rules.some(r => r.field === 'visits' && r.operator === '>' && parseInt(r.value) > 5);
  const isNewCustomer = rules.some(r => r.field === 'createdAt' && r.operator === '<' && parseInt(r.value) < 60);
  
  // High-value customers
  if (hasHighSpending) {
    messages.push(
      {
        message: "Hi {name}, exclusive VIP offer: 15% off + free shipping on your next premium purchase!",
        variant: "VIP",
        focus: "Exclusivity and premium treatment"
      },
      {
        message: "{name}, thank you for your loyalty! Early access to our new collection with 20% off.",
        variant: "Loyalty",
        focus: "Appreciation and early access"
      },
      {
        message: "Hello {name}, special invitation: Private sale event with up to 25% off luxury items!",
        variant: "Exclusive",
        focus: "Private access and luxury"
      }
    );
  }
  
  // Inactive customers (win-back)
  if (hasInactivity) {
    messages.push(
      {
        message: "Hi {name}, we miss you! Come back with 30% off - valid for 48 hours only!",
        variant: "Win-back",
        focus: "Urgency and substantial discount"
      },
      {
        message: "{name}, it's been too long! Here's ₹500 off on orders above ₹2000 to welcome you back.",
        variant: "Welcome Back",
        focus: "Specific monetary incentive"
      },
      {
        message: "We've saved something special for you, {name}! Return and discover 25% off your favorites.",
        variant: "Personal",
        focus: "Personalization and favorites"
      }
    );
  }
  
  // Frequent shoppers
  if (hasHighVisits && !hasInactivity) {
    messages.push(
      {
        message: "Hi {name}, you're our star customer! Enjoy free express shipping on your next order.",
        variant: "Recognition",
        focus: "Recognition and free service"
      },
      {
        message: "{name}, thanks for your loyalty! Double reward points on all purchases this week.",
        variant: "Rewards",
        focus: "Loyalty program benefits"
      },
      {
        message: "Hello {name}, first access to our flash sale - 15% off everything before anyone else!",
        variant: "Priority",
        focus: "Priority access and timing"
      }
    );
  }
  
  // New customers
  if (isNewCustomer) {
    messages.push(
      {
        message: "Welcome {name}! Complete your profile and get ₹300 off your next purchase.",
        variant: "Welcome",
        focus: "Onboarding incentive"
      },
      {
        message: "Hi {name}, thanks for joining us! Here's 20% off to get you started - use code WELCOME20.",
        variant: "Getting Started",
        focus: "Easy start with clear code"
      },
      {
        message: "{name}, explore our bestsellers with 25% off - perfect for your first big order!",
        variant: "Discovery",
        focus: "Product discovery and first purchase"
      }
    );
  }
  
  // Default engagement messages
  if (messages.length === 0) {
    messages.push(
      {
        message: "Hi {name}, don't miss our weekend special - 20% off everything!",
        variant: "General",
        focus: "Time-bound general offer"
      },
      {
        message: "{name}, your favorites are back in stock! Shop now before they're gone again.",
        variant: "Stock Alert",
        focus: "Product availability and urgency"
      },
      {
        message: "Hello {name}, flash sale alert! Up to 40% off on trending items - 24 hours only!",
        variant: "Flash Sale",
        focus: "Limited time and trending products"
      }
    );
  }
  
  // Return top 3 messages
  return messages.slice(0, 3);
};

// POST /api/ai/convert-rules - Convert natural language to rules (enhanced)
router.post('/convert-rules', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    console.log('🔄 Converting natural language to rules:', prompt);
    
    const rules = await parseNaturalLanguageToRules(prompt);
    
    res.json({
      success: true,
      rules,
      originalPrompt: prompt,
      confidence: rules.length > 0 ? 0.9 : 0.5,
      source: process.env.GROK_API_KEY ? 'AI-powered' : 'Pattern-matching'
    });
  } catch (error) {
    console.error('❌ Rule conversion error:', error);
    res.status(500).json({ 
      message: 'Failed to convert natural language to rules',
      error: error.message 
    });
  }
});

// POST /api/ai/generate-messages - Generate message suggestions (enhanced)
router.post('/generate-messages', authenticateToken, async (req, res) => {
  try {
    const { rules, campaignObjective = 'engagement' } = req.body;
    
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ message: 'Rules array is required' });
    }
    
    console.log('💬 Generating messages for campaign objective:', campaignObjective);
    
    const messages = await generateMessageSuggestions(rules, campaignObjective);
    
    res.json({
      success: true,
      messages,
      objective: campaignObjective,
      rulesAnalyzed: rules.length,
      source: process.env.GROK_API_KEY ? 'AI-powered' : 'Template-based'
    });
  } catch (error) {
    console.error('❌ Message generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate messages',
      error: error.message 
    });
  }
});

// Keep your existing endpoints
router.post('/analyze-campaign', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    res.json({
      success: true,
      insights: [
        "Your campaign had a 92% delivery rate, which is above average.",
        "Messages with personalized greetings performed 15% better.",
        "Consider targeting customers with similar spending patterns for future campaigns.",
      ],
      recommendations: [
        "Try A/B testing different message variations",
        "Consider adding urgency elements like 'limited time offer'",
        "Segment your audience further based on purchase history",
      ],
    });
  } catch (error) {
    console.error('❌ Campaign analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze campaign',
      error: error.message 
    });
  }
});

router.get('/test', (req, res) => {
  res.json({
    message: 'AI service is working!',
    features: [
      'Natural language to rules conversion (Grok AI + Pattern matching)',
      'Intelligent message generation (Grok AI + Templates)',
      'Campaign analysis and insights',
    ],
    endpoints: {
      convertRules: 'POST /api/ai/convert-rules',
      generateMessages: 'POST /api/ai/generate-messages',
      analyzeCampaign: 'POST /api/ai/analyze-campaign',
    },
    aiProvider: process.env.GROK_API_KEY ? 'Grok AI with fallback' : 'Pattern matching only'
  });
});

module.exports = router;