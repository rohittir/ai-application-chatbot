import React, { useState, useEffect } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';

// Store API key in session memory (only during this browser session)
let sessionApiKey = null;

function App() {
  const [chatStarted, setChatStarted] = useState(false);
  const [apiKeyEntered, setApiKeyEntered] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');

  // Check if API key was already entered in this session
  useEffect(() => {
    if (sessionApiKey) {
      setApiKeyEntered(true);
    }
  }, []);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    setApiKeyError('');

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      setApiKeyError('Please enter a valid API key');
      return;
    }

    if (trimmedKey.length < 10) {
      setApiKeyError('API key seems too short. Please verify.');
      return;
    }

    // Store API key in session memory
    sessionApiKey = trimmedKey;
    
    // Store in environment variable for the service to access
    window.REACT_APP_HF_API_KEY = trimmedKey;

    setApiKeyEntered(true);
    setApiKeyInput('');
  };

  const handleStartChat = () => {
    setChatStarted(true);
  };

  const handleChangeApiKey = () => {
    sessionApiKey = null;
    window.REACT_APP_HF_API_KEY = null;
    setApiKeyEntered(false);
    setChatStarted(false);
    setApiKeyInput('');
    setApiKeyError('');
  };

  return (
    <div className="app-container">
      {!apiKeyEntered ? (
        <div className="welcome-container">
          <h1>🔐 API Configuration</h1>
          <p>Enter your Hugging Face API key to continue</p>
          
          <form onSubmit={handleApiKeySubmit} className="api-key-form">
            <div className="form-group">
              <label htmlFor="apiKey">Hugging Face API Key:</label>
              <input
                id="apiKey"
                type="password"
                className="api-key-input"
                placeholder="Enter your HF API key (hf_...)"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setApiKeyError('');
                }}
              />
              <p className="api-key-hint">
                Don't have an API key? Get one from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">Hugging Face</a>
              </p>
            </div>
            {apiKeyError && <div className="error-message">{apiKeyError}</div>}
            <button type="submit" className="start-btn">
              Verify & Continue
            </button>
          </form>
        </div>
      ) : !chatStarted ? (
        <div className="welcome-container">
          <h1>AI Financial Application</h1>
          <p>Complete your financial application with our intelligent AI assistant</p>
          <div className="api-status">
            <p>✅ API Key Configured</p>
            <button className="change-api-btn" onClick={handleChangeApiKey}>
              Change API Key
            </button>
          </div>
          <button className="start-btn" onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      ) : (
        <ChatWindow onChangeApiKey={handleChangeApiKey} />
      )}
    </div>
  );
}

export default App;
