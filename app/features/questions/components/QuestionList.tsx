import React from 'react';
import type { QuestionResult, FilterType } from '../types';
import { QuestionCard } from './QuestionCard';

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
}: QuestionListProps) {
  return (
    <div className="space-y-4">
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
          />
        );
      })}
    </div>
  );
}
