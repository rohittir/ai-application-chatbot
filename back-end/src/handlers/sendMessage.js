const { OpenAI } = require('openai');
const { FinancialApplicationAgent } = require('../lib/agent.js');
const { getChatSession, saveChatSession } = require('../lib/dynamodb.js');
const { successResponse, errorResponse } = require('../lib/validators.js');

const openAiClient = new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: process.env.HF_API_KEY,
});

exports.handler = async function(event) {
    try {
        const body = JSON.parse(event.body);
        const { sessionId, message } = body;

        if (!sessionId || !message) {
            return errorResponse(400, 'Missing sessionId or message');
        }

        // Retrieve session from DynamoDB
        const session = await getChatSession(sessionId);
        if (!session) {
            return errorResponse(404, 'Session not found');
        }

        // Restore agent state
        const agent = new FinancialApplicationAgent(session);

        // Update collected data using LLM extraction
        await agent.updateCollectedDataWithLLM(message, openAiClient);

        // Prepare messages for API - only current message
        const messages = [
            {
                role: 'system',
                content: agent.getSystemPrompt(),
            },
            {
                role: 'user',
                content: message,
            },
        ];

        // Call LLM for response
        const response = await openAiClient.chat.completions.create({
            model: 'moonshotai/Kimi-K2-Instruct-0905',
            messages: messages,
            temperature: 0.7,
            max_tokens: 300,
            top_p: 0.9,
        });

        const botMessage = response.choices[0].message.content;

        // Check if current section is complete
        let sectionComplete = false;
        let applicationComplete = false;

        if (agent.isCurrentSectionComplete() && agent.currentSection !== 'family') {
            const sectionName = agent.currentSection;
            const hasNext = agent.moveToNextSection();

            if (hasNext) {
                sectionComplete = true;
            }
        }

        // Check if all sections complete
        if (agent.currentSection === 'family' && agent.isCurrentSectionComplete()) {
            applicationComplete = true;
        }

        // Save updated session to DynamoDB
        await saveChatSession(sessionId, agent);

        const responseData = {
            sessionId,
            message: botMessage,
            collectedData: agent.collectedData,
            completionPercentage: agent.getCompletionPercentage(),
            currentSection: agent.currentSection,
            sectionComplete,
            applicationComplete,
        };

        if (applicationComplete) {
            responseData.summary = agent.getSummary();
        }

        return successResponse(200, responseData);
    } catch (error) {
        console.error('Error processing message:', error);

        if (error.status === 401) {
            return errorResponse(401, 'Authentication failed. Check your API key.');
        } else if (error.status === 429) {
            return errorResponse(429, 'Rate limit exceeded. Please try again later.');
        }

        return errorResponse(500, 'Failed to process your request');
    }
};
