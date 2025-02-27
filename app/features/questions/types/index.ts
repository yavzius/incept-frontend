import type { QuestionResult } from '../../../lib/questionApi';

// Define filter types
export type FilterType = 'all' | 'errors' | 'success' | 'loading';

export interface ExpandedCardsState {
    [key: number]: boolean;
}

export interface IgnoredDimensionsState {
    dimensions: string[];
    toggle: (dimension: string) => void;
}

export interface ErrorDimension {
    name: string;
    count: number;
}

export interface DifficultyCount {
    [key: number]: number;
}

export type { QuestionResult }; 