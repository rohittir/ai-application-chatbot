/**
 * Validation utilities for Financial Application
 */

const Validators = {
    /**
     * Validate email address format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate date of birth (must be a valid date and in the past)
     */
    isValidDateOfBirth(dateString) {
        let date;

        // Try ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            date = new Date(dateString);
        }
        // Try DD/MM/YYYY format
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            date = new Date(year, month - 1, day);
        }
        // Try DD-MM-YYYY format
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('-');
            date = new Date(year, month - 1, day);
        }
        // Try MM/DD/YYYY format
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            date = new Date(dateString);
        } else {
            return false;
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return false;
        }

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date >= today) {
            return false;
        }

        // Check if person is at least 18 years old
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        if (date > eighteenYearsAgo) {
            return false;
        }

        return true;
    },

    /**
     * Validate name (at least 2 characters, no special characters)
     */
    isValidName(name) {
        if (!name || typeof name !== 'string') return false;
        // Allow letters, spaces, hyphens, and apostrophes
        const nameRegex = /^[a-zA-Z\s\-']{2,}$/;
        return nameRegex.test(name.trim());
    },

    /**
     * Validate phone number (basic validation)
     */
    isValidPhoneNumber(phone) {
        // Remove common formatting characters
        const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
        // Should have at least 10 digits
        return /^\d{10,}$/.test(cleaned);
    },
};

/**
 * Response helper for Lambda
 */
function successResponse(statusCode, data) {
    return {
        statusCode: statusCode || 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(data),
    };
}

/**
 * Error response helper for Lambda
 */
function errorResponse(statusCode, message) {
    return {
        statusCode: statusCode || 500,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            error: message,
            timestamp: new Date().toISOString(),
        }),
    };
}

module.exports = {
    Validators,
    successResponse,
    errorResponse,
};
