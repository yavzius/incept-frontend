import { useState, useEffect } from 'react';
import type { QuestionResult } from '../types';
import { fetchQuestions } from '../../../shared/services/questionService';

export function useQuestions() {
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [refreshingIndices, setRefreshingIndices] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load results from API and local storage on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // First try to fetch questions from the API
                const apiResults = await fetchQuestions();

                if (apiResults.length > 0) {
                    setResults(apiResults);
                }
            } catch (err) {
                console.error('Error loading questions:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to load questions'
                );
            } finally {
                setIsLoading(false);
            }

        };

        loadData();


    }, []);

    // Function to manually refresh questions from the API
    const handleRefreshFromAPI = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const apiResults = await fetchQuestions();
            setResults(apiResults);
        } catch (err) {
            console.error('Error refreshing questions from API:', err);
            setError(
                err instanceof Error ? err.message : 'Failed to refresh questions'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Function to clear all results
    const handleClearResults = () => {
        setResults([]);
    };

    // Function to cancel processing
    const handleCancelProcessing = () => {
        setIsProcessing(false);
    };

    // Function to retry questions
    const handleRetryQuestions = (questionsToRetry: QuestionResult[]) => {
        if (questionsToRetry.length === 0 || isProcessing) return;

        // Extract just the question strings from the QuestionResult objects
        const questionStrings = questionsToRetry.map(result => result.question);

        // Create a map to track which questions are being retried
        const retryMap = new Map();
        questionsToRetry.forEach((result) => {
            // Find the index in the original results array
            const index = results.findIndex((r) => r.question === result.question);
            if (index !== -1) {
                retryMap.set(index, true);
            }
        });

        // Mark only the filtered questions as loading, keep others unchanged
        const updatedResults = results.map((result, index) => {
            if (retryMap.has(index)) {
                return {
                    question: result.question,
                    isLoading: true,
                };
            }
            return result;
        });

        // Update the state to show loading
        setResults(updatedResults);
        // Set processing state to true
        setIsProcessing(true);
    };

    // Function to update results
    const updateResults = (newResults: QuestionResult[]) => {
        setResults(newResults);
    };

    // Function to add refreshing index
    const addRefreshingIndex = (index: number) => {
        setRefreshingIndices((prev) => [...prev, index]);
    };

    // Function to remove refreshing index
    const removeRefreshingIndex = (index: number) => {
        setRefreshingIndices((prev) => prev.filter((i) => i !== index));
    };

    return {
        results,
        isProcessing,
        refreshingIndices,
        isLoading,
        error,
        handleRefreshFromAPI,
        handleClearResults,
        handleCancelProcessing,
        handleRetryQuestions,
        updateResults,
        addRefreshingIndex,
        removeRefreshingIndex
    };
} 