import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { JsonImporter } from '@/features/importer/components/JsonImporter';
import { GenerateDialog } from '@/features/generate/components';
import { FilterBar } from '@/features/questions/components/FilterBar';
import { ActionBar } from '@/features/questions/components/ActionBar';
import { QuestionList } from '@/features/questions/components/QuestionList';
import {
  useQuestions,
  useIgnoredDimensions,
  useExpandedCards,
  useFilter,
  useErrorDimensions,
  useStandards,
} from '@/features/questions/hooks';
import type { QuestionResult } from '@/features/questions/types';
import { gradeQuestion } from '@/features/questions/services/questionApi';

export function QuestionDashboard() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<
    Record<number, boolean>
  >({});

  // Use custom hooks
  const {
    results,
    isProcessing,
    refreshingIndices,
    isLoading,
    error,
    handleRefreshFromAPI,
    handleCancelProcessing,
    updateResults,
    addRefreshingIndex,
    removeRefreshingIndex,
  } = useQuestions();

  const { ignoredDimensions, toggleDimensionIgnore } = useIgnoredDimensions();
  const { expandedCards, toggleCardExpansion, resetExpandedCards } =
    useExpandedCards();
  const {
    activeFilter,
    toggleFilter,
    filterResults,
    getFilterCounts,
    selectedStandard,
    setStandardFilter,
  } = useFilter();
  const { allErrorDimensions } = useErrorDimensions(results);
  const { standards } = useStandards(results);

  // Function to toggle selection of a question
  const toggleQuestionSelection = (index: number) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Function to select all visible questions
  const selectAllQuestions = () => {
    const newSelected: Record<number, boolean> = {};
    filteredResults.forEach((result) => {
      const originalIndex = results.findIndex((r) => r === result);
      newSelected[originalIndex] = true;
    });
    setSelectedQuestions(newSelected);
  };

  // Function to deselect all questions
  const deselectAllQuestions = () => {
    setSelectedQuestions({});
  };

  // Function to handle batch refresh of selected questions
  const handleBatchRefresh = async () => {
    const selectedIndices = Object.keys(selectedQuestions)
      .filter((key) => selectedQuestions[parseInt(key)])
      .map((key) => parseInt(key));

    if (selectedIndices.length === 0) return;

    // Mark all selected questions as refreshing
    selectedIndices.forEach((index) => {
      addRefreshingIndex(index);
    });

    try {
      // Create a copy of the current results
      const updatedResults = [...results];

      // Update the loading state for selected questions
      selectedIndices.forEach((index) => {
        updatedResults[index] = {
          question: results[index].question,
          isLoading: true,
        };
      });

      // Update the state to show loading
      updateResults(updatedResults);

      // Process each question sequentially to avoid overwhelming the API
      for (const index of selectedIndices) {
        try {
          const questionToRefresh = results[index].question;
          const response = await gradeQuestion(questionToRefresh);

          // Update this specific question with the response
          updatedResults[index] = {
            question: questionToRefresh,
            response,
            isLoading: false,
          };

          // Update the results after each question is processed
          updateResults([...updatedResults]);
        } catch (error) {
          // Handle error for this specific question
          updatedResults[index] = {
            question: results[index].question,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to refresh question',
          };

          // Update the results after each error
          updateResults([...updatedResults]);
        } finally {
          // Remove this question from the refreshing indices
          removeRefreshingIndex(index);
        }
      }
    } catch (error) {
      console.error('Error in batch refresh:', error);
    }
  };

  // Function to handle batch removal of selected questions
  const handleBatchRemove = () => {
    const selectedIndices = Object.keys(selectedQuestions)
      .filter((key) => selectedQuestions[parseInt(key)])
      .map((key) => parseInt(key))
      .sort((a, b) => b - a); // Sort in descending order to remove from end first

    if (selectedIndices.length === 0) return;

    // Create a copy of the current results
    const updatedResults = [...results];

    // Remove the questions at the specified indices
    selectedIndices.forEach((index) => {
      updatedResults.splice(index, 1);
    });

    // Update the state with the new results
    updateResults(updatedResults);

    // Clear selection after removal
    deselectAllQuestions();
  };

  // Function to handle receiving results from the JsonImporter
  const handleImportResults = (importedResults: QuestionResult[]) => {
    // Combine existing results with newly imported results instead of replacing them
    const combinedResults = [...results, ...importedResults];
    updateResults(combinedResults);
    setIsImporterOpen(false); // Close the dialog after import
    resetExpandedCards(); // Reset expanded cards when new results are imported
  };

  // Function to handle receiving results from the GenerateDialog
  const handleGenerateResults = (response: any) => {
    if (response && response.questions) {
      // Convert the generated questions to QuestionResult format
      const newResults = response.questions.map((question: any) => ({
        question,
        isLoading: false,
      }));

      // Combine existing results with newly generated results
      const combinedResults = [...results, ...newResults];
      updateResults(combinedResults);
      resetExpandedCards(); // Reset expanded cards when new results are generated
    }
  };

  // Get filter counts
  const { errorCount, successCount, loadingCount, standardCounts } =
    getFilterCounts(results, ignoredDimensions);

  // Filter results based on the active filter
  const filteredResults = filterResults(results, ignoredDimensions);

  // Count selected questions
  const selectedCount = Object.values(selectedQuestions).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Main content area - full width */}
      <div className="w-full">
        <div className="p-8">
          {/* Header with import button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Incept</h1>
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
                  <Button variant="outline" className="flex items-center gap-2">
                    Import JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl w-[90vw] max-h-[90vh] p-0 bg-white">
                  <div className="h-full w-full overflow-hidden">
                    <JsonImporter onImportResults={handleImportResults} />
                  </div>
                </DialogContent>
              </Dialog>
              <GenerateDialog
                results={results}
                onSuccess={handleGenerateResults}
                triggerLabel="Generate Questions"
              />
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
                    <FilterBar
                      errorCount={errorCount}
                      successCount={successCount}
                      loadingCount={loadingCount}
                      activeFilter={activeFilter}
                      toggleFilter={toggleFilter}
                      standards={standards}
                      standardCounts={standardCounts}
                      selectedStandard={selectedStandard}
                      setStandardFilter={setStandardFilter}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionBar
                      isProcessing={isProcessing}
                      filteredResults={filteredResults}
                      activeFilter={activeFilter}
                      allErrorDimensions={allErrorDimensions}
                      ignoredDimensions={ignoredDimensions}
                      toggleDimensionIgnore={toggleDimensionIgnore}
                      handleCancelProcessing={handleCancelProcessing}
                      results={results}
                      errorCount={errorCount}
                    />
                  </div>
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
                  selectedQuestions={selectedQuestions}
                  toggleQuestionSelection={toggleQuestionSelection}
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
