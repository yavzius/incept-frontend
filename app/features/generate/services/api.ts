import axios from 'axios';
import type { GenerateRequest, GenerateResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Generates questions based on the provided parameters
 * @param request The generation request parameters
 * @returns A promise that resolves to the API response
 */
export async function generateQuestions(request: GenerateRequest): Promise<GenerateResponse> {
    try {
        const response = await axios.post<GenerateResponse>(
            `${API_BASE_URL}/questions/generate`,
            request
        );
        return response.data;
    } catch (error) {
        throw error;
    }
} 