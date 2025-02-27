import type { QuestionResult, FilterType } from '../types';
import { QuestionCard } from './QuestionCard';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Button } from '@/shared/components/ui/button';

interface QuestionListProps {
  filteredResults: QuestionResult[];
  results: QuestionResult[];
  expandedCards: Record<number, boolean>;
  refreshingIndices: number[];
  ignoredDimensions: string[];
  activeFilter: FilterType;
  toggleCardExpansion: (index: number) => void;
  toggleDimensionIgnore: (dimension: string) => void;
  updateResults: (results: QuestionResult[]) => void;
  addRefreshingIndex: (index: number) => void;
  removeRefreshingIndex: (index: number) => void;
  selectedQuestions?: Record<number, boolean>;
  toggleQuestionSelection?: (index: number) => void;
}

export function QuestionList({
  filteredResults,
  results,
  expandedCards,
  refreshingIndices,
  ignoredDimensions,
  activeFilter,
  toggleCardExpansion,
  toggleDimensionIgnore,
  updateResults,
  addRefreshingIndex,
  removeRefreshingIndex,
  selectedQuestions = {},
  toggleQuestionSelection = () => {},
}: QuestionListProps) {
  // Check if all filtered questions are selected
  const areAllSelected =
    filteredResults.length > 0 &&
    filteredResults.every((_, index) => {
      const originalIndex = results.findIndex(
        (r) => r === filteredResults[index]
      );
      return selectedQuestions[originalIndex];
    });

  // Count selected questions
  const selectedCount = Object.values(selectedQuestions).filter(Boolean).length;

  // Handle select all checkbox click
  const handleSelectAllToggle = () => {
    // Get all original indices of filtered results
    const originalIndices = filteredResults.map((result) =>
      results.findIndex((r) => r === result)
    );

    // If all are selected, deselect all. Otherwise, select all.
    const newSelectionState = !areAllSelected;

    // Toggle each question's selection state
    originalIndices.forEach((originalIndex) => {
      if (selectedQuestions[originalIndex] !== newSelectionState) {
        toggleQuestionSelection(originalIndex);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Selection header - only show if there are filtered results */}
      {filteredResults.length > 0 && (
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center">
            <div className="mr-3 w-6 flex items-center justify-center">
              <Checkbox
                checked={areAllSelected}
                className="cursor-pointer"
                onClick={handleSelectAllToggle}
                data-state={areAllSelected ? 'checked' : 'unchecked'}
              />
            </div>
            {selectedCount > 0 ? (
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
            ) : null}
            {!areAllSelected && (
              <Button
                variant="link"
                className="text-sm text-blue-600 p-0 h-auto ml-2"
                onClick={handleSelectAllToggle}
              >
                Select all in this list
              </Button>
            )}
          </div>

          {/* Action buttons - always visible in the same row */}
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <Button variant="outline" size="sm" className="text-xs">
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Delete
                </Button>
              </>
            )}
          </div>
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
          </div>
        </div>
      )}

      {filteredResults.map((result, index) => {
        // Find the original index in the results array
        const originalIndex = results.findIndex((r) => r === result);
        return (
          <QuestionCard
            key={originalIndex}
            result={result}
            index={index}
            originalIndex={originalIndex}
            expandedCards={expandedCards}
            refreshingIndices={refreshingIndices}
            ignoredDimensions={ignoredDimensions}
            toggleCardExpansion={toggleCardExpansion}
            toggleDimensionIgnore={toggleDimensionIgnore}
            updateResults={updateResults}
            addRefreshingIndex={addRefreshingIndex}
            removeRefreshingIndex={removeRefreshingIndex}
            allResults={results}
            selectedQuestions={selectedQuestions}
            toggleQuestionSelection={toggleQuestionSelection}
          />
        );
      })}
    </div>
  );
}
