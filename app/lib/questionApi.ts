import axios from 'axios';

// Define the types needed for the question data
export interface Question {
    standard: string;
    statement: string;
    sourceId: number;
    question: string;
    answers: {
        label: string;
        isCorrect: boolean;
    }[];
    difficulty: number;
    referenceText: string;
}

export interface ScoreCardDimension {
    name: string;
    passed: boolean;
    explanation: string;
}

export interface ScoreCard {
    dimensions: ScoreCardDimension[];
    overall_pass: boolean;
}

export interface ApiResponse {
    status: string;
    scorecard: ScoreCard;
}

export interface QuestionResult {
    question: Question;
    response?: ApiResponse;
    isLoading: boolean;
    error?: string;
}

export interface ComparisonResult extends QuestionResult {
    compactResponse?: ApiResponse;
    compactError?: string;
    isCompactLoading: boolean;
    standardResponseTime?: number; // Time in milliseconds for standard API
    compactResponseTime?: number;  // Time in milliseconds for compact API
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Grades a question using the standard API endpoint
 * @param question The question to grade
 * @returns A promise that resolves to the API response
 */
export async function gradeQuestion(question: Question): Promise<ApiResponse> {
    try {
        const response = await axios.post<ApiResponse>(
            `${API_BASE_URL}/questions/grade`,
            question
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Processes an array of questions, grading each one
 * @param questions Array of questions to grade
 * @param onProgress Optional callback to report progress
 * @returns The results array immediately, which will be updated as questions are processed
 */
export function processQuestions(
    questions: Question[],
    onProgress?: (results: QuestionResult[]) => void
): QuestionResult[] {
    // Initialize results with loading state
    const results: QuestionResult[] = questions.map((question) => ({
        question,
        isLoading: true,
    }));

    // Call onProgress with initial loading state
    if (onProgress) {
        onProgress([...results]);
    }

    // Process questions in parallel without blocking
    questions.forEach(async (question, index) => {
        try {
            const response = await gradeQuestion(question);

            // Update the result for this question
            results[index] = {
                question,
                response,
                isLoading: false,
            };

            // Call onProgress with updated results
            if (onProgress) {
                onProgress([...results]);
            }
        } catch (err) {
            // Update the result with error
            results[index] = {
                question,
                isLoading: false,
                error: err instanceof Error ? err.message : 'API request failed',
            };

            // Call onProgress with updated results
            if (onProgress) {
                onProgress([...results]);
            }
        }
    });

    // Return results immediately, they will be updated as processing completes
    return results;
}
