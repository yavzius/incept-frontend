import { useState, useEffect } from 'react';
import type { QuestionResult } from '../types';

export function useErrorDimensions(results: QuestionResult[]) {
    const [allErrorDimensions, setAllErrorDimensions] = useState<string[]>([]);

    // Function to collect all error dimensions from results
    useEffect(() => {
        // Extract all unique error dimensions from the results
        const dimensions = new Set<string>();

        results.forEach((result) => {
            if (result.response && !result.response.scorecard.overall_pass) {
                result.response.scorecard.dimensions.forEach((dim) => {
                    if (!dim.passed) {
                        dimensions.add(dim.name);
                    }
                });
            }
        });

        setAllErrorDimensions(Array.from(dimensions).sort());
    }, [results]);

    return {
        allErrorDimensions
    };
} 