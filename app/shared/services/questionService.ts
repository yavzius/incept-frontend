import axios from 'axios';
import type { Question, QuestionResult } from '../../lib/questionApi';

// Define the API response structure for the list endpoint
interface ApiListResponse {
    success: boolean;
    message: string;
    data: ApiQuestion[];
}

// Define the structure of a question from the API
interface ApiQuestion {
    id: number;
    standard: string;
    statement: string;
    sourceId: number | null;
    sourceName: string;
    question: string;
    answers: {
        label: string;
        isCorrect: boolean;
        content: Record<string, any>;
    }[];
    difficulty: number;
    referenceText: string;
    content: Record<string, any>;
    created_at: string;
    gradings: ApiGrading[];
}

// Define the structure of a grading from the API
interface ApiGrading {
    id: number;
    question_id: number;
    overall_pass: boolean;
    graded_at: string;
    api_response: {
        status: string;
        scorecard: {
            dimensions: {
                name: string;
                passed: boolean;
                explanation: string;
            }[];
            overall_pass: boolean;
        };
    };
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Fetches all questions from the API
 * @returns A promise that resolves to an array of QuestionResult objects
 */
export async function fetchQuestions(): Promise<QuestionResult[]> {
    try {
        const response = await axios.get<ApiListResponse>(`${API_BASE_URL}/questions/list`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch questions');
        }

        // Transform API questions to QuestionResult format
        const results: QuestionResult[] = response.data.data.map(apiQuestion => {
            // Convert API question to our Question format
            const question: Question = {
                standard: apiQuestion.standard,
                statement: apiQuestion.statement,
                sourceId: apiQuestion.sourceId || 0,
                question: apiQuestion.question,
                answers: apiQuestion.answers.map(answer => ({
                    label: answer.label,
                    isCorrect: answer.isCorrect
                })),
                difficulty: apiQuestion.difficulty,
                referenceText: apiQuestion.referenceText || ''
            };

            // If the question has gradings, use the most recent one
            if (apiQuestion.gradings && apiQuestion.gradings.length > 0) {
                // Sort gradings by date (newest first)
                const sortedGradings = [...apiQuestion.gradings].sort(
                    (a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime()
                );

                const latestGrading = sortedGradings[0];

                return {
                    question,
                    response: latestGrading.api_response,
                    isLoading: false
                };
            }

            // If no gradings, return just the question
            return {
                question,
                isLoading: false
            };
        });

        return results;
    } catch (error) {
        console.error('Error fetching questions:', error);
        throw error;
    }
} 