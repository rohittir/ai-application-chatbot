# AI Chatbot Financial Application - Monorepo

A full-stack financial application chatbot with a React frontend and AWS Serverless backend.

## 📁 Monorepo Structure

```
ai-form-application/
├── front-end/                          # React Frontend Application
│   ├── src/
│   │   ├── App.js                     # Main React component
│   │   ├── App.css                    # App styling
│   │   ├── index.js                   # Entry point
│   │   ├── index.css                  # Global styles
│   │   ├── chatApi.js                 # Backend API client
│   │   └── components/
│   │       ├── ChatWindow.js          # Chat UI component
│   │       └── ChatWindow.css         # Chat styling
│   ├── public/
│   │   └── index.html                 # HTML template
│   ├── package.json                   # Frontend dependencies
│   ├── .gitignore                     # Frontend gitignore
│   └── README.md
│
├── back-end/                           # AWS Serverless Backend
│   ├── src/
│   │   ├── handlers/                  # Lambda handler functions
│   │   │   ├── initializeChat.js      # Create new session
│   │   │   ├── sendMessage.js         # Process messages & LLM
│   │   │   ├── getState.js            # Retrieve session state
│   │   │   ├── resetChat.js           # Reset session
│   │   │   └── listSessions.js        # Admin: List sessions
│   │   └── lib/                       # Shared utilities
│   │       ├── agent.js               # Financial agent state
│   │       ├── dynamodb.js            # DynamoDB operations
│   │       └── validators.js          # Validation & helpers
│   ├── serverless.yml                 # Serverless Framework config
│   ├── package.json                   # Backend dependencies
│   ├── .gitignore                     # Backend gitignore
│   └── README.md
│
└── README.md                          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (for frontend)
- **npm** or **yarn**
- **AWS Account** with credentials configured
- **Hugging Face API Key** for LLM integration

### Frontend Setup

```bash
cd front-end
npm install
npm start
```

The frontend will be available at `http://localhost:3000`.

### Backend Setup

```bash
cd back-end
npm install

# Set environment variables
export HF_API_KEY=your_hugging_face_api_key

# Deploy to AWS
npm run deploy
```

## 🏗️ Architecture

### Frontend Stack
- **React 18.2.0** - UI library
- **react-scripts 5.0.1** - Build tool
- **Axios** - HTTP client for API calls

### Backend Stack
- **AWS Lambda** - Serverless compute
- **AWS API Gateway** - REST API endpoints
- **AWS DynamoDB** - NoSQL database with 7-day TTL
- **Serverless Framework v3** - Infrastructure as code
- **Node.js 20.x** - Lambda runtime
- **OpenAI SDK** - For Hugging Face API integration

### Database Schema

**Table**: `ai-form-chatbot-dev`

| Field | Type | Purpose |
|-------|------|---------|
| `sessionId` | String (Hash Key) | Unique session identifier |
| `createdAt` | Number (Range Key) | Creation timestamp |
| `collectedData` | Object | User information by section |
| `conversationHistory` | Array | Chat message history |
| `currentSection` | String | Current form section |
| `completionPercentage` | Number | Application completion % |
| `updatedAt` | Number | Last update timestamp |
| `expiresAt` | Number (TTL) | Auto-delete after 7 days |

### API Endpoints

All endpoints return JSON responses with proper CORS headers.

#### 1. Initialize Chat
```
POST /chat/initialize
Response: { sessionId, message, collectedData, currentSection, completionPercentage }
```

#### 2. Send Message
```
POST /chat/send
Body: { sessionId, message }
Response: { message, collectedData, currentSection, completionPercentage, sectionComplete, applicationComplete }
```

#### 3. Get Session State
```
GET /chat/state/{sessionId}
Response: { sessionId, collectedData, currentSection, completionPercentage, conversationHistory }
```

#### 4. Reset Chat
```
POST /chat/reset/{sessionId}
Response: { sessionId, message, collectedData, currentSection, completionPercentage }
```

#### 5. List Sessions (Admin)
```
GET /chat/sessions?limit=10&exclusiveStartKey=...
Response: { sessions, nextToken, count, limit }
```

## 🛠️ Development

### Frontend Development

```bash
cd front-end

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend Development

```bash
cd back-end

# Deploy to dev environment
npm run deploy

