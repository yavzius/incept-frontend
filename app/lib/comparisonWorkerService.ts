import type { Question, ComparisonResult } from './questionApi';
import { saveResults } from './storageService';
import { v4 as uuidv4 } from 'uuid';

// Define the types for worker messages
interface WorkerMessage {
    type: string;
    requestId: string;
    results?: ComparisonResult[];
}

// Class to manage the comparison worker
class ComparisonWorkerService {
    private worker: Worker | null = null;
    private activeRequestId: string | null = null;
    private progressCallbacks: Map<string, (results: ComparisonResult[]) => void> = new Map();
    private completeCallbacks: Map<string, () => void> = new Map();
    private isInitialized = false;
    private globalProgressCallback: ((results: ComparisonResult[]) => void) | null = null;
    private globalCompleteCallback: (() => void) | null = null;

    // Initialize the worker
    initialize() {
        if (this.isInitialized) return;

        if (typeof window !== 'undefined' && window.Worker) {
            try {
                // Create a new worker
                this.worker = new Worker(new URL('../workers/comparisonWorker.ts', import.meta.url), {
                    type: 'module'
                });

                // Set up message handler
                this.worker.addEventListener('message', this.handleWorkerMessage);

                this.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize comparison worker:', error);
            }
        } else {
            console.warn('Web Workers are not supported in this environment');
        }
    }

    // Handle messages from the worker
    private handleWorkerMessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, requestId, results } = event.data;

        if (type === 'PROGRESS_UPDATE' && results) {
            // Call progress callback if exists
            const progressCallback = this.progressCallbacks.get(requestId);
            if (progressCallback) {
                progressCallback(results);
            }

            // Call global progress callback if exists
            if (this.globalProgressCallback) {
                this.globalProgressCallback(results);
            }
        } else if (type === 'COMPLETE') {
            // Call complete callback if exists
            const completeCallback = this.completeCallbacks.get(requestId);
            if (completeCallback) {
                completeCallback();
            }

            // Call global complete callback if exists
            if (this.globalCompleteCallback) {
                this.globalCompleteCallback();
            }

            // Clean up callbacks
            this.progressCallbacks.delete(requestId);
            this.completeCallbacks.delete(requestId);

            // Clear active request if it matches
            if (this.activeRequestId === requestId) {
                this.activeRequestId = null;
            }
        }
    };

    // Compare questions using both endpoints
    compareQuestions(
        questions: Question[],
        onProgress?: (results: ComparisonResult[]) => void,
        onComplete?: () => void
    ): string {
        this.initialize();

        if (!this.worker) {
            throw new Error('Worker is not available');
        }

        // Generate a unique ID for this request
        const requestId = uuidv4();
        this.activeRequestId = requestId;

        // Store callbacks
        if (onProgress) {
            this.progressCallbacks.set(requestId, onProgress);
        }

        if (onComplete) {
            this.completeCallbacks.set(requestId, onComplete);
        }

        // Send the request to the worker
        this.worker.postMessage({
            type: 'COMPARE_QUESTIONS',
            questions,
            requestId
        });

        return requestId;
    }

    // Cancel the current processing
    cancelProcessing(requestId?: string) {
        if (!this.worker) return;

        const idToCancel = requestId || this.activeRequestId;
        if (!idToCancel) return;

        // Send cancel message to worker
        this.worker.postMessage({
            type: 'CANCEL',
            requestId: idToCancel
        });

        // Clean up callbacks
        this.progressCallbacks.delete(idToCancel);
        this.completeCallbacks.delete(idToCancel);

        // Clear active request if it matches
        if (this.activeRequestId === idToCancel) {
            this.activeRequestId = null;
        }
    }

    // Check if there's an active processing
    isProcessing(): boolean {
        return this.activeRequestId !== null;
    }

    // Terminate the worker
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
            this.activeRequestId = null;
            this.progressCallbacks.clear();
            this.completeCallbacks.clear();
        }
    }

    // Register a global progress callback
    registerProgressCallback(callback: (results: ComparisonResult[]) => void): void {
        this.globalProgressCallback = callback;
    }

    // Register a global complete callback
    registerCompleteCallback(callback: () => void): void {
        this.globalCompleteCallback = callback;
    }

    // Unregister the global progress callback
    unregisterProgressCallback(): void {
        this.globalProgressCallback = null;
    }

    // Unregister the global complete callback
    unregisterCompleteCallback(): void {
        this.globalCompleteCallback = null;
    }
}

// Create a singleton instance
export const comparisonWorkerService = new ComparisonWorkerService(); 