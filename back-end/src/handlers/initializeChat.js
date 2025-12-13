const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const { FinancialApplicationAgent } = require('../lib/agent.js');
const { saveChatSession } = require('../lib/dynamodb.js');
const { successResponse, errorResponse } = require('../lib/validators.js');

const openAiClient = new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: process.env.HF_API_KEY,
});

exports.handler = async function(event) {
    try {
        const sessionId = uuidv4();
        const agent = new FinancialApplicationAgent();

        // Save initial session to DynamoDB
        await saveChatSession(sessionId, agent);

        return successResponse(200, {
            sessionId,
            message:
                "Welcome to the Financial Application Portal! 👋\n\nI'm your Application Administrator. I'll help you complete your financial application by collecting your personal, educational, professional, and family information. Let's get started!\n\nWhat is your full name?",
            collectedData: agent.collectedData,
            completionPercentage: 0,
            currentSection: 'personal',
        });
    } catch (error) {
        console.error('Error initializing chat:', error);
        return errorResponse(500, 'Failed to initialize chat session');
    }
};
