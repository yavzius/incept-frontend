import { useState } from 'react';
import type { ExpandedCardsState } from '../types';

export function useExpandedCards() {
    const [expandedCards, setExpandedCards] = useState<ExpandedCardsState>({});

    // Function to toggle card expansion
    const toggleCardExpansion = (index: number) => {
        setExpandedCards((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Function to reset expanded cards
    const resetExpandedCards = () => {
        setExpandedCards({});
    };

    return {
        expandedCards,
        toggleCardExpansion,
        resetExpandedCards
    };
} 