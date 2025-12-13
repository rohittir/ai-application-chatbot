const { listChatSessions } = require('../lib/dynamodb.js');
const { successResponse, errorResponse } = require('../lib/validators.js');

exports.handler = async function(event) {
    try {
        const limit = parseInt(event.queryStringParameters?.limit || '10');
        const exclusiveStartKey = event.queryStringParameters?.exclusiveStartKey
            ? JSON.parse(Buffer.from(event.queryStringParameters.exclusiveStartKey, 'base64').toString())
            : null;

        const result = await listChatSessions(limit, exclusiveStartKey);

        let nextToken = null;
        if (result.lastEvaluatedKey) {
            nextToken = Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64');
        }

        return successResponse(200, {
            sessions: result.items,
            nextToken,
            count: result.items.length,
            limit,
        });
    } catch (error) {
        console.error('Error listing sessions:', error);
        return errorResponse(500, 'Failed to list sessions');
    }
};
