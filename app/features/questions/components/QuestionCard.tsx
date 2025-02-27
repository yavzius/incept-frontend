import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import type { QuestionResult } from '../types';
import { MathRenderer } from './MathRenderer';
import { gradeQuestion } from '../../../lib/questionApi';

interface QuestionCardProps {
  result: QuestionResult;
  index: number;
  originalIndex: number;
  expandedCards: Record<number, boolean>;
  refreshingIndices: number[];
  ignoredDimensions: string[];
  toggleCardExpansion: (index: number) => void;
  toggleDimensionIgnore: (dimension: string) => void;
  updateResults: (results: QuestionResult[]) => void;
  addRefreshingIndex: (index: number) => void;
  removeRefreshingIndex: (index: number) => void;
  allResults: QuestionResult[];
}

export function QuestionCard({
  result,
  index,
  originalIndex,
  expandedCards,
  refreshingIndices,
  ignoredDimensions,
  toggleCardExpansion,
  toggleDimensionIgnore,
  updateResults,
  addRefreshingIndex,
  removeRefreshingIndex,
  allResults,
}: QuestionCardProps) {
  // Function to handle refreshing a single question
  const handleRefreshQuestion = async (
    index: number,
    event: React.MouseEvent
  ) => {
    // Prevent the card from expanding when clicking the refresh button
    event.stopPropagation();

    // Mark this question as refreshing
    addRefreshingIndex(index);

    try {
      // Get the question to refresh
      const questionToRefresh = allResults[index].question;

      // Create a copy of the current results
      const updatedResults = [...allResults];

      // Update the loading state for this question
      updatedResults[index] = {
        question: questionToRefresh,
        isLoading: true,
      };

      // Update the state to show loading
      updateResults(updatedResults);

      // Call the API to grade the question
      const response = await gradeQuestion(questionToRefresh);

      // Update the results with the new response
      updatedResults[index] = {
        question: questionToRefresh,
        response,
        isLoading: false,
      };

      // Update the state with the new results
      updateResults(updatedResults);
    } catch (error) {
      // Handle error
      const updatedResults = [...allResults];
      updatedResults[index] = {
        question: allResults[index].question,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to refresh question',
      };

      // Update the state with the error
      updateResults(updatedResults);
    } finally {
      // Remove this question from the refreshing indices
      removeRefreshingIndex(index);
    }
  };

  // Function to handle removing a single question
  const handleRemoveQuestion = (index: number, event: React.MouseEvent) => {
    // Prevent the card from expanding when clicking the remove button
    event.stopPropagation();

    // Create a copy of the current results
    const updatedResults = [...allResults];

    // Remove the question at the specified index
    updatedResults.splice(index, 1);

    // Update the state with the new results
    updateResults(updatedResults);
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

  return (
    <Card
      key={originalIndex}
      className={`text-sm cursor-pointer transition-all py-2 duration-200 hover:shadow-md group ${
        expandedCards[originalIndex] ? 'border-blue-200' : 'border-gray-200'
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
                  (dim) => !dim.passed && !ignoredDimensions.includes(dim.name)
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
                        <p className="max-w-xs">Passing (ignored errors)</p>
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
              <MathRenderer content={result.question.question} />
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
                              ignoredDimensions.includes(dim.name)
                                ? 'bg-gray-50 text-gray-500 border-gray-200 line-through'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {dim.name}
                            {ignoredDimensions.includes(dim.name) &&
                              ' (ignored)'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {dim.explanation}
                            {ignoredDimensions.includes(dim.name) && (
                              <span className="block mt-1 text-gray-500 italic">
                                This error is currently ignored in counts
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
            onClick={(e) => handleRefreshQuestion(originalIndex, e)}
            disabled={
              refreshingIndices.includes(originalIndex) || result.isLoading
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
                refreshingIndices.includes(originalIndex) ? 'animate-spin' : ''
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
            onClick={(e) => handleRemoveQuestion(originalIndex, e)}
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
              <p className="max-w-xs">{result.question.statement}</p>
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
                          <circle cx="12" cy="12" r="10"></circle>
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
                          <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                      )}
                    </span>
                    <span className={answer.isCorrect ? 'font-medium' : ''}>
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
                      {result.response.scorecard.overall_pass ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                  <div className="divide-y">
                    {result.response.scorecard.dimensions
                      .filter((dim) => !dim.passed)
                      .map((dim, i) => (
                        <div
                          key={i}
                          className={`p-3 flex items-start ${
                            ignoredDimensions.includes(dim.name)
                              ? 'bg-gray-50'
                              : ''
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                              ignoredDimensions.includes(dim.name)
                                ? 'bg-gray-200 text-gray-500'
                                : 'bg-red-100 text-red-500'
                            }`}
                          >
                            {ignoredDimensions.includes(dim.name) ? (
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
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            ) : (
                              '✗'
                            )}
                          </div>
                          <div className="flex-row">
                            <div
                              className={`font-medium ${
                                ignoredDimensions.includes(dim.name)
                                  ? 'text-gray-500'
                                  : ''
                              }`}
                            >
                              {dim.name}:{' '}
                              <span
                                className={`text-sm font-normal ${
                                  ignoredDimensions.includes(dim.name)
                                    ? 'text-gray-500'
                                    : 'text-gray-600'
                                }`}
                              >
                                {dim.explanation}
                              </span>
                              {ignoredDimensions.includes(dim.name) && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                  Ignored
                                </span>
                              )}
                            </div>
                            {ignoredDimensions.includes(dim.name) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDimensionIgnore(dim.name);
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
                                  toggleDimensionIgnore(dim.name);
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
                        <div className="font-medium mb-2">Passing Checks:</div>
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
                                  <p className="max-w-xs">{dim.explanation}</p>
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
}
