const { FinancialApplicationAgent } = require('../lib/agent.js');
const { deleteChatSession, saveChatSession } = require('../lib/dynamodb.js');
const { successResponse, errorResponse } = require('../lib/validators.js');

exports.handler = async function(event) {
    try {
        const { sessionId } = event.pathParameters;

        if (!sessionId) {
            return errorResponse(400, 'Missing sessionId');
        }

        // Delete old session
        await deleteChatSession(sessionId);

        // Create new agent
        const agent = new FinancialApplicationAgent();

        // Save new session
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
        console.error('Error resetting chat:', error);
        return errorResponse(500, 'Failed to reset chat session');
    }
};
