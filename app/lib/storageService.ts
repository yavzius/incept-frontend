import type { QuestionResult } from './questionApi';

const STORAGE_KEY = 'question_grader_results';

/**
 * Saves question results to local storage
 * @param results The results to save
 */
export function saveResults(results: QuestionResult[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
        console.error('Failed to save results to local storage:', error);
    }
}

/**
 * Retrieves question results from local storage
 * @returns The saved results or an empty array if none exist
 */
export function getResults(): QuestionResult[] {
    try {
        const savedResults = localStorage.getItem(STORAGE_KEY);
        return savedResults ? JSON.parse(savedResults) : [];
    } catch (error) {
        console.error('Failed to retrieve results from local storage:', error);
        return [];
    }
}

/**
 * Clears all saved results from local storage
 */
export function clearResults(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear results from local storage:', error);
    }
} 