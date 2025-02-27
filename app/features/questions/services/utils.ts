import type { Question, QuestionResult } from '../types';
import { gradeQuestion } from './api';

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