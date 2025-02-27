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

// Question types from questionApi.ts
export interface Question {
    standard: string;
    statement: string;
    sourceId: number;
    question: string;
    answers: {
        label: string;
        isCorrect: boolean;
    }[];
    difficulty: number;
    referenceText: string;
}

export interface ScoreCardDimension {
    name: string;
    passed: boolean;
    explanation: string;
}

export interface ScoreCard {
    dimensions: ScoreCardDimension[];
    overall_pass: boolean;
}

export interface ApiResponse {
    status: string;
    scorecard: ScoreCard;
}

export interface QuestionResult {
    question: Question;
    response?: ApiResponse;
    isLoading: boolean;
    error?: string;
}

export interface ComparisonResult extends QuestionResult {
    compactResponse?: ApiResponse;
    compactError?: string;
    isCompactLoading: boolean;
    standardResponseTime?: number; // Time in milliseconds for standard API
    compactResponseTime?: number;  // Time in milliseconds for compact API
} 