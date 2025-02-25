import axios from 'axios';
import type { Question, ApiResponse, QuestionResult } from '../lib/questionApi';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Define message types for communication with the main thread
interface GradeRequest {
    type: 'GRADE_QUESTIONS';
    questions: Question[];
    requestId: string;
}

interface ProgressUpdate {
    type: 'PROGRESS_UPDATE';
    results: QuestionResult[];
    requestId: string;
}

interface CompleteMessage {
    type: 'COMPLETE';
    requestId: string;
}

interface CancelMessage {
    type: 'CANCEL';
    requestId: string;
}

// Keep track of active requests to allow cancellation
const activeRequests = new Set<string>();

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
    const data = event.data as GradeRequest | CancelMessage;

    if (data.type === 'CANCEL') {
        // Remove the request from active requests
        activeRequests.delete(data.requestId);
        return;
    }

    if (data.type === 'GRADE_QUESTIONS') {
        const { questions, requestId } = data;

        // Add this request to active requests
        activeRequests.add(requestId);

        // Initialize results with loading state
        const results: QuestionResult[] = questions.map(question => ({
            question,
            isLoading: true,
        }));

        // Send initial progress update
        self.postMessage({
            type: 'PROGRESS_UPDATE',
            results: [...results],
            requestId
        } as ProgressUpdate);

        // Process questions in parallel
        const processPromises = questions.map(async (question, index) => {
            // Check if request is still active before processing
            if (!activeRequests.has(requestId)) return;

            try {
                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/questions/grade`,
                    question
                );

                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) return;

                // Update the result for this question
                results[index] = {
                    question,
                    response: response.data,
                    isLoading: false,
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: [...results],
                    requestId
                } as ProgressUpdate);
            } catch (err) {
                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) return;

                // Update the result with error
                results[index] = {
                    question,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'API request failed',
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: [...results],
                    requestId
                } as ProgressUpdate);
            }
        });

        // Wait for all questions to be processed
        await Promise.all(processPromises);

        // Check if request is still active before sending completion
        if (activeRequests.has(requestId)) {
            // Send completion message
            self.postMessage({
                type: 'COMPLETE',
                requestId
            } as CompleteMessage);

            // Remove from active requests
            activeRequests.delete(requestId);
        }
    }
});

// TypeScript requires this export for workers
export { }; 