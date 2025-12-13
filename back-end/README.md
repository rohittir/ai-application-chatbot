# Backend - AI Chatbot Financial Application

AWS Serverless backend using Lambda, API Gateway, and DynamoDB for the AI Chatbot Financial Application.

## 📋 Overview

This backend handles:
- REST API endpoints via AWS API Gateway
- Lambda function execution for chat processing
- DynamoDB persistence with 7-day TTL
- LLM integration with Hugging Face
- Session and data management

## 🏗️ Project Structure

```
src/
├── handlers/              # Lambda handler functions
│   ├── initializeChat.js  # Create new session
│   ├── sendMessage.js     # Process messages with LLM
│   ├── getState.js        # Get session state
│   ├── resetChat.js       # Reset session
│   └── listSessions.js    # Admin: List all sessions
├── lib/                   # Shared utilities
│   ├── agent.js           # FinancialApplicationAgent class
│   ├── dynamodb.js        # DynamoDB operations
│   └── validators.js      # Validators and response helpers
└── services/              # (optional) service utilities

serverless.yml            # Serverless Framework config
package.json             # Dependencies
.gitignore               # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- AWS Account with credentials configured
- Hugging Face API Key

### Installation

```bash
npm install
```

### Configuration

Set environment variables:

```bash
export HF_API_KEY=your_hugging_face_api_key
export AWS_PROFILE=default  # Optional, if not using default profile
export AWS_REGION=us-east-1
```

### Deployment

```bash
# Development
npm run deploy

# Production
npm run deploy:prod

# View logs
npm run logs

# Remove deployment
npm run remove

# Display deployment info
npm run info
```

## 🔧 Serverless Configuration

The `serverless.yml` defines:

- **Runtime**: Node.js 20.x
- **Region**: us-east-1 (configurable)
- **Memory**: 512 MB per Lambda
- **Timeout**: 30 seconds
- **DynamoDB Table**: `ai-form-chatbot-{stage}`
- **IAM Permissions**: DynamoDB access for all operations

## 📡 API Endpoints

All endpoints are hosted on API Gateway and return JSON responses.

### 1. Initialize Chat
```
POST /chat/initialize
```
Creates a new chat session.

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "message": "Welcome message...",
  "collectedData": { /* empty data object */ },
  "currentSection": "personal",
  "completionPercentage": 0
}
```

### 2. Send Message
```
POST /chat/send
```
Processes user message and updates application state.

**Request:**
```json
{
  "sessionId": "uuid-v4",
  "message": "User message text"
}
```

**Response:**
```json
{
  "message": "Bot response...",
  "collectedData": { /* updated data */ },
  "currentSection": "personal",
  "completionPercentage": 25,
  "sectionComplete": false,
  "applicationComplete": false
}
```

### 3. Get Session State
```
GET /chat/state/{sessionId}
```
Retrieves full session state.

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "collectedData": { /* all collected data */ },
  "currentSection": "personal",
  "completionPercentage": 25,
  "createdAt": 1702486800000,
  "updatedAt": 1702487000000,
  "conversationHistory": [ /* message array */ ]
}
```

### 4. Reset Chat
```
POST /chat/reset/{sessionId}
```
Deletes old session and creates new one.

**Response:**
```json
{
  "sessionId": "new-uuid-v4",
  "message": "Welcome message...",
  "collectedData": { /* fresh data */ },
  "currentSection": "personal",
  "completionPercentage": 0
}
```

### 5. List Sessions (Admin)
```
GET /chat/sessions?limit=10&exclusiveStartKey=...
```
Lists all sessions with pagination.

**Response:**
```json
{
  "sessions": [ /* array of sessions */ ],
  "nextToken": "base64-encoded-pagination-token",
  "count": 10,
  "limit": 10
}
```

## 🗄️ Database Schema

**Table**: `ai-form-chatbot-dev` (or `ai-form-chatbot-prod` for production)

### Attributes

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| `sessionId` | String | Hash | Unique session identifier (UUID v4) |
| `createdAt` | Number | Range | Timestamp in milliseconds |
| `collectedData` | Object | - | User information by section |
| `conversationHistory` | Array | - | Chat message history |
| `currentSection` | String | - | Current form section |
| `completionPercentage` | Number | - | Application completion % |
| `updatedAt` | Number | - | Last update timestamp |
| `expiresAt` | Number | TTL | Auto-delete timestamp (7 days) |

### Collected Data Structure

```javascript
{
  personal: {
    firstName, lastName, middleName,
    email, emailConfirmed,
    phoneNumber,
    dateOfBirth, dobConfirmed,
    nationality
  },
  educational: {
    highestQualification,
    university,
    fieldOfStudy,
    graduationYear
  },
  professional: {
    currentDesignation,
    company,
    yearsOfExperience,
    annualIncome,
    employmentType
  },
  family: {
    maritalStatus,
    dependents,
    spouseName,
    emergencyContact
  }
}
```

## 🤖 FinancialApplicationAgent

Core business logic class in `src/lib/agent.js`.

### Key Methods

```javascript
// Initialize new or restore existing agent
agent = new FinancialApplicationAgent(initialData)

// Get AI system prompt for current section
prompt = agent.getSystemPrompt()

// Check if current section is complete
isComplete = agent.isCurrentSectionComplete()

