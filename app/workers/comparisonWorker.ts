import axios from 'axios';
import type { Question, ApiResponse, ComparisonResult } from '../lib/questionApi';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Define message types for communication with the main thread
interface CompareRequest {
    type: 'COMPARE_QUESTIONS';
    questions: Question[];
    requestId: string;
}

interface ProgressUpdate {
    type: 'PROGRESS_UPDATE';
    results: ComparisonResult[];
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
    const data = event.data as CompareRequest | CancelMessage;

    if (data.type === 'CANCEL') {
        // Remove the request from active requests
        activeRequests.delete(data.requestId);
        return;
    }

    if (data.type === 'COMPARE_QUESTIONS') {
        const { questions, requestId } = data;

        // Add this request to active requests
        activeRequests.add(requestId);

        // Initialize results with loading state
        const results: ComparisonResult[] = questions.map(question => ({
            question,
            isLoading: true,
            isCompactLoading: true,
        }));

        // Send initial progress update
        self.postMessage({
            type: 'PROGRESS_UPDATE',
            results: JSON.parse(JSON.stringify(results)),
            requestId
        } as ProgressUpdate);

        // Process questions sequentially (one by one) instead of in parallel
        for (let index = 0; index < questions.length; index++) {
            // Check if request is still active before processing
            if (!activeRequests.has(requestId)) break;

            const question = questions[index];

            // First process standard API
            try {
                // Start timing for standard API
                const standardStartTime = performance.now();

                // Make the standard API call
                const standardResponse = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/questions/grade`,
                    question
                );

                // End timing for standard API
                const standardEndTime = performance.now();
                const standardResponseTime = standardEndTime - standardStartTime;

                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) break;

                // Update the result for this question's standard response
                results[index] = {
                    ...results[index],
                    response: standardResponse.data,
                    isLoading: false,
                    standardResponseTime,
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: JSON.parse(JSON.stringify(results)),
                    requestId
                } as ProgressUpdate);

                // Add a small delay to ensure updates are processed
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) break;

                // Update with error
                results[index] = {
                    ...results[index],
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'API request failed',
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: JSON.parse(JSON.stringify(results)),
                    requestId
                } as ProgressUpdate);

                // Add a small delay to ensure updates are processed
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Then process compact API (only after standard API is complete)
            try {
                // Start timing for compact API
                const compactStartTime = performance.now();

                // Make the compact API call
                const compactResponse = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/questions/grade/compact`,
                    question
                );

                // End timing for compact API
                const compactEndTime = performance.now();
                const compactResponseTime = compactEndTime - compactStartTime;

                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) break;

                // Update the result for this question's compact response
                results[index] = {
                    ...results[index],
                    compactResponse: compactResponse.data,
                    isCompactLoading: false,
                    compactResponseTime,
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: JSON.parse(JSON.stringify(results)),
                    requestId
                } as ProgressUpdate);

                // Add a small delay to ensure updates are processed
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
                // Check if request is still active before updating
                if (!activeRequests.has(requestId)) break;

                // Update with error
                results[index] = {
                    ...results[index],
                    isCompactLoading: false,
                    compactError: err instanceof Error ? err.message : 'API request failed',
                };

                // Send progress update
                self.postMessage({
                    type: 'PROGRESS_UPDATE',
                    results: JSON.parse(JSON.stringify(results)),
                    requestId
                } as ProgressUpdate);

                // Add a small delay to ensure updates are processed
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Add a small delay between questions to ensure clean separation
            await new Promise(resolve => setTimeout(resolve, 100));
        }

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