// setup-frontend.js
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Xeno CRM Frontend...\n');
console.log('📍 Current directory:', process.cwd());

// File contents for each file
const fileContents = {
  // Package.json
  'package.json': `{
  "name": "xeno-crm-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:3000"
}`,

  // Environment files
  '.env.example': `# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# For production deployment
# REACT_APP_API_URL=https://your-backend-domain.com
# REACT_APP_GOOGLE_CLIENT_ID=your_production_google_client_id`,

  '.env': `REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here`,

  // Public files
  'public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="Xeno CRM - Customer Relationship Management Platform" />
  <title>Xeno CRM</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`,

  // Main React files
  'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,

  // Placeholder files with instructions
  'src/App.js': `// TODO: Copy the complete App.js code from the "Complete Frontend Structure - App.js" artifact
// This is a placeholder - replace this comment with the full React component code

import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Xeno CRM - Replace this with the full App.js code from the artifacts</h1>
    </div>
  );
}

export default App;`,

  'src/contexts/AuthContext.js': `// TODO: Copy the complete AuthContext code from the "Authentication Context" artifact
// This is a placeholder - replace this comment with the full context code

import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  throw new Error('Replace this file with the complete AuthContext code from the artifacts');
};

export const AuthProvider = ({ children }) => {
  return <div>Replace with full AuthProvider code</div>;
};`,

  'src/components/Navbar.js': `// TODO: Copy the complete Navbar code from the "Navigation Bar Component" artifact
// This is a placeholder - replace this with the full component code

import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return <div>Replace with full Navbar component from artifacts</div>;
};

export default Navbar;`,

  'src/components/RuleBuilder.js': `// TODO: Copy the complete RuleBuilder code from the "Rule Builder Component" artifact
import React from 'react';
import './RuleBuilder.css';

const RuleBuilder = ({ rules, setRules }) => {
  return <div>Replace with full RuleBuilder component from artifacts</div>;
};

export default RuleBuilder;`,

  'src/components/MessageGenerator.js': `// TODO: Copy the complete MessageGenerator code from the "AI Message Generator Component" artifact
import React from 'react';
import './MessageGenerator.css';

const MessageGenerator = ({ suggestions, onSelectMessage, onClose }) => {
  return <div>Replace with full MessageGenerator component from artifacts</div>;
};

export default MessageGenerator;`,

  'src/components/AudiencePreview.js': `// TODO: Copy the complete AudiencePreview code from the "Audience Preview Component" artifact
import React from 'react';
import './AudiencePreview.css';

const AudiencePreview = ({ audienceSize, audiencePreview, loading }) => {
  return <div>Replace with full AudiencePreview component from artifacts</div>;
};

export default AudiencePreview;`,

  'src/pages/LoginPage.js': `// TODO: Copy the complete LoginPage code from the "Login Page with Google OAuth" artifact
import React from 'react';
import './LoginPage.css';

const LoginPage = () => {
  return <div>Replace with full LoginPage component from artifacts</div>;
};

export default LoginPage;`,

  'src/pages/DashboardPage.js': `// TODO: Copy the complete DashboardPage code from the "Dashboard Page with Analytics" artifact
import React from 'react';
import './DashboardPage.css';

const DashboardPage = () => {
  return <div>Replace with full DashboardPage component from artifacts</div>;
};

export default DashboardPage;`,

  'src/pages/CampaignsPage.js': `// TODO: Copy the complete CampaignsPage code from the "Campaigns History Page" artifact
import React from 'react';
import './CampaignsPage.css';

const CampaignsPage = () => {
  return <div>Replace with full CampaignsPage component from artifacts</div>;
};

export default CampaignsPage;`,

  'src/pages/CreateCampaignPage.js': `// TODO: Copy the complete CreateCampaignPage code from the "Create Campaign Page with Rule Builder" artifact
import React from 'react';
import './CreateCampaignPage.css';

const CreateCampaignPage = () => {
  return <div>Replace with full CreateCampaignPage component from artifacts</div>;
};

export default CreateCampaignPage;`
};

// CSS Files with TODO comments
const cssFiles = {
  'src/App.css': `/* TODO: Copy the main CSS from the "Main CSS Styles" artifact */
/* This is a placeholder - replace with the complete CSS code */

.App {
  text-align: center;
  padding: 20px;
}

/* Replace this entire file with the CSS from the artifacts */`,

  'src/components/Navbar.css': '/* TODO: Copy Navbar CSS from the "Main CSS Styles" or "Component CSS Styles" artifacts */',
  'src/components/RuleBuilder.css': '/* TODO: Copy RuleBuilder CSS from the "Component CSS Styles" artifact */',
  'src/components/MessageGenerator.css': '/* TODO: Copy MessageGenerator CSS from the "Component CSS Styles" artifact */',
  'src/components/AudiencePreview.css': '/* TODO: Copy AudiencePreview CSS from the "Component CSS Styles" artifact */',
  'src/pages/LoginPage.css': '/* TODO: Copy LoginPage CSS from the "Main CSS Styles" or "Component CSS Styles" artifacts */',
  'src/pages/DashboardPage.css': '/* TODO: Copy DashboardPage CSS from the "Main CSS Styles" or "Component CSS Styles" artifacts */',
  'src/pages/CampaignsPage.css': '/* TODO: Copy CampaignsPage CSS from the "Main CSS Styles" or "Component CSS Styles" artifacts */',
  'src/pages/CreateCampaignPage.css': '/* TODO: Copy CreateCampaignPage CSS from the "Component CSS Styles" artifact */'
};

// Directory structure to create
const directories = [
  'public',
  'src',
  'src/components',
  'src/contexts', 
  'src/pages'
];

function createDirectoryStructure() {
  try {
    // Create directories
    console.log('📁 Creating directories...');
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`📁 Directory already exists: ${dir}`);
      }
    });

    console.log('');

    // Create files with content
    console.log('📄 Creating files...');
    Object.entries(fileContents).forEach(([filePath, content]) => {
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (dir !== '.' && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created file: ${filePath}`);
      } catch (error) {
        console.error(`❌ Error creating ${filePath}:`, error.message);
      }
    });

    // Create CSS files
    console.log('');
    console.log('🎨 Creating CSS files...');
    Object.entries(cssFiles).forEach(([filePath, content]) => {
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (dir !== '.' && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created CSS file: ${filePath}`);
      } catch (error) {
        console.error(`❌ Error creating ${filePath}:`, error.message);
      }
    });

    console.log('\n🎉 Frontend structure created successfully!\n');
    
    console.log('📋 NEXT STEPS:');
    console.log('1. 📝 Replace TODO comments in each file with actual code from the artifacts');
    console.log('2. 🔑 Update your .env file with your Google OAuth Client ID');
    console.log('3. 📦 Run: npm install');
    console.log('4. 🚀 Run: npm start');
    console.log('');
    console.log('💡 IMPORTANT: All files currently have placeholder content.');
    console.log('   You MUST copy the actual component code from the Claude artifacts!');
    console.log('');
    console.log('📖 Artifact Mapping:');
    console.log('   • App.js ← "Complete Frontend Structure - App.js"');
    console.log('   • AuthContext.js ← "Authentication Context"');
    console.log('   • Navbar.js ← "Navigation Bar Component"');
    console.log('   • And so on for each component...');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you are in the correct directory');
    console.log('2. Check that you have write permissions');
    console.log('3. Try running as administrator if on Windows');
  }
}

// Run the setup
createDirectoryStructure();