// Move to next section
hasNext = agent.moveToNextSection()

// Extract data from user message using LLM
await agent.updateCollectedDataWithLLM(message, openAiClient)

// Get completion percentage
percentage = agent.getCompletionPercentage()

// Get formatted summary
summary = agent.getSummary()
```

### Sections

1. **Personal** - Name, email, phone, DOB, nationality
2. **Educational** - Qualification, university, field of study
3. **Professional** - Job title, company, experience, income
4. **Family** - Marital status, dependents, emergency contact

## 🔐 Environment Variables

### Required

```bash
HF_API_KEY=your_hugging_face_api_key
```

### Optional

```bash
AWS_PROFILE=default
AWS_REGION=us-east-1
NODE_ENV=dev
```

### Auto-Set by Serverless

```bash
DYNAMODB_TABLE=ai-form-chatbot-dev
NODE_ENV=dev
```

## 📚 Handler Files

### initializeChat.js
Creates new chat session with UUID and saves to DynamoDB.
- **Runtime**: ~2-3 seconds
- **Input**: None
- **Output**: New session with greeting message

### sendMessage.js
Main handler that:
1. Retrieves session from DynamoDB
2. Calls LLM to extract structured data
3. Updates agent state
4. Saves session back to DynamoDB
5. Returns response with updated state

- **Runtime**: ~5-10 seconds
- **Input**: { sessionId, message }
- **Output**: Updated state with bot response

### getState.js
Retrieves existing session state.
- **Runtime**: ~1 second
- **Input**: { sessionId }
- **Output**: Full session state

### resetChat.js
Deletes session and creates new one.
- **Runtime**: ~2-3 seconds
- **Input**: { sessionId }
- **Output**: New session

### listSessions.js
Lists all sessions with DynamoDB scan.
- **Runtime**: ~2-5 seconds (depends on data size)
- **Input**: { limit, exclusiveStartKey }
- **Output**: Array of sessions + pagination token

## 🔌 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| aws-sdk | 2.1406.0 | AWS services (DynamoDB) |
| openai | 6.9.1 | Hugging Face API client |
| uuid | 9.0.0 | Session ID generation |
| serverless | 3.40.0 | Framework (dev) |

## 🧪 Testing

### Test initializeChat
```bash
curl -X POST https://your-api-url/chat/initialize
```

### Test sendMessage
```bash
curl -X POST https://your-api-url/chat/send \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"uuid", "message":"My name is John"}'
```

### View Logs
```bash
npm run logs
```

## 🐛 Troubleshooting

### "Cannot find module 'uuid'"
```bash
npm install
```
Ensure dependencies are installed locally.

### DynamoDB Errors
- Check AWS credentials: `aws sts get-caller-identity`
- Verify IAM permissions in `serverless.yml`
- Check table exists: `aws dynamodb list-tables`

### Lambda Timeout
- Increase timeout in `serverless.yml` (default: 30s)
- Check HF_API_KEY validity
- Monitor CloudWatch logs

### API Gateway CORS Errors
- Verify `cors: true` in all functions in `serverless.yml`
- Check API Gateway CORS configuration

## 📦 Deployment Process

1. **Validate**: Configuration is checked
2. **Package**: Code and dependencies are zipped
3. **Upload**: Deployment package sent to AWS
4. **CloudFormation**: Stack is created/updated
5. **DynamoDB**: Table is created if needed
6. **Lambda**: Functions are deployed
7. **API Gateway**: Endpoints are created

## 🔄 Deployment Stages

### Development
```bash
npm run deploy
```
Deploys to `dev` stage.

### Production
```bash
npm run deploy:prod
```
Deploys to `prod` stage with separate resources.

## 📊 Monitoring

### CloudWatch Logs
```bash
npm run logs
```

View logs in AWS Console:
- Region: us-east-1
- Log Groups: `/aws/lambda/ai-form-chatbot-{stage}-{function-name}`

### Metrics
Monitor in CloudWatch:
- Duration
- Errors
- Throttles
- Concurrency

## 🎯 Performance Optimization

- Lambda memory: 512 MB (default, can be adjusted in `serverless.yml`)
- Database: On-demand billing (scales automatically)
- TTL: 7 days (auto-deletes old sessions)
- API timeout: 30 seconds (configurable)

## 📚 Related Documentation

- [Main README](../README.md) - Monorepo overview
- [Frontend README](../front-end/README.md) - Frontend documentation
- [MONOREPO_SETUP.md](../MONOREPO_SETUP.md) - Detailed setup guide

## 📝 Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Deploy | `npm run deploy` | Deploy to dev |
| Deploy Prod | `npm run deploy:prod` | Deploy to prod |
| Logs | `npm run logs` | Stream Lambda logs |
| Remove | `npm run remove` | Delete deployment |
| Info | `npm run info` | Display deployment info |

## 🤝 Contributing

1. Create feature branch
2. Update handlers/lib files
3. Test with `npm run deploy`
4. Verify with API calls
5. Commit and push
6. Submit PR

## 🔐 Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use IAM roles (not access keys)
- ✅ Enable DynamoDB point-in-time recovery
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Enable CloudTrail logging
- ✅ Use VPC endpoints for DynamoDB (optional)

---

**Last Updated**: December 13, 2025
