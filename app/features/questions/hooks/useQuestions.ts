import { useState, useEffect } from 'react';
import type { QuestionResult } from '../types';
import { fetchQuestions } from '../../../lib/questionService';
import { getResults, saveResults } from '../../../lib/storageService';
import { graderWorkerService } from '../../../lib/workerService';

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
                    // Save the API results to local storage
                    saveResults(apiResults);
                } else {
                    // If no API results, fall back to local storage
                    const savedResults = getResults();
                    if (savedResults.length > 0) {
                        setResults(savedResults);
                    }
                }
            } catch (err) {
                console.error('Error loading questions:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to load questions'
                );

                // Fall back to local storage if API fails
                const savedResults = getResults();
                if (savedResults.length > 0) {
                    setResults(savedResults);
                }
            } finally {
                setIsLoading(false);
            }

            // Initialize the worker service
            graderWorkerService.initialize();

            // Check if there's an active processing
            setIsProcessing(graderWorkerService.isProcessing());
        };

        loadData();

        // Set up a listener for worker progress updates
        const handleProgress = (updatedResults: QuestionResult[]) => {
            setResults(updatedResults);
            setIsProcessing(true);
        };

        const handleComplete = () => {
            setIsProcessing(false);
        };

        // Register the callbacks
        graderWorkerService.registerProgressCallback(handleProgress);
        graderWorkerService.registerCompleteCallback(handleComplete);

        // Clean up on unmount
        return () => {
            // We don't terminate the worker here to allow background processing
            // when navigating away from this page

            // Unregister the callbacks to prevent memory leaks
            graderWorkerService.unregisterProgressCallback();
            graderWorkerService.unregisterCompleteCallback();
        };
    }, []);

    // Function to manually refresh questions from the API
    const handleRefreshFromAPI = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const apiResults = await fetchQuestions();
            setResults(apiResults);
            saveResults(apiResults);
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
        graderWorkerService.cancelProcessing();
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

        // Process only the filtered questions using the worker service
        graderWorkerService.processQuestions(questionStrings);

        // Set processing state to true
        setIsProcessing(true);
    };

    // Function to update results
    const updateResults = (newResults: QuestionResult[]) => {
        setResults(newResults);
        saveResults(newResults);
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