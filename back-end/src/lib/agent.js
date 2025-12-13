const { Validators } = require('./validators.js');

/**
 * AI Agent State Manager for Financial Application
 * Tracks user information across different categories
 */
class FinancialApplicationAgent {
    constructor(initialData = null) {
        if (initialData) {
            // Restore from persisted data
            this.collectedData = initialData.collectedData;
            this.currentSection = initialData.currentSection;
            this.createdAt = initialData.createdAt;
        } else {
            // New agent
            this.collectedData = {
                personal: {
                    firstName: null,
                    middleName: null,
                    lastName: null,
                    email: null,
                    emailConfirmed: false,
                    phoneNumber: null,
                    dateOfBirth: null,
                    dobConfirmed: false,
                    nationality: null,
                },
                educational: {
                    highestQualification: null,
                    university: null,
                    fieldOfStudy: null,
                    graduationYear: null,
                },
                professional: {
                    currentDesignation: null,
                    company: null,
                    yearsOfExperience: null,
                    annualIncome: null,
                    employmentType: null,
                },
                family: {
                    maritalStatus: null,
                    dependents: null,
                    spouseName: null,
                    emergencyContact: null,
                },
            };
            this.currentSection = 'personal';
            this.createdAt = Date.now();
        }
    }

    /**
     * Get the system prompt for the AI agent
     */
    getSystemPrompt() {
        const missingFields = this.getMissingFields();

        let sectionDetails = '';
        let validationRules = '';
        let guidelines = '';

        if (this.currentSection === 'personal') {
            sectionDetails = `
Current Section Fields:
- First Name (required) - Must be 2+ characters, letters only
- Middle Name (optional) - If applicable
- Last Name (required) - Must be 2+ characters, letters only
- Email (required) - Must be in valid format (e.g., user@example.com)
- Phone Number (required) - Must have at least 10 digits
- Date of Birth (required) - Must be 18+ years old and in the past
- Nationality (required) - Applicant's country of citizenship

Missing Fields: ${missingFields.filter(f => !f.includes('Confirmed')).join(', ') || 'None'}`;

            validationRules = `
Validation Rules:
- Email: Must contain @ and a valid domain (e.g., user@example.com)
- Date of Birth: Accept formats YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY. Verify person is 18+ years old.
- Phone Number: Accept with or without formatting. Minimum 10 digits.
- Names: Only letters, hyphens, and apostrophes. Minimum 2 characters each.
- Middle Name: Optional - if user says they don't have one, mark as optional and proceed.`;

            guidelines = `
Personal Section Guidelines:
- Ask names separately: first, then middle (optional), then last
- For email, confirm the format is correct before accepting
- For DOB, explain the format needed and verify age compliance
- For phone, accept common formats (+1-234-567-8900, etc.)
- Be warm and encouraging while collecting sensitive personal information`;
        } else if (this.currentSection === 'educational') {
            sectionDetails = `
Current Section Fields:
- Highest Qualification (required) - e.g., High School, Bachelor's, Master's, PhD
- University (required) - Name of the institution attended
- Field of Study (required) - e.g., Computer Science, Business Administration
- Graduation Year (required) - Year of graduation (YYYY format)

Missing Fields: ${missingFields.filter(f => !f.includes('Confirmed')).join(', ') || 'None'}`;

            validationRules = `
Validation Rules:
- Highest Qualification: Accept standard education levels
- University: Accept any legitimate educational institution name
- Field of Study: Accept any valid academic field
- Graduation Year: Should be a valid year (1950-2025), preferably in the past or current year`;

            guidelines = `
Educational Section Guidelines:
- Ask one question at a time about educational background
- Accept online degrees and certifications
- If continuing education, accept "In Progress" for current studies
- Be flexible with naming conventions for fields of study
- Validate that graduation year is reasonable based on their age`;
        } else if (this.currentSection === 'professional') {
            sectionDetails = `
Current Section Fields:
- Current Designation (required) - Job title or role
- Company (required) - Name of current/last employer
- Years of Experience (required) - Total professional experience
- Annual Income (required) - Gross annual income
- Employment Type (required) - Full-time, Part-time, Self-employed, Contract, etc.

Missing Fields: ${missingFields.filter(f => !f.includes('Confirmed')).join(', ') || 'None'}`;

            validationRules = `
Validation Rules:
- Current Designation: Accept any job title
- Company: Accept any business or organization name
- Years of Experience: Accept whole numbers (0, 1, 2, etc.) or ranges
- Annual Income: Accept numbers with K suffix (50K, 100K) or full amounts
- Employment Type: Validate against standard employment types`;

            guidelines = `
Professional Section Guidelines:
- Be respectful of employment situations (unemployed, students, etc.)
- For income, clarify if it's gross or net (use gross)
- Accept various income formats and normalize to standard format
- Years of experience should be reasonable relative to age
- Ask clarifying questions if employment situation is unclear`;
        } else if (this.currentSection === 'family') {
            sectionDetails = `
Current Section Fields:
- Marital Status (required) - Single, Married, Divorced, Widowed, etc.
- Dependents (required) - Number of dependent family members
- Spouse Name (optional) - Name if married
- Emergency Contact (required) - Name and relationship of emergency contact

Missing Fields: ${missingFields.filter(f => !f.includes('Confirmed')).join(', ') || 'None'}`;

            validationRules = `
Validation Rules:
- Marital Status: Validate against standard marital status options
- Dependents: Accept whole numbers (0, 1, 2, etc.)
- Spouse Name: Required only if married, follows name validation rules
- Emergency Contact: Should include name and relationship`;

            guidelines = `
Family Section Guidelines:
- Be sensitive when asking about family structure
- Accept all marital statuses without judgment
- Clarify if dependents include children, elderly parents, etc.
- Emergency contact should be someone who can be reached quickly
- Confirm relationship to ensure appropriate emergency contact`;
        }

        return `You are a professional and friendly Financial Application Administrator. Your role is to collect detailed information from applicants for their financial application.

You are currently collecting: ${this.currentSection.toUpperCase()} information.

Already collected data:
${JSON.stringify(this.collectedData, null, 2)}

Your responsibilities:
1. Ask questions one at a time to gather ${this.currentSection} information
2. Be professional but conversational in tone
3. Validate responses and ask for clarification if needed
4. Focus on collecting missing fields: ${missingFields.filter(f => !f.includes('Confirmed')).join(', ') || 'all fields are optional'}
5. Move to the next section when all current section questions are answered
6. Provide a summary when all sections are complete
7. Extract and track structured information from user responses

${sectionDetails}

${validationRules}

General Guidelines:
- Ask 1-2 questions at a time
- Be encouraging and professional
- If user provides partial information, ask for clarification
- When a section is complete, let user know and move to the next
- At the end, provide a comprehensive summary of all collected information
- Adapt your tone to the current section being discussed

${guidelines}

Respond naturally and conversationally while collecting structured data.`;
    }

