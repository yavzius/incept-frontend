import { useState } from 'react';
import type { FilterType, QuestionResult } from '../types';

export function useFilter() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Toggle filter function
    const toggleFilter = (filterType: FilterType) => {
        setActiveFilter((prev) => (prev === filterType ? 'all' : filterType));
    };

    // Function to filter results based on the active filter and ignored dimensions
    const filterResults = (
        results: QuestionResult[],
        ignoredDimensions: string[]
    ): QuestionResult[] => {
        // Helper function to check if a question has errors that aren't ignored
        const hasRelevantErrors = (result: QuestionResult) => {
            if (result.isLoading) return false;
            if (result.error) return true;

            if (result.response && !result.response.scorecard.overall_pass) {
                // Check if there are any failing dimensions that aren't ignored
                return result.response.scorecard.dimensions.some(
                    (dim) => !dim.passed && !ignoredDimensions.includes(dim.name)
                );
            }

            return false;
        };

        switch (activeFilter) {
            case 'errors':
                return results.filter(hasRelevantErrors);
            case 'success':
                return results.filter(
                    (result) => !result.isLoading && !hasRelevantErrors(result)
                );
            case 'loading':
                return results.filter((result) => result.isLoading);
            case 'all':
            default:
                return results;
        }
    };

    // Function to get counts for each filter type
    const getFilterCounts = (
        results: QuestionResult[],
        ignoredDimensions: string[]
    ) => {
        // Helper function to check if a question has errors that aren't ignored
        const hasRelevantErrors = (result: QuestionResult) => {
            if (result.isLoading) return false;
            if (result.error) return true;

            if (result.response && !result.response.scorecard.overall_pass) {
                // Check if there are any failing dimensions that aren't ignored
                return result.response.scorecard.dimensions.some(
                    (dim) => !dim.passed && !ignoredDimensions.includes(dim.name)
                );
            }

            return false;
        };

        // Count of error questions (excluding ignored dimensions)
        const errorCount = results.filter(hasRelevantErrors).length;

        // Count of loading questions
        const loadingCount = results.filter((result) => result.isLoading).length;

        // Count of success questions (now includes questions with only ignored errors)
        const successCount = results.length - errorCount - loadingCount;

        return {
            errorCount,
            loadingCount,
            successCount
        };
    };

    return {
        activeFilter,
        toggleFilter,
        filterResults,
        getFilterCounts
    };
} 