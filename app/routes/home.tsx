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
import { getResults, clearResults } from '../lib/storageService';
import { graderWorkerService } from '../lib/workerService';

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
                            <div
                              className="line-clamp-2 text-sm"
                              dangerouslySetInnerHTML={{
                                __html: result.question.question,
                              }}
                            />
                          </div>
                        </div>

                        {/* Standard and Difficulty */}
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
                            {expandedCards[index] ? '▲' : '▼'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded View */}
                      {expandedCards[index] && (
                        <CardContent className="pt-0 border-t">
                          <div className="space-y-4 pt-3">
                            <div>
                              <h3 className="font-medium">Answers:</h3>
                              <ul className="mt-1 list-disc pl-5">
                                {result.question.answers.map((answer, i) => (
                                  <li key={i}>
                                    {answer.label}{' '}
                                    <span
                                      className={
                                        answer.isCorrect
                                          ? 'text-green-500'
                                          : 'text-red-500'
                                      }
                                    >
                                      (
                                      {answer.isCorrect
                                        ? 'Correct'
                                        : 'Incorrect'}
                                      )
                                    </span>
                                  </li>
                                ))}
                              </ul>
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
                                    {result.response.scorecard.dimensions.map(
                                      (dim, i) => (
                                        <div
                                          key={i}
                                          className="p-3 flex items-start"
                                        >
                                          <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                              dim.passed
                                                ? 'bg-green-100'
                                                : 'bg-red-100'
                                            }`}
                                          >
                                            {dim.passed ? '✓' : '✗'}
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
                                      )
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