    /**
     * Check if all required fields in current section are complete
     */
    isCurrentSectionComplete() {
        const sectionData = this.collectedData[this.currentSection];

        if (this.currentSection === 'personal') {
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

        return Object.entries(sectionData).every(([key, value]) => {
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
     * Use LLM to extract field values from user message
     */
    async updateCollectedDataWithLLM(userMessage, openAiClient) {
        const sectionData = this.collectedData[this.currentSection];
        const missingFields = this.getMissingFields();

        if (missingFields.length === 0) {
            return;
        }

        try {
            const extractionPrompt = `You are a data extraction assistant. Extract structured information from the user's message.

Current section: ${this.currentSection}
Missing fields to extract from: ${missingFields.join(', ')}

User message: "${userMessage}"

Your task: Analyze the user's message and extract values for any missing fields. Return ONLY a valid JSON object with extracted values. Use null for fields not mentioned.

Expected format based on section:
${
    this.currentSection === 'personal'
        ? `{
  "firstName": "string or null",
  "middleName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phoneNumber": "string or null",
  "dateOfBirth": "string or null",
  "nationality": "string or null"
}`
        : this.currentSection === 'educational'
        ? `{
  "highestQualification": "string or null",
  "university": "string or null",
  "fieldOfStudy": "string or null",
  "graduationYear": "string or null"
}`
        : this.currentSection === 'professional'
        ? `{
  "currentDesignation": "string or null",
  "company": "string or null",
  "yearsOfExperience": "string or null",
  "annualIncome": "string or null",
  "employmentType": "string or null"
}`
        : `{
  "maritalStatus": "string or null",
  "dependents": "string or null",
  "spouseName": "string or null",
  "emergencyContact": "string or null"
}`
}

Return ONLY the JSON object, no additional text.`;

            const response = await openAiClient.chat.completions.create({
                model: 'moonshotai/Kimi-K2-Instruct-0905',
                messages: [
                    {
                        role: 'user',
                        content: extractionPrompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 500,
            });

            const extractedText = response.choices[0].message.content.trim();

            let extractedData = {};
            try {
                extractedData = JSON.parse(extractedText);
            } catch (e) {
                const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                }
            }

            this.validateAndStoreExtractedData(extractedData);
        } catch (error) {
            console.error('Error extracting data with LLM:', error);
        }
    }

    /**
     * Validate and store extracted data
     */
    validateAndStoreExtractedData(extractedData) {
        const sectionData = this.collectedData[this.currentSection];

        Object.entries(extractedData).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }

            if (!sectionData.hasOwnProperty(key)) {
                return;
            }

            if (sectionData[key] !== null) {
                return;
            }

            value = String(value).trim();

            switch (key) {
                case 'email':
                    if (Validators.isValidEmail(value)) {
                        sectionData[key] = value;
                        sectionData.emailConfirmed = true;
                    }
                    break;

                case 'phoneNumber':
                    if (Validators.isValidPhoneNumber(value)) {
                        sectionData[key] = value;
                    }
                    break;

                case 'dateOfBirth':
                    if (Validators.isValidDateOfBirth(value)) {
                        sectionData[key] = value;
                        sectionData.dobConfirmed = true;
                    }
                    break;

                case 'firstName':
                case 'lastName':
                case 'middleName':
                case 'spouseName':
                    if (Validators.isValidName(value)) {
                        sectionData[key] = value;
                    }
                    break;

                case 'emergencyContact':
                    if (value.length >= 3) {
                        sectionData[key] = value;
                    }
                    break;

                case 'yearsOfExperience':
                    const numMatch = value.match(/\d+/);
                    if (numMatch) {
                        sectionData[key] = numMatch[0];
                    } else if (!isNaN(value)) {
                        sectionData[key] = value;
                    }
                    break;

                default:
                    if (value && value.length > 0) {
                        sectionData[key] = value;
                    }
            }
        });
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
        let summary = '📋 **Application Summary**\n\n';

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

module.exports = { FinancialApplicationAgent };
