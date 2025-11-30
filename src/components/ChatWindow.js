import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';
import { generateAgentResponse, initializeAgent, resetAgent, getAgentState } from '../services/geminiService';

function ChatWindow({ onChangeApiKey }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentState, setAgentState] = useState(getAgentState());
  const [applicationComplete, setApplicationComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize agent on component mount
  useEffect(() => {
    const initialState = initializeAgent();
    setMessages([
      {
        id: 1,
        text: initialState.message,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setAgentState(getAgentState());
    // Focus on input after initialization
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Auto-scroll to the latest message and focus on input
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Focus on input after messages update (but not when loading)
    if (!isLoading && !applicationComplete) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isLoading, applicationComplete]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || applicationComplete) {
      return;
    }

    // Clear any previous errors
    setError(null);

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get response from AI Agent
      const response = await generateAgentResponse(inputValue);
      
      const botMessage = {
        id: messages.length + 2,
        text: response.message,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setAgentState(getAgentState());

      // Check if application is complete
      if (response.applicationComplete) {
        setApplicationComplete(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to get response from AI');
      console.error('Error:', err);
      
      // Add error message to chat
      const errorMessage = {
        id: messages.length + 2,
        text: `Error: ${err.message}`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    const initialState = resetAgent();
    setMessages([
      {
        id: 1,
        text: initialState.message,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setAgentState(getAgentState());
    setApplicationComplete(false);
    setError(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        <div className="chat-header">
          <div className="header-content">
            <div>
              <h2>📋 Financial Application Assistant</h2>
              <p>Powered by AI Agent (Hugging Face)</p>
            </div>
            <button 
              className="header-btn change-api-btn-header" 
              onClick={onChangeApiKey}
              title="Change API Key"
            >
              🔑 Change API
            </button>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${agentState.completionPercentage}%` }}
          >
            <span className="progress-text">{agentState.completionPercentage}%</span>
          </div>
        </div>

        <div className="current-section">
          <span>📍 Current Section: <strong>{agentState.currentSection.toUpperCase()}</strong></span>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
              <div className="message-bubble">
                <p>{message.text}</p>
              </div>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={applicationComplete ? "Application Complete! Click Restart." : "Type your answer here..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || applicationComplete}
          />
          {applicationComplete ? (
            <button 
              type="button"
              className="send-btn restart-btn"
              onClick={handleRestart}
            >
              Restart
            </button>
          ) : (
            <button 
              type="submit" 
              className="send-btn"
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </button>
          )}
        </form>
      </div>

      <div className="data-panel">
        <h3>📊 Collected Information</h3>
        <div className="data-sections">
          {Object.entries(agentState.collectedData).map(([section, data]) => (
            <div key={section} className={`data-section ${section}`}>
              <h4>{section.charAt(0).toUpperCase() + section.slice(1)}</h4>
              <div className="data-fields">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className={`data-field ${value ? 'filled' : 'empty'}`}>
                    <span className="field-label">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="field-value">
                      {value || <em>pending</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
