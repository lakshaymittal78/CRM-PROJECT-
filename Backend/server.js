// Backend/server.js (replace your current file with this)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- Middleware (must be registered BEFORE mounting routes) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Helper to normalize route module exports into an Express router ---
function normalizeRouter(moduleExport, name = 'module') {
  if (!moduleExport) return null;
  // If it's already an express router (function with use or handle), return it
  if (typeof moduleExport === 'function' || (moduleExport && typeof moduleExport.use === 'function')) {
    return moduleExport;
  }
  // If it's an object that contains a router property, try that
  if (moduleExport.router && (typeof moduleExport.router.use === 'function')) {
    return moduleExport.router;
  }
  // If it exports default (es module transpiled), try .default
  if (moduleExport.default && (typeof moduleExport.default.use === 'function' || typeof moduleExport.default === 'function')) {
    return moduleExport.default;
  }
  return null;
}

// --- Load routes safely (validate exports) ---
let authRouter, dataRouter, dashboardRouter, campaignRouter, aiRouter;

try {
  const authModule = require('./routes/auth');
  authRouter = normalizeRouter(authModule, 'auth');
  if (!authRouter) throw new Error('Invalid export from ./routes/auth - expected Express Router');
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.error('❌ Error loading auth routes:', err.message);
  authRouter = express.Router();
  authRouter.get('*', (req, res) => res.status(500).json({ error: 'Auth routes not available', message: err.message }));
}

try {
  const dataModule = require('./routes/data');
  dataRouter = normalizeRouter(dataModule, 'data');
  if (!dataRouter) throw new Error('Invalid export from ./routes/data - expected Express Router');
  console.log('✅ Data routes loaded');
} catch (err) {
  console.error('❌ Error loading data routes:', err.message);
  dataRouter = express.Router();
  dataRouter.get('*', (req, res) => res.status(500).json({ error: 'Data routes not available', message: err.message }));
}

try {
  const dashboardModule = require('./routes/dashboard');
  dashboardRouter = normalizeRouter(dashboardModule, 'dashboard');
  if (!dashboardRouter) throw new Error('Invalid export from ./routes/dashboard - expected Express Router');
  console.log('✅ Dashboard routes loaded');
} catch (err) {
  console.error('❌ Error loading dashboard routes:', err.message);
  dashboardRouter = express.Router();
  dashboardRouter.get('*', (req, res) => res.status(500).json({ error: 'Dashboard routes not available', message: err.message }));
}

try {
  const campaignModule = require('./routes/campaigns');
  campaignRouter = normalizeRouter(campaignModule, 'campaigns');
  if (!campaignRouter) throw new Error('Invalid export from ./routes/campaigns - expected Express Router');
  console.log('✅ Campaign routes loaded');
} catch (err) {
  console.error('❌ Error loading campaign routes:', err.message);
  campaignRouter = express.Router();
  campaignRouter.get('*', (req, res) => res.status(500).json({ error: 'Campaign routes not available', message: err.message }));
}

try {
  const aiModule = require('./routes/ai');
  aiRouter = normalizeRouter(aiModule, 'ai');
  if (!aiRouter) throw new Error('Invalid export from ./routes/ai - expected Express Router');
  console.log('✅ AI routes loaded');
} catch (err) {
  console.error('❌ Error loading AI routes:', err.message);
  aiRouter = express.Router();
  aiRouter.get('*', (req, res) => res.status(500).json({ error: 'AI routes not available', message: err.message }));
}

// --- Mount routes ---
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/ai', aiRouter);

// --- Health & root routes ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Xeno CRM Backend is running',
    timestamp: new Date().toISOString(),
    env: {
      port: process.env.PORT || 'not set',
      mongoUri: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
      googleAuth: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    }
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Xeno CRM API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      authTest: '/api/auth/test',
      data: '/api/data',
      dashboard: '/api/dashboard',
      campaigns: '/api/campaigns',
      ai: '/api/ai',
      health: '/health'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Error middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

// 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    requestedPath: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
