const { getChatSession } = require('../lib/dynamodb.js');
const { successResponse, errorResponse } = require('../lib/validators.js');

exports.handler = async function(event) {
    try {
        const { sessionId } = event.pathParameters;

        if (!sessionId) {
            return errorResponse(400, 'Missing sessionId');
        }

        const session = await getChatSession(sessionId);
        if (!session) {
            return errorResponse(404, 'Session not found');
        }

        return successResponse(200, {
            sessionId,
            collectedData: session.collectedData,
            currentSection: session.currentSection,
            completionPercentage: session.completionPercentage,
            updatedAt: session.updatedAt,
        });
    } catch (error) {
        console.error('Error fetching session state:', error);
        return errorResponse(500, 'Failed to fetch session state');
    }
};
