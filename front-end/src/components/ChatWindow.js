import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';
import { initializeChat, sendMessage, resetChat } from '../chatApi';

function ChatWindow({ onRestart }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [collectedData, setCollectedData] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentSection, setCurrentSection] = useState('personal');
  const [applicationComplete, setApplicationComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat on component mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const response = await initializeChat();
        setSessionId(response.sessionId);
        setMessages([
          {
            id: 1,
            text: response.message,
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        setCollectedData(response.collectedData);
        setCompletionPercentage(response.completionPercentage);
        setCurrentSection(response.currentSection);
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (err) {
        setError('Failed to initialize chat: ' + err.message);
      }
    };
    initChat();
  }, []);

  // Auto-scroll to the latest message and focus on input
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading && !applicationComplete) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isLoading, applicationComplete]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || applicationComplete || !sessionId) {
      return;
    }

    setError(null);

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
      const response = await sendMessage(sessionId, inputValue);

      const botMessage = {
        id: messages.length + 2,
        text: response.message,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setCollectedData(response.collectedData);
      setCompletionPercentage(response.completionPercentage);
      setCurrentSection(response.currentSection);

      if (response.applicationComplete) {
        setApplicationComplete(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to process message');
      console.error('Error:', err);

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

  const handleRestart = async () => {
    try {
      setIsLoading(true);
      const response = await resetChat(sessionId);
      setMessages([
        {
          id: 1,
          text: response.message,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setCollectedData(response.collectedData);
      setCompletionPercentage(response.completionPercentage);
      setCurrentSection(response.currentSection);
      setApplicationComplete(false);
      setError(null);
    } catch (err) {
      setError('Failed to restart chat: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        <div className="chat-header">
          <div className="header-content">
            <div>
              <h2>📋 Financial Application Assistant</h2>
              <p>Powered by AWS Lambda + DynamoDB</p>
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          >
            <span className="progress-text">{completionPercentage}%</span>
          </div>
        </div>

        <div className="current-section">
          <span>📍 Current Section: <strong>{currentSection.toUpperCase()}</strong></span>
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
            disabled={isLoading || applicationComplete || !sessionId}
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
              disabled={isLoading || !inputValue.trim() || !sessionId}
            >
              Send
            </button>
          )}
        </form>
      </div>

      <div className="data-panel">
        <h3>📊 Collected Information</h3>
        <div className="data-sections">
          {collectedData && Object.entries(collectedData).map(([section, data]) => (
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
