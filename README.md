# AI Chatbot Form Application

A modern React chatbot application powered by Google Gemini AI, featuring a beautiful chat interface with real-time message generation.

## Features

- **Start Chat Button**: Clean welcome screen with a prominent "Start Chat" button
- **Real-time Chat Interface**: Beautiful, responsive chat window with message history
- **Google Gemini Integration**: AI-powered responses using Google's Gemini API
- **Error Handling**: Comprehensive error handling for API calls with user-friendly messages
- **Typing Indicator**: Visual feedback while waiting for AI response
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure API Key Management**: API key stored in environment variables, never exposed in frontend

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your Google Gemini API key:
```
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

**Important**: Never commit the `.env` file. Add it to `.gitignore` to prevent accidental exposure of your API key.

## Getting Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API key" in the left panel
4. Create a new API key
5. Copy the API key and add it to your `.env` file

## Running the Application

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

## Building for Production

Create an optimized production build:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ChatWindow.js       # Main chat interface component
│   └── ChatWindow.css      # Chat window styling
├── services/
│   └── geminiService.js    # Google Gemini API integration
├── App.js                  # Main app component with welcome screen
├── App.css                 # App styling
├── index.js                # React entry point
└── index.css               # Global styling

public/
└── index.html              # HTML template
```

## How It Works

1. **Welcome Screen**: User sees the welcome page with a "Start Chat" button
2. **Chat Initialization**: Clicking "Start Chat" displays the chat window with a greeting message
3. **User Messages**: User types a message and clicks send
4. **API Call**: The message is sent to Google Gemini API
5. **Bot Response**: The AI-generated response is displayed in the chat
6. **Conversation Flow**: Users can continue the conversation in real-time

## Error Handling

The application handles various error scenarios:

- **Missing API Key**: Clear error message if environment variable is not set
- **Network Errors**: User-friendly error messages for connection issues
- **Rate Limiting**: Notification when API rate limit is exceeded
- **Invalid Responses**: Graceful handling of unexpected API responses

## Security Considerations

- ✅ API key is stored only in environment variables
- ✅ API key is never sent to client browsers in code
- ✅ `.env` file should be added to `.gitignore`
- ✅ Use environment-specific configurations for different deployments

## Technologies Used

- **React**: UI library
- **Axios**: HTTP client for API calls
- **Google Gemini API**: AI model for chat responses
- **CSS3**: Styling with animations and gradients

## License

This project is open source and available under the MIT License.
