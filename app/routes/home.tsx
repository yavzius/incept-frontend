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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '../components/ui/dropdown-menu';
import type { QuestionResult } from '../lib/questionApi';
import {
  getResults,
  clearResults,
  saveResults,
  getIgnoredDimensions,
  saveIgnoredDimensions,
} from '../lib/storageService';
import { graderWorkerService } from '../lib/workerService';
import { MathRenderer } from '../components/MathRenderer';
import { gradeQuestion } from '../lib/questionApi';
import { DifficultyPieChart } from '../components/DifficultyPieChart';
import { ErrorDimensionsRadarChart } from '../components/ErrorDimensionsRadarChart';

// Define filter types
type FilterType = 'all' | 'errors' | 'success' | 'loading';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'JSON Question Grader' },
    { name: 'description', content: 'Grade questions using the API' },
  ];
}

export default function Home() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(
    {}
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshingIndices, setRefreshingIndices] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [ignoredDimensions, setIgnoredDimensions] = useState<string[]>([]);
  const [allErrorDimensions, setAllErrorDimensions] = useState<string[]>([]);

  // Load results from local storage on component mount
  useEffect(() => {
    const savedResults = getResults();
    if (savedResults.length > 0) {
      setResults(savedResults);
    }

    // Load ignored dimensions
    const savedIgnoredDimensions = getIgnoredDimensions();
    setIgnoredDimensions(savedIgnoredDimensions);

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

  // Function to collect all error dimensions from results
  useEffect(() => {
    // Extract all unique error dimensions from the results
    const dimensions = new Set<string>();

    results.forEach((result) => {
      if (result.response && !result.response.scorecard.overall_pass) {
        result.response.scorecard.dimensions.forEach((dim) => {
          if (!dim.passed) {
            dimensions.add(dim.name);
          }
        });
      }
    });

    setAllErrorDimensions(Array.from(dimensions).sort());
  }, [results]);

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

  // Function to retry all questions
  const handleRetryAll = () => {
    if (results.length === 0 || isProcessing) return;

    // Use the filtered results instead of all results
    const questionsToRetry = filteredResults.map((result) => result.question);

    if (questionsToRetry.length === 0) return;

    // Create a map to track which questions are being retried
    const retryMap = new Map();
    questionsToRetry.forEach((question) => {
      // Find the index in the original results array
      const index = results.findIndex((r) => r.question === question);
      if (index !== -1) {
        retryMap.set(index, true);
      }
    });

    // Mark only the filtered questions as loading, keep others unchanged
    const updatedResults = results.map((result, index) => {
      if (retryMap.has(index)) {
        return {
          question: result.question,
          isLoading: true,
        };
      }
      return result;
    });

    // Update the state to show loading
    setResults(updatedResults);

    // Process only the filtered questions using the worker service
    graderWorkerService.processQuestions(questionsToRetry);

    // Set processing state to true
    setIsProcessing(true);
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

  // Function to handle removing a single question
  const handleRemoveQuestion = (index: number, event: React.MouseEvent) => {
    // Prevent the card from expanding when clicking the remove button
    event.stopPropagation();

    // Create a copy of the current results
    const updatedResults = [...results];

    // Remove the question at the specified index
    updatedResults.splice(index, 1);

    // Update the state with the new results
    setResults(updatedResults);

    // Save the updated results to local storage
    saveResults(updatedResults);
  };

  // Toggle filter function
  const toggleFilter = (filterType: FilterType) => {
    setActiveFilter((prev) => (prev === filterType ? 'all' : filterType));
  };

  // Function to toggle a dimension's ignored status
  const toggleDimensionIgnore = (dimension: string) => {
    const updatedIgnoredDimensions = ignoredDimensions.includes(dimension)
      ? ignoredDimensions.filter((dim) => dim !== dimension)
      : [...ignoredDimensions, dimension];

    setIgnoredDimensions(updatedIgnoredDimensions);
    saveIgnoredDimensions(updatedIgnoredDimensions);
  };

  // Helper function to check if a question has errors that aren't ignored
  const hasRelevantErrors = (result: QuestionResult) => {
    if (result.isLoading) return false;
    if (result.error) return true;

    if (result.response && !result.response.scorecard.overall_pass) {
      // Check if there are any failing dimensions that aren't ignored
      return result.response.scorecard.dimensions.some(
        (dim) => !dim.passed && !ignoredDimensions.includes(dim.name)
      );
    }

    return false;
  };

  // Count of error questions (excluding ignored dimensions)
  const errorCount = results.filter(hasRelevantErrors).length;

  // Count of loading questions
  const loadingCount = results.filter((result) => result.isLoading).length;

  // Count of success questions (now includes questions with only ignored errors)
  const successCount = results.length - errorCount - loadingCount;

  // Filter results based on the active filter
  const filteredResults = (() => {
    switch (activeFilter) {
      case 'errors':
        return results.filter(hasRelevantErrors);
      case 'success':
        return results.filter(
          (result) => !result.isLoading && !hasRelevantErrors(result)
        );
      case 'loading':
        return results.filter((result) => result.isLoading);
      case 'all':
      default:
        return results;
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Main content area - full width */}
      <div className="w-full">
        <div className="p-8">
          {/* Header with import button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Incept Dashboard</h1>
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

          {/* Main content - Display results or placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            {results.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold">Questions</h2>
                    <div className="flex gap-2">
                      {errorCount > 0 && (
                        <div
                          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
                            activeFilter === 'errors'
                              ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50'
                          }`}
                          onClick={() => toggleFilter('errors')}
                        >
                          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-red-100 text-red-500">
                            <span className="text-xs">✗</span>
                          </div>
                          <span className="font-medium">{errorCount}</span>
                          {activeFilter === 'errors' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="ml-1"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Success filter card */}
                      {successCount > 0 && (
                        <div
                          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
                            activeFilter === 'success'
                              ? 'bg-green-100 border-green-300 text-green-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50'
                          }`}
                          onClick={() => toggleFilter('success')}
                        >
                          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-green-100 text-green-500">
                            <span className="text-xs">✓</span>
                          </div>
                          <span className="font-medium">{successCount}</span>
                          {activeFilter === 'success' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="ml-1"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Loading filter card */}
                      {loadingCount > 0 && (
                        <div
                          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
                            activeFilter === 'loading'
                              ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50'
                          }`}
                          onClick={() => toggleFilter('loading')}
                        >
                          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-blue-100 text-blue-500">
                            <div className="animate-spin h-3 w-3 border-b-2 border-blue-500 rounded-full"></div>
                          </div>
                          <span className="font-medium">{loadingCount}</span>
                          {activeFilter === 'loading' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="ml-1"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
                      onClick={handleRetryAll}
                      className="text-xs h-8"
                      disabled={isProcessing || filteredResults.length === 0}
                    >
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
                        className="mr-1"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                      </svg>
                      Retry {activeFilter !== 'all' ? activeFilter : 'All'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearResults}
                      className="text-xs h-8"
                    >
                      Clear Results
                    </Button>

                    {/* Ignored Dimensions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-xs h-8"
                          disabled={allErrorDimensions.length === 0}
                        >
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
                            className="mr-1"
                          >
                            <path d="M9 14 4 9l5-5"></path>
                            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10"></path>
                          </svg>
                          Ignore Errors
                          {ignoredDimensions.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">
                              {ignoredDimensions.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Error Dimensions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allErrorDimensions.length > 0 ? (
                          allErrorDimensions.map((dimension) => (
                            <DropdownMenuCheckboxItem
                              key={dimension}
                              checked={ignoredDimensions.includes(dimension)}
                              onCheckedChange={() =>
                                toggleDimensionIgnore(dimension)
                              }
                            >
                              {dimension}
                            </DropdownMenuCheckboxItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            No error dimensions found
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-xs h-8"
                          disabled={results.length === 0}
                        >
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
                            className="mr-1"
                          >
                            <path d="M3 3v18h18"></path>
                            <path d="M18 17V9"></path>
                            <path d="M13 17V5"></path>
                            <path d="M8 17v-3"></path>
                          </svg>
                          Stats
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl bg-white w-[90vw] max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                          {/* Overall Stats */}
                          <div className="flex items-center justify-between bg-white mb-8">
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-700">
                                  {results.length}
                                </div>
                                <div className="text-xs text-blue-600">
                                  Total
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-700">
                                  {successCount}
                                </div>
                                <div className="text-xs text-green-600">
                                  Passed
                                </div>
                              </div>
                              {results.length > 0 && (
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-700">
                                    {(
                                      (successCount / results.length) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </div>
                                  <div className="text-xs text-green-600">
                                    Success Rate
                                  </div>
                                </div>
                              )}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-700">
                                  {errorCount}
                                </div>
                                <div className="text-xs text-red-600">
                                  Failed
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Questions by Standard */}
                          <div className="mb-8">
                            <div className="bg-white rounded-lg border p-4">
                              {(() => {
                                // Group questions by standard
                                const standardCounts: Record<string, number> =
                                  {};
                                results.forEach((result) => {
                                  const standard = result.question.standard;
                                  standardCounts[standard] =
                                    (standardCounts[standard] || 0) + 1;
                                });

                                // Sort standards by count (descending)
                                const sortedStandards = Object.entries(
                                  standardCounts
                                ).sort((a, b) => b[1] - a[1]);

                                return (
                                  <div className="space-y-3">
                                    {sortedStandards.length > 0 ? (
                                      sortedStandards.map(
                                        ([standard, count]) => (
                                          <div
                                            key={standard}
                                            className="flex items-center"
                                          >
                                            <div
                                              className="w-1/3 font-medium truncate"
                                              title={standard}
                                            >
                                              {standard}
                                            </div>
                                            <div className="w-2/3 pl-4">
                                              <div className="relative pt-1">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <span className="text-xs font-semibold inline-block text-blue-600">
                                                      {count} questions
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-xs font-semibold inline-block text-blue-600">
                                                      {(
                                                        (count /
                                                          results.length) *
                                                        100
                                                      ).toFixed(1)}
                                                      %
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100 mt-1">
                                                  <div
                                                    style={{
                                                      width: `${
                                                        (count /
                                                          results.length) *
                                                        100
                                                      }%`,
                                                    }}
                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                                  ></div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className="text-gray-500 text-center py-4">
                                        No data available
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Questions by Difficulty and Error Dimensions */}
                          <div className="mb-8 flex justify-between gap-4">
                            {(() => {
                              // Group questions by difficulty
                              const difficultyCounts: Record<number, number> =
                                {};
                              results.forEach((result) => {
                                const difficulty = result.question.difficulty;
                                difficultyCounts[difficulty] =
                                  (difficultyCounts[difficulty] || 0) + 1;
                              });

                              return Object.keys(difficultyCounts).length >
                                0 ? (
                                <DifficultyPieChart
                                  difficultyCounts={difficultyCounts}
                                  totalQuestions={results.length}
                                />
                              ) : (
                                <div className="text-gray-500 text-center py-4">
                                  No data available
                                </div>
                              );
                            })()}

                            {(() => {
                              // Group questions by error dimension
                              const errorDimensions: Record<string, number> =
                                {};

                              results.forEach((result) => {
                                if (
                                  result.response &&
                                  !result.response.scorecard.overall_pass
                                ) {
                                  result.response.scorecard.dimensions.forEach(
                                    (dim) => {
                                      if (!dim.passed) {
                                        errorDimensions[dim.name] =
                                          (errorDimensions[dim.name] || 0) + 1;
                                      }
                                    }
                                  );
                                }
                              });

                              return Object.keys(errorDimensions).length > 0 ? (
                                <ErrorDimensionsRadarChart
                                  errorDimensions={errorDimensions}
                                  totalErrors={errorCount}
                                />
                              ) : (
                                <div className="text-gray-500 text-center py-4">
                                  No error data available
                                </div>
                              );
                            })()}
                          </div>

                          {/* Questions by Error Type */}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-700 rounded-full"></div>
                    <span>Processing questions in the background...</span>
                  </div>
                )}

                {/* Show message when filter is active but no matching questions found */}
                {activeFilter !== 'all' && filteredResults.length === 0 && (
                  <div className="p-3 text-center">
                    <div className="inline-flex items-center px-3 py-1.5 rounded border border-gray-200 bg-gray-50 text-sm">
                      <span className="text-gray-600 mr-2">
                        No{' '}
                        {activeFilter === 'errors'
                          ? 'error'
                          : activeFilter === 'success'
                          ? 'successful'
                          : 'loading'}{' '}
                        questions found
                      </span>
                      <div
                        className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        onClick={() => setActiveFilter('all')}
                      >
                        Show all
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {filteredResults.map((result, index) => {
                    // Find the original index in the results array
                    const originalIndex = results.findIndex(
                      (r) => r === result
                    );
                    return (
                      <Card
                        key={originalIndex}
                        className={`text-sm cursor-pointer transition-all py-2 duration-200 hover:shadow-md group ${
                          expandedCards[originalIndex]
                            ? 'border-blue-200'
                            : 'border-gray-200'
                        }`}
                        onClick={() => toggleCardExpansion(originalIndex)}
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
                              (() => {
                                // Check if the question failed but all failing dimensions are ignored
                                const hasOnlyIgnoredErrors =
                                  !result.response.scorecard.overall_pass &&
                                  !result.response.scorecard.dimensions.some(
                                    (dim) =>
                                      !dim.passed &&
                                      !ignoredDimensions.includes(dim.name)
                                  );

                                if (result.response.scorecard.overall_pass) {
                                  return (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-500">
                                      ✓
                                    </div>
                                  );
                                } else if (hasOnlyIgnoredErrors) {
                                  return (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>✓</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">
                                            Passing (ignored errors)
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-500">
                                      ✗
                                    </div>
                                  );
                                }
                              })()
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
                                            <div
                                              className={`px-2 py-0.5 text-xs rounded border cursor-help ${
                                                ignoredDimensions.includes(
                                                  dim.name
                                                )
                                                  ? 'bg-gray-50 text-gray-500 border-gray-200 line-through'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              }`}
                                            >
                                              {dim.name}
                                              {ignoredDimensions.includes(
                                                dim.name
                                              ) && ' (ignored)'}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs">
                                              {dim.explanation}
                                              {ignoredDimensions.includes(
                                                dim.name
                                              ) && (
                                                <span className="block mt-1 text-gray-500 italic">
                                                  This error is currently
                                                  ignored in counts
                                                </span>
                                              )}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                  </div>
                                )}
                            </div>
                          </div>
                          {/* Action buttons container with hover effect */}
                          <div className="flex items-center space-x-2 relative">
                            {/* Refresh Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 opacity-0 scale-75 transform transition-all duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 group-hover:scale-100"
                              onClick={(e) =>
                                handleRefreshQuestion(originalIndex, e)
                              }
                              disabled={
                                refreshingIndices.includes(originalIndex) ||
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
                                  refreshingIndices.includes(originalIndex)
                                    ? 'animate-spin'
                                    : ''
                                }`}
                              >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                              </svg>
                            </Button>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 opacity-0 scale-75 transform transition-all duration-200 delay-75 ease-in-out text-red-500 hover:text-red-700 hover:bg-red-50 group-hover:opacity-100 group-hover:scale-100"
                              onClick={(e) =>
                                handleRemoveQuestion(originalIndex, e)
                              }
                              disabled={result.isLoading}
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
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </Button>
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

                            <div className="text-gray-400">
                              {expandedCards[originalIndex] ? '▲' : '▼'}
                            </div>
                          </div>
                        </div>

                        {/* Expanded View */}
                        {expandedCards[originalIndex] && (
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
                                            className={`p-3 flex items-start ${
                                              ignoredDimensions.includes(
                                                dim.name
                                              )
                                                ? 'bg-gray-50'
                                                : ''
                                            }`}
                                          >
                                            <div
                                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                                ignoredDimensions.includes(
                                                  dim.name
                                                )
                                                  ? 'bg-gray-200 text-gray-500'
                                                  : 'bg-red-100 text-red-500'
                                              }`}
                                            >
                                              {ignoredDimensions.includes(
                                                dim.name
                                              ) ? (
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
                                                >
                                                  <line
                                                    x1="18"
                                                    y1="6"
                                                    x2="6"
                                                    y2="18"
                                                  ></line>
                                                  <line
                                                    x1="6"
                                                    y1="6"
                                                    x2="18"
                                                    y2="18"
                                                  ></line>
                                                </svg>
                                              ) : (
                                                '✗'
                                              )}
                                            </div>
                                            <div className="flex-row">
                                              <div
                                                className={`font-medium ${
                                                  ignoredDimensions.includes(
                                                    dim.name
                                                  )
                                                    ? 'text-gray-500'
                                                    : ''
                                                }`}
                                              >
                                                {dim.name}:{' '}
                                                <span
                                                  className={`text-sm font-normal ${
                                                    ignoredDimensions.includes(
                                                      dim.name
                                                    )
                                                      ? 'text-gray-500'
                                                      : 'text-gray-600'
                                                  }`}
                                                >
                                                  {dim.explanation}
                                                </span>
                                                {ignoredDimensions.includes(
                                                  dim.name
                                                ) && (
                                                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                    Ignored
                                                  </span>
                                                )}
                                              </div>
                                              {ignoredDimensions.includes(
                                                dim.name
                                              ) ? (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="mt-1 h-7 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleDimensionIgnore(
                                                      dim.name
                                                    );
                                                  }}
                                                >
                                                  Include in counts
                                                </Button>
                                              ) : (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="mt-1 h-7 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleDimensionIgnore(
                                                      dim.name
                                                    );
                                                  }}
                                                >
                                                  Ignore this error
                                                </Button>
                                              )}
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
                    );
                  })}
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