# Deploy to prod environment
npm run deploy:prod

# View Lambda logs
npm run logs

# Remove deployment
npm run remove

# Display deployment info
npm run info
```

## 🔐 Environment Variables

### Backend Required

```bash
# Hugging Face API Key (required for LLM)
export HF_API_KEY=hf_your_token_here

# Optional - AWS Configuration
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

### Serverless Configuration

The backend uses these environment variables in Lambda:

- `DYNAMODB_TABLE` - DynamoDB table name (auto-generated)
- `HF_API_KEY` - Hugging Face API key
- `NODE_ENV` - Environment (dev/prod)

## 📝 Application Workflow

1. **User initializes chat** → Creates new session with unique ID
2. **Chat progresses through sections** → Personal, Educational, Professional, Family
3. **LLM extracts structured data** → From user input using Hugging Face
4. **Data validates and stores** → In DynamoDB with user input
5. **Completion tracking** → Shows progress percentage
6. **Summary generation** → When all sections complete

### FinancialApplicationAgent

The core state management class in `back-end/src/lib/agent.js` handles:

- **Section Management** - Tracks current section and moves between them
- **Data Validation** - Validates email, phone, DOB, names, etc.
- **LLM Extraction** - Uses Hugging Face to extract fields from messages
- **Progress Tracking** - Calculates completion percentage
- **Summary Generation** - Creates comprehensive application summary

## 🧪 Testing

### Frontend
```bash
cd front-end
npm test
```

### Backend
```bash
cd back-end
# Deploy to test/dev environment first
npm run deploy
# Then test using API client or tools like Postman
```

## 📦 Deployment

### Frontend Deployment

```bash
cd front-end
npm run build

# Deploy to AWS S3 + CloudFront (requires configuration)
# OR deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
```

### Backend Deployment

```bash
cd back-end

# Development
npm run deploy

# Production
npm run deploy:prod
```

## 🐛 Troubleshooting

### "Cannot find module 'uuid'"
- Ensure `npm install` is run in `back-end/`
- Verify `node_modules/` is included in Lambda package

### "DYNAMODB_TABLE not set"
- Check that environment variables are configured in `serverless.yml`
- Verify DynamoDB table is created in AWS CloudFormation

### Lambda Timeout
- Increase timeout in `back-end/serverless.yml` (default: 30s)
- Check HF_API_KEY is valid - API calls may be slow

### CORS Errors
- Verify `cors: true` is set in all HTTP events in `serverless.yml`
- Check API Gateway CORS configuration

## 📚 Documentation

- **[MONOREPO_SETUP.md](./MONOREPO_SETUP.md)** - Detailed setup guide
- **[back-end/README.md](./back-end/README.md)** - Backend documentation
- **[front-end/README.md](./front-end/README.md)** - Frontend documentation

## 🔄 Git Workflow

Each folder has its own `.gitignore`:

```bash
# Frontend
front-end/.gitignore    # Excludes node_modules, build/, .env, etc.

# Backend
back-end/.gitignore     # Excludes node_modules, .serverless/, .env, etc.
```

When committing:

```bash
# Frontend changes
git add front-end/
git commit -m "feat(frontend): [description]"

# Backend changes
git add back-end/
git commit -m "feat(backend): [description]"

# Monorepo changes
git add .
git commit -m "chore(monorepo): [description]"
```

## 📄 Scripts Reference

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm start` | front-end | Start React dev server |
| `npm run build` | front-end | Build React for production |
| `npm test` | front-end | Run frontend tests |
| `npm run deploy` | back-end | Deploy to AWS dev |
| `npm run deploy:prod` | back-end | Deploy to AWS prod |
| `npm run logs` | back-end | View Lambda logs |
| `npm run remove` | back-end | Remove AWS deployment |
| `npm run info` | back-end | Display deployment info |

## 🤝 Contributing

1. Make changes in appropriate folder (front-end or back-end)
2. Test locally before pushing
3. Follow commit message conventions
4. Submit pull request

## 📝 License

Private project - All rights reserved

## 🆘 Support

For issues or questions:
1. Check troubleshooting section
2. Review relevant README file
3. Check AWS CloudFormation events for deployment errors
4. View Lambda CloudWatch logs

---

**Last Updated**: December 13, 2025
