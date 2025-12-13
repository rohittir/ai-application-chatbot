import React, { useState } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';

function App() {
  const [chatStarted, setChatStarted] = useState(false);

  const handleStartChat = () => {
    setChatStarted(true);
  };

  const handleRestart = () => {
    setChatStarted(false);
  };

  return (
    <div className="app-container">
      {!chatStarted ? (
        <div className="welcome-container">
          <h1>AI Financial Application</h1>
          <p>Complete your financial application with our intelligent AI assistant</p>
          <button className="start-btn" onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      ) : (
        <ChatWindow onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;
