import { OpenAI } from 'openai';

/**
 * Get the API key from window (set during app initialization)
 */
const getApiKey = () => {
    return window.REACT_APP_HF_API_KEY || process.env.REACT_APP_HF_API_KEY;
};

/**
 * Initialize OpenAI client with current API key
 */
const getOpenAIClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('No API key configured. Please set your Hugging Face API key.');
    }
    
    return new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true 
    });
};

/**
 * Validation utilities
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
        // Try to parse various date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, etc.
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
        }
        else {
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
    }
};

/**
 * AI Agent State Manager for Financial Application
 * Tracks user information across different categories
 */
class FinancialApplicationAgent {
    constructor() {
        this.conversationHistory = [];
        this.collectedData = {
            personal: {
                firstName: null,
                middleName: null, // Optional field
                lastName: null,
                email: null,
                emailConfirmed: false,
                phoneNumber: null,
                dateOfBirth: null,
                dobConfirmed: false,
                nationality: null
            },
            educational: {
                highestQualification: null,
                university: null,
                fieldOfStudy: null,
                graduationYear: null
            },
            professional: {
                currentDesignation: null,
                company: null,
                yearsOfExperience: null,
                annualIncome: null,
                employmentType: null
            },
            family: {
                maritalStatus: null,
                dependents: null,
                spouseName: null,
                emergencyContact: null
            }
        };
        this.currentSection = 'personal';
        this.questionsAsked = {};
        this.completionPercentage = 0;
    }

    /**
     * Get the system prompt for the AI agent
     */
    getSystemPrompt() {
        const personalStatus = this.collectedData.personal;
        let missingPersonal = [];
        if (!personalStatus.firstName) missingPersonal.push('first name');
        if (!personalStatus.lastName) missingPersonal.push('last name');
        if (!personalStatus.email) missingPersonal.push('email');
        if (!personalStatus.phoneNumber) missingPersonal.push('phone number');
        if (!personalStatus.dateOfBirth) missingPersonal.push('date of birth');
        if (!personalStatus.nationality) missingPersonal.push('nationality');

        return `You are a professional and friendly Financial Application Administrator. Your role is to collect detailed information from applicants for their financial application.

You are currently collecting: ${this.currentSection} information.

Already collected data:
${JSON.stringify(this.collectedData, null, 2)}

Your responsibilities:
1. Ask questions one at a time to gather ${this.currentSection} information
2. Be professional but conversational in tone
3. Validate responses and ask for clarification if needed
4. Move to the next section when all current section questions are answered
5. Provide a summary when all sections are complete
6. Extract and track structured information from user responses

Current section details:
- Personal: First Name (required), Middle Name (optional), Last Name (required), Email (required - must be valid), Phone Number (required - 10+ digits), Date of Birth (required - must be 18+ years old, valid date), Nationality (required)
- Educational: Highest qualification, university, field of study, graduation year
- Professional: Current designation, company, years of experience, annual income, employment type
- Family: Marital status, number of dependents, spouse name, emergency contact

Validation Rules for Personal Section:
- Email: Must be in valid format (e.g., user@example.com)
- Date of Birth: Must be in format YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY. Person must be at least 18 years old. Date must be in the past.
- Phone Number: Should have at least 10 digits
- Names: Should contain only letters, hyphens, and apostrophes (2+ characters)
- Middle Name is optional - if user doesn't have one, proceed with first and last name

Guidelines:
- Ask 1-2 questions at a time
- Be encouraging and professional
- If user provides partial information, ask for clarification
- When collecting names, ask separately: "What is your first name?", "Do you have a middle name? (optional)", "What is your last name?"
- For email, validate format and ask user to confirm
- For date of birth, ask in YYYY-MM-DD format and validate age (must be 18+)
- For phone, validate it has enough digits
- When a section is complete, let user know and move to the next
- At the end, provide a summary of all collected information

Respond naturally and conversationally while collecting structured data.`;
    }

    /**
     * Check if all required fields in current section are complete
     */
    isCurrentSectionComplete() {
        const sectionData = this.collectedData[this.currentSection];
        
        if (this.currentSection === 'personal') {
            // For personal section, middle name is optional
            return (
                sectionData.firstName !== null &&
                sectionData.lastName !== null &&
                sectionData.email !== null &&
                sectionData.emailConfirmed === true &&
                sectionData.phoneNumber !== null &&
                sectionData.dateOfBirth !== null &&
                sectionData.dobConfirmed === true &&
                sectionData.nationality !== null
            );
        }
        
        // For other sections, all fields must be filled
        return Object.entries(sectionData).every(([key, value]) => {
            // Skip confirmation fields
            if (key.includes('Confirmed')) return true;
            return value !== null;
        });
    }

