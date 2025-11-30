# Quick Start Guide

## Setup Instructions

1. **Create `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Add your Google Gemini API key**:
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Get your API key and add it to `.env`:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   
   The app will automatically open at `http://localhost:3000`

## How to Use

1. Click the **"Start Chat"** button to begin
2. Type your message in the input field
3. Click **"Send"** or press Enter
4. Wait for the AI to generate a response
5. Continue the conversation!

## Features

✅ Beautiful, responsive chat interface  
✅ Real-time AI responses via Google Gemini  
✅ Typing indicator animation  
✅ Error handling with user-friendly messages  
✅ Secure API key management  
✅ Mobile-friendly design  

## Troubleshooting

**"API key is not configured" error:**
- Make sure `.env` file exists in the root directory
- Verify `REACT_APP_GEMINI_API_KEY` is set correctly
- Restart the development server after creating/updating `.env`

**"Authentication failed" error:**
- Check that your API key is valid
- Visit [Google AI Studio](https://aistudio.google.com/) to verify or regenerate your key

**Slow responses:**
- This is normal depending on the complexity of your query
- The app shows a typing indicator while waiting for the response

## Production Build

To create an optimized production build:
```bash
npm run build
```

The build folder will contain the optimized files ready for deployment.
