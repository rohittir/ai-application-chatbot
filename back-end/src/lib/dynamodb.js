const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.DYNAMODB_TABLE;

/**
 * Save or update a chat session
 */
async function saveChatSession(sessionId, agent) {
    const expiresAt = Math.floor(Date.now() / 1000) + (1 * 24 * 60 * 60); // 1 day

    const params = {
        TableName: tableName,
        Item: {
            sessionId,
            updatedAt: Date.now(),
            expiresAt,
            collectedData: agent.collectedData,
            currentSection: agent.currentSection,
            completionPercentage: agent.getCompletionPercentage(),
        },
    };

    try {
        await dynamodb.put(params).promise();
        return { success: true };
    } catch (error) {
        console.error('Error saving chat session:', error);
        throw new Error('Failed to save chat session');
    }
}

/**
 * Get a chat session
 */
async function getChatSession(sessionId) {
    const params = {
        TableName: tableName,
        Key: {
            sessionId,
        },
    };

    try {
        const result = await dynamodb.get(params).promise();
        return result.Item || null;
    } catch (error) {
        console.error('Error retrieving chat session:', error);
        throw new Error('Failed to retrieve chat session');
    }
}

/**
 * Delete a chat session
 */
async function deleteChatSession(sessionId) {
    const params = {
        TableName: tableName,
        Key: {
            sessionId,
        },
    };

    try {
        await dynamodb.delete(params).promise();
        return { success: true };
    } catch (error) {
        console.error('Error deleting chat session:', error);
        throw new Error('Failed to delete chat session');
    }
}

/**
 * List all chat sessions (paginated)
 */
async function listChatSessions(limit = 10, exclusiveStartKey = null) {
    const params = {
        TableName: tableName,
        Limit: limit,
    };

    if (exclusiveStartKey) {
        params.ExclusiveStartKey = exclusiveStartKey;
    }

    try {
        const result = await dynamodb.scan(params).promise();
        return {
            items: result.Items || [],
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    } catch (error) {
        console.error('Error listing chat sessions:', error);
        throw new Error('Failed to list chat sessions');
    }
}

/**
 * Query sessions by creation date (uses scan with filter)
 */
async function getSessionsByDateRange(startDate, endDate) {
    const params = {
        TableName: tableName,
        FilterExpression: 'createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
            ':start': startDate,
            ':end': endDate,
        },
    };

    try {
        const result = await dynamodb.scan(params).promise();
        return result.Items || [];
    } catch (error) {
        console.error('Error querying sessions by date:', error);
        throw new Error('Failed to query sessions by date');
    }
}

/**
 * Batch save multiple sessions
 */
async function batchSaveSessions(sessions) {
    const writeRequests = sessions.map((session) => ({
        PutRequest: {
            Item: session,
        },
    }));

    // DynamoDB has a limit of 25 items per batch
    const chunks = [];
    for (let i = 0; i < writeRequests.length; i += 25) {
        chunks.push(writeRequests.slice(i, i + 25));
    }

    try {
        for (const chunk of chunks) {
            const params = {
                RequestItems: {
                    [tableName]: chunk,
                },
            };
            await dynamodb.batchWrite(params).promise();
        }
        return { success: true };
    } catch (error) {
        console.error('Error batch saving sessions:', error);
        throw new Error('Failed to batch save sessions');
    }
}

module.exports = {
    saveChatSession,
    getChatSession,
    deleteChatSession,
    listChatSessions,
    getSessionsByDateRange,
    batchSaveSessions,
};