    /**
     * Get missing fields in current section
     */
    getMissingFields() {
        const sectionData = this.collectedData[this.currentSection];
        return Object.keys(sectionData).filter(key => sectionData[key] === null);
    }

    /**
     * Move to next section
     */
    moveToNextSection() {
        const sections = ['personal', 'educational', 'professional', 'family'];
        const currentIndex = sections.indexOf(this.currentSection);
        if (currentIndex < sections.length - 1) {
            this.currentSection = sections[currentIndex + 1];
            return true;
        }
        return false;
    }

    /**
     * Update collected data based on conversation
     */
    updateCollectedData(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        const sectionData = this.collectedData[this.currentSection];

        if (this.currentSection === 'personal') {
            // Email extraction and validation
            const emailMatch = userMessage.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
            if (emailMatch) {
                const email = emailMatch[0];
                if (Validators.isValidEmail(email)) {
                    sectionData.email = email;
                    sectionData.emailConfirmed = true;
                }
            }

            // Phone number extraction and validation
            const phoneMatch = userMessage.match(/[\d\s\-\+\(\)]{10,}/);
            if (phoneMatch) {
                const phone = phoneMatch[0];
                if (Validators.isValidPhoneNumber(phone)) {
                    sectionData.phoneNumber = phone;
                }
            }

            // Date of birth extraction and validation
            const dobPatterns = [
                /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
                /(\d{1,2}\/\d{1,2}\/\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
                /(\d{1,2}-\d{1,2}-\d{4})/   // DD-MM-YYYY
            ];
            
            for (let pattern of dobPatterns) {
                const match = userMessage.match(pattern);
                if (match && Validators.isValidDateOfBirth(match[0])) {
                    sectionData.dateOfBirth = match[0];
                    sectionData.dobConfirmed = true;
                    break;
                }
            }

            // Extract first name (look for first word that's a valid name)
            if (!sectionData.firstName) {
                const words = userMessage.split(/[\s,]/).filter(w => w.length > 0);
                for (let word of words) {
                    if (Validators.isValidName(word) && word.length > 2) {
                        sectionData.firstName = word;
                        break;
                    }
                }
            }

            // Extract middle name if first name exists but middle name doesn't
            if (sectionData.firstName && !sectionData.middleName) {
                const words = userMessage.split(/[\s,]/).filter(w => w.length > 0);
                let foundFirst = false;
                for (let word of words) {
                    if (foundFirst && Validators.isValidName(word) && word !== sectionData.firstName) {
                        // Check if this might be a middle name (between first and last)
                        sectionData.middleName = word;
                        break;
                    }
                    if (word === sectionData.firstName) {
                        foundFirst = true;
                    }
                }
            }

            // Extract last name (usually the last valid name word)
            if (!sectionData.lastName) {
                const words = userMessage.split(/[\s,]/).filter(w => w.length > 0).reverse();
                for (let word of words) {
                    if (Validators.isValidName(word) && word !== sectionData.firstName && word !== sectionData.middleName) {
                        sectionData.lastName = word;
                        break;
                    }
                }
            }

            // Nationality extraction
            if (!sectionData.nationality) {
                // Look for common nationality keywords
                const nationalityKeywords = ['british', 'american', 'canadian', 'indian', 'french', 'german', 'spanish', 'australian', 'nigerian', 'jamaican'];
                for (let keyword of nationalityKeywords) {
                    if (lowerMessage.includes(keyword)) {
                        const match = userMessage.match(new RegExp(keyword, 'i'));
                        sectionData.nationality = match[0];
                        break;
                    }
                }
                // If no keyword found, try to extract any capitalized word that might be a nationality
                if (!sectionData.nationality) {
                    const words = userMessage.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g) || [];
                    if (words.length > 0) {
                        // Get the last capitalized word that's not a name we already have
                        for (let i = words.length - 1; i >= 0; i--) {
                            if (words[i] !== sectionData.firstName && words[i] !== sectionData.lastName) {
                                sectionData.nationality = words[i];
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (this.currentSection === 'professional') {
            // Income pattern
            if (/\d+[kK]|\d+,?\d{3}/.test(userMessage)) {
                sectionData.annualIncome = userMessage.match(/\d+[kK]|\d+,?\d{3}/)?.[0];
            }
            // Years of experience
            if (/\d+\s*(?:years?|yrs?)/.test(userMessage)) {
                sectionData.yearsOfExperience = userMessage.match(/\d+/)?.[0];
            }
        }
    }

    /**
     * Get completion percentage
     */
    getCompletionPercentage() {
        const sections = ['personal', 'educational', 'professional', 'family'];
        let totalFields = 0;
        let completedFields = 0;

        sections.forEach(section => {
            const sectionData = this.collectedData[section];
            Object.values(sectionData).forEach(value => {
                totalFields++;
                if (value !== null) completedFields++;
            });
        });

        return Math.round((completedFields / totalFields) * 100);
    }

    /**
     * Get summary of collected data
     */
    getSummary() {
        let summary = "📋 **Application Summary**\n\n";
        
        Object.entries(this.collectedData).forEach(([section, data]) => {
            summary += `**${section.charAt(0).toUpperCase() + section.slice(1)} Information:**\n`;
            Object.entries(data).forEach(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                summary += `- ${label}: ${value || 'Not provided'}\n`;
            });
            summary += '\n';
        });

        return summary;
    }
}

// Global agent instance
let agent = new FinancialApplicationAgent();

/**
 * Initialize the AI agent
 */
export const initializeAgent = () => {
    agent = new FinancialApplicationAgent();
    agent.conversationHistory = [];
    return {
        message: "Welcome to the Financial Application Portal! 👋\n\nI'm your Application Administrator. I'll help you complete your financial application by collecting your personal, educational, professional, and family information. Let's get started!\n\nWhat is your full name?",
        collectedData: agent.collectedData,
        completionPercentage: 0,
        currentSection: 'personal'
    };
};

/**
 * Get agent state
 */
export const getAgentState = () => {
    return {
        collectedData: agent.collectedData,
        currentSection: agent.currentSection,
        completionPercentage: agent.getCompletionPercentage(),
        missingFields: agent.getMissingFields()
    };
};

/**
 * Generate AI agent response using Hugging Face model
 * @param {string} userMessage - The user's message
 * @returns {Promise<Object>} - Response object with message and metadata
 */
export const generateAgentResponse = async (userMessage) => {
    try {
        // Update collected data based on user message
        agent.updateCollectedData(userMessage);

        // Add user message to history
        agent.conversationHistory.push({
            role: "user",
            content: userMessage
        });

        // Prepare messages for API
        const messages = [
            {
                role: "system",
                content: agent.getSystemPrompt()
            },
            ...agent.conversationHistory
        ];

        // Get OpenAI client with current API key
        const openAi = getOpenAIClient();

        // Call Hugging Face API with Kimi model
        const response = await openAi.chat.completions.create({
            model: "moonshotai/Kimi-K2-Instruct-0905",
            messages: messages,
            temperature: 0.7,
            max_tokens: 300,
            top_p: 0.9
        });

        const botMessage = response.choices[0].message.content;
        
        // Add bot response to history
        agent.conversationHistory.push({
            role: "assistant",
            content: botMessage
        });

        // Check if current section is complete
        if (agent.isCurrentSectionComplete() && agent.currentSection !== 'family') {
            const sectionName = agent.currentSection;
            const hasNext = agent.moveToNextSection();
            
            if (hasNext) {
                return {
                    message: `${botMessage}\n\n✅ Great! We've completed your ${sectionName} information. Now let's move to your ${agent.currentSection} details.`,
                    collectedData: agent.collectedData,
                    completionPercentage: agent.getCompletionPercentage(),
                    currentSection: agent.currentSection,
                    sectionComplete: true
                };
            }
        }

        // Check if all sections complete
        if (agent.currentSection === 'family' && agent.isCurrentSectionComplete()) {
            return {
                message: `${botMessage}\n\n🎉 **Application Complete!**\n\n${agent.getSummary()}\n\nThank you for completing your financial application. We'll review your information and get back to you soon!`,
                collectedData: agent.collectedData,
                completionPercentage: 100,
                currentSection: agent.currentSection,
                applicationComplete: true,
                summary: agent.getSummary()
            };
        }

        return {
            message: botMessage,
            collectedData: agent.collectedData,
            completionPercentage: agent.getCompletionPercentage(),
            currentSection: agent.currentSection,
            sectionComplete: false
        };

    } catch (error) {
        console.error('Error calling Hugging Face API:', error);

        // Provide a user-friendly error message
        if (error.response) {
            if (error.response.status === 400) {
                throw new Error('Invalid request. Please try again with valid information.');
            } else if (error.response.status === 401) {
                throw new Error('Authentication failed. API key is invalid.');
            } else if (error.response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
        }

        throw new Error('Failed to process your request. Please try again.');
    }
};

/**
 * Reset the agent
 */
export const resetAgent = () => {
    agent = new FinancialApplicationAgent();
    return initializeAgent();
};

/**
 * Backward compatibility - kept for reference
 */
export const generateGeminiResponse = async (userMessage) => {
    const response = await generateAgentResponse(userMessage);
    return response.message;
};
