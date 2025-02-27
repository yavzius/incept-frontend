import { useState, useEffect } from 'react';
import type { QuestionResult } from '../types';

export function useStandards(results: QuestionResult[]) {
    const [standards, setStandards] = useState<string[]>([]);
    const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

    // Extract unique standards from questions
    useEffect(() => {
        if (results.length > 0) {
            const uniqueStandards = Array.from(
                new Set(results.map((result) => result.question.standard))
            ).filter(Boolean).sort();

            setStandards(uniqueStandards);
        }
    }, [results]);

    // Function to select a standard
    const selectStandard = (standard: string | null) => {
        setSelectedStandard(standard);
    };

    return {
        standards,
        selectedStandard,
        selectStandard
    };
} 