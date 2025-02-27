import { useState, useEffect } from 'react';
import { getIgnoredDimensions, saveIgnoredDimensions } from '../../../shared/services/storageService';

export function useIgnoredDimensions() {
    const [ignoredDimensions, setIgnoredDimensions] = useState<string[]>([]);

    // Load ignored dimensions from storage on mount
    useEffect(() => {
        const savedIgnoredDimensions = getIgnoredDimensions();
        setIgnoredDimensions(savedIgnoredDimensions);
    }, []);

    // Function to toggle a dimension's ignored status
    const toggleDimensionIgnore = (dimension: string) => {
        const updatedIgnoredDimensions = ignoredDimensions.includes(dimension)
            ? ignoredDimensions.filter((dim) => dim !== dimension)
            : [...ignoredDimensions, dimension];

        setIgnoredDimensions(updatedIgnoredDimensions);
        saveIgnoredDimensions(updatedIgnoredDimensions);
    };

    return {
        ignoredDimensions,
        toggleDimensionIgnore
    };
} 