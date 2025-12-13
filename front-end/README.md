# Frontend - AI Chatbot Financial Application

React frontend for the AI Chatbot Financial Application. Communicates with AWS Lambda backend for chat processing and data persistence.

## 📋 Overview

This is a React 18 application that provides a conversational interface for collecting financial information through a multi-section chat-based form.

## 🏗️ Project Structure

```
src/
├── App.js                 # Main application component
├── App.css                # App styling
├── index.js               # React entry point
├── index.css              # Global styles
├── chatApi.js             # Backend API client
└── components/
    ├── ChatWindow.js      # Chat UI component
    └── ChatWindow.css     # Chat styling

public/
└── index.html             # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Opens at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Outputs optimized build to `build/` folder.

## 📝 Usage

1. User clicks "Start Chat" on welcome screen
2. Chat window opens with greeting message
3. User enters information through conversational prompts
4. Frontend sends messages to backend via `chatApi.js`
5. Backend processes with LLM and stores in DynamoDB
6. Frontend displays responses and tracks progress

## 🔌 API Integration

The `chatApi.js` file handles all communication with the backend:

```javascript
// Initialize new chat session
await initializeChat()

// Send message to backend
await sendMessage(sessionId, userMessage)

// Get session state
await getSessionState(sessionId)

// Reset chat session
await resetChat(sessionId)

// List all sessions (admin)
await listSessions(limit, nextToken)
```

### Backend URL Configuration

Update the base URL in `chatApi.js` to point to your deployed Lambda API Gateway:

```javascript
const API_BASE_URL = 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev';
```

## 🎨 Components

### App.js
Main application component that manages:
- Welcome screen
- Chat window visibility
- Session management

### ChatWindow.js
Chat UI component featuring:
- Message display
- Message input
- Auto-scroll
- Loading states
- Error handling
- Progress tracking

## 🔄 Data Flow

```
User Input
    ↓
ChatWindow Component
    ↓
chatApi.js (HTTP POST)
    ↓
Backend Lambda Function
    ↓
DynamoDB (data persistence)
    ↓
Backend Response (with LLM extraction)
    ↓
chatApi.js (response)
    ↓
ChatWindow Display
```

## 🧪 Testing

```bash
npm test
```

## 📦 Dependencies

- `react@18.2.0` - UI library
- `react-dom@18.2.0` - DOM rendering
- `react-scripts@5.0.1` - Build tool and webpack config
- `axios@1.6.0` - HTTP client

## 🔐 Security

- ✅ No API keys stored in frontend
- ✅ All API calls go through secure HTTPS
- ✅ Backend handles all LLM authentication
- ✅ Session IDs are unique per chat

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Verify backend is deployed
- Check API_BASE_URL in `chatApi.js`
- Verify CORS is enabled in backend

### Chat not responding
- Check browser console for errors
- Verify HF_API_KEY is set in backend
- Check AWS Lambda CloudWatch logs

### Styling issues
- Clear browser cache
- Run `npm start` to rebuild

## 📚 Related Documentation

- [Main README](../README.md) - Monorepo overview
- [Backend README](../back-end/README.md) - Backend documentation
- [MONOREPO_SETUP.md](../MONOREPO_SETUP.md) - Detailed setup guide

## 🔄 Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Start | `npm start` | Run dev server on localhost:3000 |
| Build | `npm run build` | Create production build |
| Test | `npm test` | Run test suite |
| Eject | `npm run eject` | ⚠️ Irreversible: eject from react-scripts |

## 📝 Environment Variables

Frontend doesn't require environment variables. All backend configuration is handled by the backend.

## 🎯 Features

- ✅ Responsive chat interface
- ✅ Multi-section form flow
- ✅ Real-time progress tracking
- ✅ Session persistence
- ✅ Error handling and user feedback
- ✅ Loading states and animations
- ✅ Mobile friendly

## 🤝 Contributing

1. Create a feature branch
2. Make changes in `src/`
3. Test with `npm test`
4. Commit and push
5. Submit PR

---

**Last Updated**: December 13, 2025
