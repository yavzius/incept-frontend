import type { QuestionResult } from './questionApi';

const STORAGE_KEY = 'question_grader_results';
const IGNORED_DIMENSIONS_KEY = 'ignored_error_dimensions';

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

/**
 * Saves ignored error dimensions to local storage
 * @param dimensions The error dimensions to ignore
 */
export function saveIgnoredDimensions(dimensions: string[]): void {
    try {
        localStorage.setItem(IGNORED_DIMENSIONS_KEY, JSON.stringify(dimensions));
    } catch (error) {
        console.error('Failed to save ignored dimensions to local storage:', error);
    }
}

/**
 * Retrieves ignored error dimensions from local storage
 * @returns The saved ignored dimensions or an empty array if none exist
 */
export function getIgnoredDimensions(): string[] {
    try {
        const savedDimensions = localStorage.getItem(IGNORED_DIMENSIONS_KEY);
        return savedDimensions ? JSON.parse(savedDimensions) : [];
    } catch (error) {
        console.error('Failed to retrieve ignored dimensions from local storage:', error);
        return [];
    }
}

/**
 * Clears all saved ignored dimensions from local storage
 */
export function clearIgnoredDimensions(): void {
    try {
        localStorage.removeItem(IGNORED_DIMENSIONS_KEY);
    } catch (error) {
        console.error('Failed to clear ignored dimensions from local storage:', error);
    }
} 