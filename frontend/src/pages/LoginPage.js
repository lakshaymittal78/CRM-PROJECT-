// src/pages/LoginPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'filled_blue', 
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      } else {
        setError('Google Sign-In is not available. Please check your internet connection.');
      }
    };

    script.onerror = () => {
      setError('Failed to load Google Sign-In. Please check your internet connection.');
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      setError('');
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
      
      await login(response.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to Xeno CRM</h1>
          <p>Sign in to access your customer relationship management platform</p>
        </div>

        <div className="login-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="google-signin-container">
            <div id="google-signin-button"></div>
            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Signing you in...</p>
              </div>
            )}
          </div>

          <div className="login-features">
            <h3>What you can do:</h3>
            <ul>
              <li>✅ Create customer segments with flexible rules</li>
              <li>✅ Launch personalized campaigns</li>
              <li>✅ Track delivery performance</li>
              <li>✅ AI-powered insights and suggestions</li>
            </ul>
          </div>
        </div>

        <div className="login-footer">
          <p>Secure authentication powered by Google OAuth 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;