import type { Question } from '../../questions/types';

/**
 * Request parameters for generating questions
 */
export interface GenerateRequest {
    standard: string;
    query: string;
    count: number;
}

/**
 * Response from the generate API
 */
export interface GenerateResponse {
    status: string;
    questions: Question[];
    message?: string;
}

/**
 * State for the generate form
 */
export interface GenerateFormState {
    standard: string;
    query: string;
    count: number;
    isLoading: boolean;
    error?: string;
}

/**
 * Result of the generate operation
 */
export interface GenerateResult {
    request: GenerateRequest;
    response?: GenerateResponse;
    isLoading: boolean;
    error?: string;
} 