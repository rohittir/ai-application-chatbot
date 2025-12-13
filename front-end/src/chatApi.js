/**
 * Chat API service - calls Lambda endpoints
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://jgdd5wzq3k.execute-api.us-east-1.amazonaws.com/dev';

export async function initializeChat() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to initialize chat');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error initializing chat:', error);
        throw error;
    }
}

export async function sendMessage(sessionId, message) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

export async function getSessionState(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/state/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch session state');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching session state:', error);
        throw error;
    }
}

export async function resetChat(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/reset/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to reset chat');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error resetting chat:', error);
        throw error;
    }
}

export async function listSessions(limit = 10, nextToken = null) {
    try {
        let url = `${API_BASE_URL}/chat/sessions?limit=${limit}`;
        if (nextToken) {
            url += `&exclusiveStartKey=${nextToken}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to list sessions');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error listing sessions:', error);
        throw error;
    }
}
