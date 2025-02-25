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

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Grades a question using the API
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
 * @returns Promise that resolves when all questions are processed
 */
export async function processQuestions(
    questions: Question[],
    onProgress?: (results: QuestionResult[]) => void
): Promise<QuestionResult[]> {
    // Initialize results with loading state
    const results: QuestionResult[] = questions.map((question) => ({
        question,
        isLoading: true,
    }));

    // Call onProgress with initial loading state
    if (onProgress) {
        onProgress([...results]);
    }

    // Process questions in parallel
    const processPromises = questions.map(async (question, index) => {
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

    // Wait for all questions to be processed
    await Promise.all(processPromises);

    return results;
} 