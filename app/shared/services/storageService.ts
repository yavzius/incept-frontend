const IGNORED_DIMENSIONS_KEY = 'ignored_error_dimensions';

/**
 * Saves ignored error dimensions to localStorage
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
 * Retrieves ignored error dimensions from localStorage
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
 * Clears all saved ignored dimensions from localStorage
 */
export function clearIgnoredDimensions(): void {
    try {
        localStorage.removeItem(IGNORED_DIMENSIONS_KEY);
    } catch (error) {
        console.error('Failed to clear ignored dimensions from local storage:', error);
    }
} 