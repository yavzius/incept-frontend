import React, { useState, useEffect } from 'react';
import { comparisonWorkerService } from '../lib/comparisonWorkerService';
import type { ComparisonResult, Question } from '../lib/questionApi';
import { Button } from './ui/button';
import ComparisonView from './ComparisonView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ApiComparisonProps {
  questions: Question[];
  onComparisonComplete?: () => void;
}

// New component to display detailed evaluation results
function DetailedResultsDialog({ result }: { result: ComparisonResult }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          View Detailed Results
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Evaluation Results</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs defaultValue="question">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="question">Question</TabsTrigger>
              <TabsTrigger value="standard">Standard API</TabsTrigger>
              <TabsTrigger value="compact">Compact API</TabsTrigger>
              <TabsTrigger value="speed">Speed Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Question Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Question:</span>{' '}
                  {result.question.question}
                </p>
                <p>
                  <span className="font-medium">Standard:</span>{' '}
                  {result.question.standard}
                </p>
                <p>
                  <span className="font-medium">Statement:</span>{' '}
                  {result.question.statement}
                </p>
                <div>
                  <p className="font-medium mb-1">Answers:</p>
                  <ul className="list-disc pl-5">
                    {result.question.answers.map((answer, i) => (
                      <li
                        key={i}
                        className={answer.isCorrect ? 'text-green-600' : ''}
                      >
                        {answer.label} {answer.isCorrect && '(Correct)'}
                      </li>
                    ))}
                  </ul>
                </div>
                <p>
                  <span className="font-medium">Difficulty:</span>{' '}
                  {result.question.difficulty}
                </p>
                <div>
                  <p className="font-medium mb-1">Reference Text:</p>
                  <div className="bg-gray-50 p-2 rounded text-sm">
                    {result.question.referenceText}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="standard" className="p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Standard API Results</h3>
              {result.isLoading ? (
                <p>Loading...</p>
              ) : result.error ? (
                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700">
                  <p className="font-medium">Error:</p>
                  <p>{result.error}</p>
                </div>
              ) : result.response ? (
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded border ${
                      result.response.scorecard.overall_pass
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="font-medium">
                      Overall:{' '}
                      {result.response.scorecard.overall_pass ? 'PASS' : 'FAIL'}
                    </p>
                    <p>Status: {result.response.status}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Dimensions:</h4>
                    <div className="space-y-2">
                      {result.response.scorecard.dimensions.map((dim, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded border ${
                            dim.passed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <p className="font-medium">
                            {dim.name}: {dim.passed ? 'PASS' : 'FAIL'}
                          </p>
                          <p className="text-sm mt-1">{dim.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No data available</p>
              )}
            </TabsContent>

            <TabsContent value="compact" className="p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Compact API Results</h3>
              {result.isCompactLoading ? (
                <p>Loading...</p>
              ) : result.compactError ? (
                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700">
                  <p className="font-medium">Error:</p>
                  <p>{result.compactError}</p>
                </div>
              ) : result.compactResponse ? (
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded border ${
                      result.compactResponse.scorecard.overall_pass
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="font-medium">
                      Overall:{' '}
                      {result.compactResponse.scorecard.overall_pass
                        ? 'PASS'
                        : 'FAIL'}
                    </p>
                    <p>Status: {result.compactResponse.status}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Dimensions:</h4>
                    <div className="space-y-2">
                      {result.compactResponse.scorecard.dimensions.map(
                        (dim, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded border ${
                              dim.passed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <p className="font-medium">
                              {dim.name}: {dim.passed ? 'PASS' : 'FAIL'}
                            </p>
                            <p className="text-sm mt-1">{dim.explanation}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No data available</p>
              )}
            </TabsContent>

            <TabsContent value="speed" className="p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Speed Comparison</h3>

              {result.standardResponseTime === undefined &&
              result.compactResponseTime === undefined ? (
                <p>No timing data available</p>
              ) : (
                <div className="space-y-4">
                  {/* Response Time Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded border bg-blue-50 border-blue-200">
                      <p className="font-medium">Standard API</p>
                      {result.standardResponseTime !== undefined ? (
                        <p className="text-2xl font-bold mt-1">
                          {result.standardResponseTime.toFixed(0)} ms
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">No data</p>
                      )}
                    </div>

                    <div className="p-3 rounded border bg-green-50 border-green-200">
                      <p className="font-medium">Compact API</p>
                      {result.compactResponseTime !== undefined ? (
                        <p className="text-2xl font-bold mt-1">
                          {result.compactResponseTime.toFixed(0)} ms
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">No data</p>
                      )}
                    </div>
                  </div>

                  {/* Comparison Analysis */}
                  {result.standardResponseTime !== undefined &&
                    result.compactResponseTime !== undefined && (
                      <div className="p-4 rounded border bg-gray-50">
                        <h4 className="font-medium mb-2">Analysis</h4>

                        {(() => {
                          const timeDiff =
                            result.standardResponseTime -
                            result.compactResponseTime;
                          const fasterApi =
                            timeDiff > 0
                              ? 'Compact'
                              : timeDiff < 0
                              ? 'Standard'
                              : 'Equal';
                          const percentageDiff =
                            result.standardResponseTime > 0
                              ? (Math.abs(timeDiff) /
                                  result.standardResponseTime) *
                                100
                              : 0;

                          return (
                            <>
                              <p className="mb-3">
                                {fasterApi === 'Equal'
                                  ? 'Both APIs performed equally for this question.'
                                  : `The ${fasterApi} API was faster by ${percentageDiff.toFixed(
                                      1
                                    )}% (${Math.abs(timeDiff).toFixed(0)} ms).`}
                              </p>

                              {/* Visual comparison */}
                              <div className="mt-4">
                                <div className="flex items-center mb-2">
                                  <span className="w-24 text-sm">
                                    Standard:
                                  </span>
                                  <div className="flex-1 bg-gray-200 h-6 rounded-sm overflow-hidden">
                                    <div
                                      className="bg-blue-500 h-full"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (result.standardResponseTime /
                                            Math.max(
                                              result.standardResponseTime,
                                              result.compactResponseTime
                                            )) *
                                            100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="ml-2 text-sm w-16 text-right">
                                    {result.standardResponseTime.toFixed(0)} ms
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-24 text-sm">Compact:</span>
                                  <div className="flex-1 bg-gray-200 h-6 rounded-sm overflow-hidden">
                                    <div
                                      className="bg-green-500 h-full"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (result.compactResponseTime /
                                            Math.max(
                                              result.standardResponseTime,
                                              result.compactResponseTime
                                            )) *
                                            100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="ml-2 text-sm w-16 text-right">
                                    {result.compactResponseTime.toFixed(0)} ms
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ApiComparison({
  questions,
  onComparisonComplete,
}: ApiComparisonProps) {
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);
  const [isComparing, setIsComparing] = useState(false);

  // Limit questions to 10 for comparison
  const limitedQuestions = questions.slice(0, 6);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      comparisonWorkerService.cancelProcessing();
    };
  }, []);

  // Start comparison process
  const startComparison = () => {
    setIsComparing(true);

    comparisonWorkerService.compareQuestions(
      limitedQuestions,
      (updatedResults) => {
        setComparisonResults([...updatedResults]);
      },
      () => {
        setIsComparing(false);
        if (onComparisonComplete) {
          onComparisonComplete();
        }
      }
    );
  };

  // Cancel comparison process
  const cancelComparison = () => {
    comparisonWorkerService.cancelProcessing();
    setIsComparing(false);
  };

  return (
    <div className="api-comparison-container space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">API Endpoint Comparison</h2>
        <div className="space-x-2">
          {!isComparing ? (
            <Button
              onClick={startComparison}
              disabled={limitedQuestions.length === 0}
            >
              Start Comparison
            </Button>
          ) : (
            <Button onClick={cancelComparison} variant="destructive">
              Cancel Comparison
            </Button>
          )}
        </div>
      </div>

      {questions.length > 10 && (
        <div className="bg-yellow-50 rounded p-3 border border-yellow-200 text-yellow-700">
          Note: Only the first 6 questions will be compared to limit API calls.
        </div>
      )}

      {isComparing && (
        <div className="bg-blue-50 rounded p-3 border border-blue-200 text-blue-700">
          Comparing {limitedQuestions.length} questions across both API
          endpoints sequentially (one by one) for more accurate speed
          measurements...
        </div>
      )}

      {comparisonResults.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonResults.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <div className="mb-3">
                  <h3 className="font-semibold mb-1">Question {index + 1}</h3>
                  <p className="text-sm text-gray-700 truncate">
                    {result.question.question}
                  </p>
                </div>
                <ComparisonView result={result} />
                <DetailedResultsDialog result={result} />
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-2">Comparison Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-1">
                  Standard API Results
                </h4>
                <ul className="text-sm space-y-1">
                  <li>
                    Passed:{' '}
                    {
                      comparisonResults.filter(
                        (r) => r.response?.scorecard.overall_pass
                      ).length
                    }{' '}
                    / {comparisonResults.length}
                  </li>
                  <li>
                    Failed:{' '}
                    {
                      comparisonResults.filter(
                        (r) => r.response && !r.response.scorecard.overall_pass
                      ).length
                    }{' '}
                    / {comparisonResults.length}
                  </li>
                  <li>
                    Errors: {comparisonResults.filter((r) => r.error).length} /{' '}
                    {comparisonResults.length}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">
                  Compact API Results
                </h4>
                <ul className="text-sm space-y-1">
                  <li>
                    Passed:{' '}
                    {
                      comparisonResults.filter(
                        (r) => r.compactResponse?.scorecard.overall_pass
                      ).length
                    }{' '}
                    / {comparisonResults.length}
                  </li>
                  <li>
                    Failed:{' '}
                    {
                      comparisonResults.filter(
                        (r) =>
                          r.compactResponse &&
                          !r.compactResponse.scorecard.overall_pass
                      ).length
                    }{' '}
                    / {comparisonResults.length}
                  </li>
                  <li>
                    Errors:{' '}
                    {comparisonResults.filter((r) => r.compactError).length} /{' '}
                    {comparisonResults.length}
                  </li>
                </ul>
              </div>
            </div>

            {/* Speed Comparison Summary */}
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1">Speed Comparison</h4>
              {(() => {
                // Calculate average response times
                const standardTimes = comparisonResults
                  .filter((r) => r.standardResponseTime !== undefined)
                  .map((r) => r.standardResponseTime!);

                const compactTimes = comparisonResults
                  .filter((r) => r.compactResponseTime !== undefined)
                  .map((r) => r.compactResponseTime!);

                const avgStandardTime =
                  standardTimes.length > 0
                    ? standardTimes.reduce((sum, time) => sum + time, 0) /
                      standardTimes.length
                    : 0;

                const avgCompactTime =
                  compactTimes.length > 0
                    ? compactTimes.reduce((sum, time) => sum + time, 0) /
                      compactTimes.length
                    : 0;

                // Calculate which API is faster on average
                const timeDiff = avgStandardTime - avgCompactTime;
                const fasterApi =
                  timeDiff > 0
                    ? 'Compact'
                    : timeDiff < 0
                    ? 'Standard'
                    : 'Equal';
                const percentageDiff =
                  avgStandardTime > 0
                    ? (Math.abs(timeDiff) / avgStandardTime) * 100
                    : 0;

                return (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-sm font-medium">Standard API</p>
                        <p className="text-sm">
                          Avg. Response Time: {avgStandardTime.toFixed(0)} ms
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Compact API</p>
                        <p className="text-sm">
                          Avg. Response Time: {avgCompactTime.toFixed(0)} ms
                        </p>
                      </div>
                    </div>

                    {standardTimes.length > 0 && compactTimes.length > 0 && (
                      <div className="text-sm mt-2">
                        <p className="font-medium">
                          {fasterApi === 'Equal'
                            ? 'Both APIs have similar performance'
                            : `${fasterApi} API is faster by approximately ${percentageDiff.toFixed(
                                1
                              )}%`}
                        </p>

                        <p className="text-xs text-gray-600 mt-1 mb-2">
                          Note: Questions are processed sequentially to ensure
                          accurate speed measurements without API calls
                          interfering with each other.
                        </p>

                        {/* Simple bar chart visualization */}
                        <div className="mt-3">
                          <div className="flex items-center mb-1">
                            <span className="w-20 text-xs">Standard:</span>
                            <div className="flex-1 bg-gray-200 h-4 rounded-sm overflow-hidden">
                              <div
                                className="bg-blue-500 h-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (avgStandardTime /
                                      Math.max(
                                        avgStandardTime,
                                        avgCompactTime
                                      )) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="ml-2 text-xs">
                              {avgStandardTime.toFixed(0)} ms
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-20 text-xs">Compact:</span>
                            <div className="flex-1 bg-gray-200 h-4 rounded-sm overflow-hidden">
                              <div
                                className="bg-green-500 h-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (avgCompactTime /
                                      Math.max(
                                        avgStandardTime,
                                        avgCompactTime
                                      )) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="ml-2 text-xs">
                              {avgCompactTime.toFixed(0)} ms
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Difference Summary */}
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1">Differences</h4>
              <p className="text-sm">
                {(() => {
                  const differentResults = comparisonResults.filter((r) => {
                    // Only consider results with both responses
                    if (!r.response || !r.compactResponse) return false;

                    // Check if overall pass status differs
                    return (
                      r.response.scorecard.overall_pass !==
                      r.compactResponse.scorecard.overall_pass
                    );
                  });

                  if (differentResults.length === 0) {
                    return 'No overall pass/fail differences found between the APIs.';
                  }

                  return `${differentResults.length} question(s) have different pass/fail results between the APIs.`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isComparing &&
        comparisonResults.length === 0 &&
        questions.length > 0 && (
          <div className="text-center p-6 border rounded-lg bg-gray-50">
            <p className="text-gray-600 mb-4">
              Click "Start Comparison" to compare questions between API
              endpoints
            </p>
            <Button onClick={startComparison}>Start Comparison</Button>
          </div>
        )}

      {questions.length === 0 && (
        <div className="text-center p-6 border rounded-lg bg-gray-50">
          <p className="text-gray-600">No questions available to compare</p>
        </div>
      )}
    </div>
  );
}

export default ApiComparison;
