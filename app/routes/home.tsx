import type { Route } from './+types/home';
import { JsonImporter } from '../components/JsonImporter';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip';
import type { QuestionResult } from '../lib/questionApi';
import { getResults, clearResults, saveResults } from '../lib/storageService';
import { graderWorkerService } from '../lib/workerService';
import { MathRenderer } from '../components/MathRenderer';
import { gradeQuestion } from '../lib/questionApi';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'JSON Question Grader' },
    { name: 'description', content: 'Grade questions using the API' },
  ];
}

export default function Home() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(
    {}
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshingIndices, setRefreshingIndices] = useState<number[]>([]);

  // Load results from local storage on component mount
  useEffect(() => {
    const savedResults = getResults();
    if (savedResults.length > 0) {
      setResults(savedResults);
    }

    // Initialize the worker service
    graderWorkerService.initialize();

    // Check if there's an active processing
    setIsProcessing(graderWorkerService.isProcessing());

    // Set up a listener for worker progress updates
    const handleProgress = (updatedResults: QuestionResult[]) => {
      setResults(updatedResults);
      setIsProcessing(true);
    };

    const handleComplete = () => {
      setIsProcessing(false);
    };

    // Register the callbacks
    graderWorkerService.registerProgressCallback(handleProgress);
    graderWorkerService.registerCompleteCallback(handleComplete);

    // Clean up on unmount
    return () => {
      // We don't terminate the worker here to allow background processing
      // when navigating away from this page

      // Unregister the callbacks to prevent memory leaks
      graderWorkerService.unregisterProgressCallback();
      graderWorkerService.unregisterCompleteCallback();
    };
  }, []);

  // Function to handle receiving results from the JsonImporter
  const handleImportResults = (importedResults: QuestionResult[]) => {
    setResults(importedResults);
    setIsImporterOpen(false); // Close the dialog after import
    setExpandedCards({}); // Reset expanded cards when new results are imported
    setIsProcessing(graderWorkerService.isProcessing());
  };

  // Function to clear all results
  const handleClearResults = () => {
    clearResults();
    setResults([]);
    setExpandedCards({});
  };

  // Function to cancel processing
  const handleCancelProcessing = () => {
    graderWorkerService.cancelProcessing();
    setIsProcessing(false);
  };

  // Function to toggle card expansion
  const toggleCardExpansion = (index: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Function to handle refreshing a single question
  const handleRefreshQuestion = async (
    index: number,
    event: React.MouseEvent
  ) => {
    // Prevent the card from expanding when clicking the refresh button
    event.stopPropagation();

    // Mark this question as refreshing
    setRefreshingIndices((prev) => [...prev, index]);

    try {
      // Get the question to refresh
      const questionToRefresh = results[index].question;

      // Create a copy of the current results
      const updatedResults = [...results];

      // Update the loading state for this question
      updatedResults[index] = {
        question: questionToRefresh,
        isLoading: true,
      };

      // Update the state to show loading
      setResults(updatedResults);

      // Call the API to grade the question
      const response = await gradeQuestion(questionToRefresh);

      // Update the results with the new response
      updatedResults[index] = {
        question: questionToRefresh,
        response,
        isLoading: false,
      };

      // Update the state with the new results
      setResults(updatedResults);

      // Save the updated results to local storage
      saveResults(updatedResults);
    } catch (error) {
      // Handle error
      const updatedResults = [...results];
      updatedResults[index] = {
        question: results[index].question,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to refresh question',
      };

      // Update the state with the error
      setResults(updatedResults);

      // Save the updated results to local storage
      saveResults(updatedResults);
    } finally {
      // Remove this question from the refreshing indices
      setRefreshingIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Main content area - full width */}
      <div className="w-full">
        <div className="p-8">
          {/* Header with import button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Question Grader Dashboard</h1>
            <Dialog open={isImporterOpen} onOpenChange={setIsImporterOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Import JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl w-[90vw] max-h-[90vh] p-0 bg-white">
                <div className="h-full w-full overflow-hidden">
                  <JsonImporter onImportResults={handleImportResults} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-gray-600 mb-6">
            View and analyze graded questions here.
          </p>

          {/* Main content - Display results or placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            {results.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Lesson Content</h2>
                  <div className="flex gap-2">
                    {isProcessing && (
                      <Button
                        variant="destructive"
                        onClick={handleCancelProcessing}
                        className="text-xs h-8"
                      >
                        Cancel Processing
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleClearResults}
                      className="text-xs h-8"
                    >
                      Clear Results
                    </Button>
                  </div>
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-700 rounded-full"></div>
                    <span>Processing questions in the background...</span>
                  </div>
                )}

                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card
                      key={index}
                      className={`text-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
                        expandedCards[index] ? 'border-blue-200' : ''
                      }`}
                      onClick={() => toggleCardExpansion(index)}
                    >
                      {/* Collapsed View */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-grow">
                          {/* Pass/Fail Status */}
                          {result.isLoading ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                              <div className="animate-spin h-4 w-4 border-b-2 border-gray-500 rounded-full"></div>
                            </div>
                          ) : result.error ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-500">
                              ✗
                            </div>
                          ) : result.response ? (
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                result.response.scorecard.overall_pass
                                  ? 'bg-green-100 text-green-500'
                                  : 'bg-red-100 text-red-500'
                              }`}
                            >
                              {result.response.scorecard.overall_pass
                                ? '✓'
                                : '✗'}
                            </div>
                          ) : null}

                          {/* Question Preview */}
                          <div className="flex-grow">
                            <div className="line-clamp-2 text-sm">
                              <MathRenderer
                                content={result.question.question}
                              />
                            </div>

                            {/* Fail Reasons (only shown when there are failing dimensions) */}
                            {result.response &&
                              !result.response.scorecard.overall_pass &&
                              result.response.scorecard.dimensions.some(
                                (dim) => !dim.passed
                              ) && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {result.response.scorecard.dimensions
                                    .filter((dim) => !dim.passed)
                                    .map((dim, i) => (
                                      <Tooltip key={i}>
                                        <TooltipTrigger asChild>
                                          <div className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-200 cursor-help">
                                            {dim.name}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">
                                            {dim.explanation}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Standard, Difficulty and Actions */}
                        <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-gray-500 cursor-help">
                                {result.question.standard}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {result.question.statement}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700">
                            {result.question.difficulty}
                          </div>

                          {/* Refresh Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={(e) => handleRefreshQuestion(index, e)}
                            disabled={
                              refreshingIndices.includes(index) ||
                              result.isLoading
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`${
                                refreshingIndices.includes(index)
                                  ? 'animate-spin'
                                  : ''
                              }`}
                            >
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                              <path d="M3 3v5h5"></path>
                            </svg>
                          </Button>

                          <div className="text-gray-400">
                            {expandedCards[index] ? '▲' : '▼'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded View */}
                      {expandedCards[index] && (
                        <CardContent className="pt-0 border-t">
                          <div className="space-y-4 pt-3">
                            <div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {result.question.answers.map((answer, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center px-3 py-1.5 rounded-md border ${
                                      answer.isCorrect
                                        ? 'bg-gray-100 border-gray-300'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <span className="mr-1.5">
                                      {answer.isCorrect ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-gray-700"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                          ></circle>
                                          <path d="m9 12 2 2 4-4"></path>
                                        </svg>
                                      ) : (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-gray-400"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                          ></circle>
                                        </svg>
                                      )}
                                    </span>
                                    <span
                                      className={
                                        answer.isCorrect ? 'font-medium' : ''
                                      }
                                    >
                                      <MathRenderer content={answer.label} />
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              {result.isLoading ? (
                                <div className="flex items-center justify-center p-6">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                  <span className="ml-2">Processing...</span>
                                </div>
                              ) : result.error ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-md">
                                  Error: {result.error}
                                </div>
                              ) : result.response ? (
                                <div className="mt-2 border rounded-md overflow-hidden">
                                  <div
                                    className={`p-3 ${
                                      result.response.scorecard.overall_pass
                                        ? 'bg-green-100'
                                        : 'bg-red-100'
                                    }`}
                                  >
                                    <span className="font-medium">
                                      Overall:{' '}
                                      {result.response.scorecard.overall_pass
                                        ? 'Pass'
                                        : 'Fail'}
                                    </span>
                                  </div>
                                  <div className="divide-y">
                                    {result.response.scorecard.dimensions
                                      .filter((dim) => !dim.passed)
                                      .map((dim, i) => (
                                        <div
                                          key={i}
                                          className="p-3 flex items-start"
                                        >
                                          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-red-100">
                                            ✗
                                          </div>
                                          <div className="flex-row">
                                            <div className="font-medium">
                                              {dim.name}:{' '}
                                              <span className="text-sm font-normal text-gray-600">
                                                {dim.explanation}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                    {result.response.scorecard.dimensions.some(
                                      (dim) => dim.passed
                                    ) && (
                                      <div className="p-3">
                                        <div className="font-medium mb-2">
                                          Passing Checks:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {result.response.scorecard.dimensions
                                            .filter((dim) => dim.passed)
                                            .map((dim, i) => (
                                              <Tooltip key={i}>
                                                <TooltipTrigger asChild>
                                                  <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full flex items-center cursor-help">
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-green-200 text-green-800">
                                                      ✓
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                      {dim.name}
                                                    </span>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="max-w-xs">
                                                    {dim.explanation}
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">
                Select or import questions to view results
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
