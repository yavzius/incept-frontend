import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { JsonImporter } from '../../importer/components/JsonImporter';
import { FilterBar } from './FilterBar';
import { ActionBar } from './ActionBar';
import { QuestionList } from './QuestionList';
import {
  useQuestions,
  useIgnoredDimensions,
  useExpandedCards,
  useFilter,
  useErrorDimensions,
} from '../hooks';
import type { QuestionResult } from '../types';

export function QuestionDashboard() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Use custom hooks
  const {
    results,
    isProcessing,
    refreshingIndices,
    isLoading,
    error,
    handleRefreshFromAPI,
    handleClearResults: clearResultsFromStorage,
    handleCancelProcessing,
    handleRetryQuestions,
    updateResults,
    addRefreshingIndex,
    removeRefreshingIndex,
  } = useQuestions();

  const { ignoredDimensions, toggleDimensionIgnore } = useIgnoredDimensions();
  const { expandedCards, toggleCardExpansion, resetExpandedCards } =
    useExpandedCards();
  const { activeFilter, toggleFilter, filterResults, getFilterCounts } =
    useFilter();
  const { allErrorDimensions } = useErrorDimensions(results);

  // Function to handle receiving results from the JsonImporter
  const handleImportResults = (importedResults: QuestionResult[]) => {
    // Combine existing results with newly imported results instead of replacing them
    const combinedResults = [...results, ...importedResults];
    updateResults(combinedResults);
    setIsImporterOpen(false); // Close the dialog after import
    resetExpandedCards(); // Reset expanded cards when new results are imported
  };

  // Function to clear all results
  const handleClearResults = () => {
    clearResultsFromStorage();
    resetExpandedCards();
  };

  // Get filter counts
  const { errorCount, successCount, loadingCount } = getFilterCounts(
    results,
    ignoredDimensions
  );

  // Filter results based on the active filter
  const filteredResults = filterResults(results, ignoredDimensions);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Main content area - full width */}
      <div className="w-full">
        <div className="p-8">
          {/* Header with import button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Incept Dashboard</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshFromAPI}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-700 rounded-full"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
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
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Refresh
                  </>
                )}
              </Button>
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
          </div>

          {/* Main content - Display results or placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* Show error message if there was an error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2 border border-red-200">
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Show loading indicator when initially loading */}
            {isLoading && results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-700 rounded-full mb-4"></div>
                <p className="text-gray-600">Loading questions from API...</p>
              </div>
            ) : results.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold">Questions</h2>
                    <FilterBar
                      errorCount={errorCount}
                      successCount={successCount}
                      loadingCount={loadingCount}
                      activeFilter={activeFilter}
                      toggleFilter={toggleFilter}
                    />
                  </div>
                  <ActionBar
                    isProcessing={isProcessing}
                    filteredResults={filteredResults}
                    activeFilter={activeFilter}
                    allErrorDimensions={allErrorDimensions}
                    ignoredDimensions={ignoredDimensions}
                    toggleDimensionIgnore={toggleDimensionIgnore}
                    handleCancelProcessing={handleCancelProcessing}
                    handleRetryQuestions={handleRetryQuestions}
                    results={results}
                    errorCount={errorCount}
                  />
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-blue-700 rounded-full"></div>
                    <span>Processing questions in the background...</span>
                  </div>
                )}

                <QuestionList
                  filteredResults={filteredResults}
                  results={results}
                  expandedCards={expandedCards}
                  refreshingIndices={refreshingIndices}
                  ignoredDimensions={ignoredDimensions}
                  activeFilter={activeFilter}
                  toggleCardExpansion={toggleCardExpansion}
                  toggleDimensionIgnore={toggleDimensionIgnore}
                  updateResults={updateResults}
                  addRefreshingIndex={addRefreshingIndex}
                  removeRefreshingIndex={removeRefreshingIndex}
                />
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
