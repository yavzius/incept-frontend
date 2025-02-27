import axios from 'axios';
import type { Question, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Grades a question using the standard API endpoint
 * @param question The question to grade
 * @returns A promise that resolves to the API response
 */
export async function gradeQuestion(question: Question): Promise<ApiResponse> {
    try {
        const response = await axios.post<ApiResponse>(
            `${API_BASE_URL}/questions/grade`,
            question
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Adds multiple questions to the database
 * @param questions Array of questions to add
 * @returns A promise that resolves to the API response
 */
export async function addQuestions(questions: Question[]): Promise<any> {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/questions/add`,
            questions
        );
        return response.data;
    } catch (error) {
        throw error;
    }
} 