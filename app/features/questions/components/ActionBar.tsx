import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/shared/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import type { FilterType, QuestionResult } from '../types';
import { DifficultyPieChart } from '@/features/stats/components/DifficultyPieChart';
import { ErrorDimensionsRadarChart } from '@/features/stats/components/ErrorDimensionsRadarChart';

interface ActionBarProps {
  isProcessing: boolean;
  filteredResults: QuestionResult[];
  activeFilter: FilterType;
  allErrorDimensions: string[];
  ignoredDimensions: string[];
  toggleDimensionIgnore: (dimension: string) => void;
  handleCancelProcessing: () => void;
  results: QuestionResult[];
  errorCount: number;
}

export function ActionBar({
  isProcessing,
  allErrorDimensions,
  ignoredDimensions,
  toggleDimensionIgnore,
  handleCancelProcessing,
  results,
  errorCount,
}: ActionBarProps) {
  const [isStatsOpen, setIsStatsOpen] = React.useState(false);

  return (
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
                onCheckedChange={() => toggleDimensionIgnore(dimension)}
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
                  <div className="text-xs text-blue-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {results.length - errorCount}
                  </div>
                  <div className="text-xs text-green-600">Passed</div>
                </div>
                {results.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {(
                        ((results.length - errorCount) / results.length) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-green-600">Success Rate</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {errorCount}
                  </div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
              </div>
            </div>

            {/* Questions by Standard */}
            <div className="mb-8">
              <div className="bg-white rounded-lg border p-4">
                {(() => {
                  // Group questions by standard
                  const standardCounts: Record<string, number> = {};
                  results.forEach((result) => {
                    const standard = result.question.standard;
                    standardCounts[standard] =
                      (standardCounts[standard] || 0) + 1;
                  });

                  // Sort standards by count (descending)
                  const sortedStandards = Object.entries(standardCounts).sort(
                    (a, b) => b[1] - a[1]
                  );

                  return (
                    <div className="space-y-3">
                      {sortedStandards.length > 0 ? (
                        sortedStandards.map(([standard, count]) => (
                          <div key={standard} className="flex items-center">
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
                                      {((count / results.length) * 100).toFixed(
                                        1
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                                <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100 mt-1">
                                  <div
                                    style={{
                                      width: `${
                                        (count / results.length) * 100
                                      }%`,
                                    }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
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
                const difficultyCounts: Record<number, number> = {};
                results.forEach((result) => {
                  const difficulty = result.question.difficulty;
                  difficultyCounts[difficulty] =
                    (difficultyCounts[difficulty] || 0) + 1;
                });

                return Object.keys(difficultyCounts).length > 0 ? (
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
                const errorDimensions: Record<string, number> = {};

                results.forEach((result) => {
                  if (
                    result.response &&
                    !result.response.scorecard.overall_pass
                  ) {
                    result.response.scorecard.dimensions.forEach((dim) => {
                      if (!dim.passed) {
                        errorDimensions[dim.name] =
                          (errorDimensions[dim.name] || 0) + 1;
                      }
                    });
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
