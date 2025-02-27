import { useState } from 'react';
import type { Question, QuestionResult } from '@/features/questions/types';
import { addQuestions } from '@/features/questions/services/api';
import { validateQuestion } from '../utils/validation';

interface UseJsonImportReturn {
    jsonInput: string;
    setJsonInput: (value: string) => void;
    results: QuestionResult[];
    isSubmitting: boolean;
    error: string | null;
    filteredQuestions: {
        total: number;
        filtered: number;
        reasons: string[];
    };
    handleSubmit: () => Promise<void>;
}

export function useJsonImport(
    onImportResults?: (results: QuestionResult[]) => void
): UseJsonImportReturn {
    const [jsonInput, setJsonInput] = useState<string>('');
    const [results, setResults] = useState<QuestionResult[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filteredQuestions, setFilteredQuestions] = useState<{
        total: number;
        filtered: number;
        reasons: string[];
    }>({ total: 0, filtered: 0, reasons: [] });

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError(null);
            setResults([]);
            setFilteredQuestions({ total: 0, filtered: 0, reasons: [] });

            let allQuestions: Question[];
            try {
                allQuestions = JSON.parse(jsonInput);
                if (!Array.isArray(allQuestions)) {
                    allQuestions = [allQuestions];
                }
            } catch (err) {
                throw new Error('Invalid JSON format. Please check your input.');
            }

            // Filter questions based on validation criteria
            const validationResults = allQuestions.map((q) => ({
                question: q,
                validation: validateQuestion(q),
            }));

            const validQuestions = validationResults
                .filter((item) => item.validation.isValid)
                .map((item) => item.question);

            const invalidReasons = validationResults
                .filter((item) => !item.validation.isValid && item.validation.reason)
                .map((item) => item.validation.reason as string);

            // Update filtered questions stats
            setFilteredQuestions({
                total: allQuestions.length,
                filtered: allQuestions.length - validQuestions.length,
                reasons: [...new Set(invalidReasons)], // Remove duplicates
            });

            if (validQuestions.length === 0) {
                setIsSubmitting(false);
                throw new Error('No valid questions found after filtering.');
            }

            // Set isSubmitting to false immediately to allow user to continue
            setIsSubmitting(false);

            // Make the API call without awaiting it and without updating local state or calling callback
            // This allows the user to continue using the app while the request completes in the background
            addQuestions(validQuestions).catch((apiError: any) => {
                // Log error to console but don't update UI since user may have moved on
                console.error('Background API call failed:',
                    apiError.response?.data?.message ||
                    'Failed to add questions. Please try again.');
            });

        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'An unknown error occurred'
            );
            setIsSubmitting(false);
        }
    };

    return {
        jsonInput,
        setJsonInput,
        results,
        isSubmitting,
        error,
        filteredQuestions,
        handleSubmit,
    };
} 