import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/components/ui/card';
import { useState, useEffect } from 'react';
import type { QuestionResult } from '@/features/questions/types';
import { useJsonImport } from '@/features/importer/hooks/useJsonImport';
import { useFileUpload } from '@/features/importer/hooks/useFileUpload';
import { FileUploader } from '@/features/importer/components/FileUploader';
import { JsonInputArea } from '@/features/importer/components/JsonInputArea';
import { FilteredQuestionsAlert } from '@/features/importer/components/FilteredQuestionsAlert';

interface JsonImporterProps {
  onImportResults?: (results: QuestionResult[]) => void;
}

export function JsonImporter({ onImportResults }: JsonImporterProps) {
  const {
    jsonInput,
    setJsonInput,
    results,
    isSubmitting,
    error,
    filteredQuestions,
    handleSubmit,
  } = useJsonImport(onImportResults);

  const { selectedFileName, fileInputRef, handleFileUpload, resetFileInput } =
    useFileUpload(
      // Set JSON input when file is uploaded
      (content) => setJsonInput(content),
      // Handle errors
      (message) => console.error(message)
    );

  // State to track if submission was successful
  const [submitted, setSubmitted] = useState(false);

  // Reset submitted state when JSON input changes
  useEffect(() => {
    if (submitted) {
      setSubmitted(false);
    }
  }, [jsonInput]);

  // Handle the submit button click
  const onSubmitClick = async () => {
    await handleSubmit();
    setSubmitted(true);
  };

  return (
    <div className="h-full max-h-[80vh] overflow-auto p-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle>JSON Question Importer</CardTitle>
          <CardDescription>
            Import JSON to add questions to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <FileUploader
            fileInputRef={fileInputRef}
            selectedFileName={selectedFileName}
            handleFileUpload={handleFileUpload}
            resetFileInput={resetFileInput}
          />

          {/* JSON Input */}
          <JsonInputArea jsonInput={jsonInput} setJsonInput={setJsonInput} />

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Filtered Questions Alert */}
          <FilteredQuestionsAlert filteredQuestions={filteredQuestions} />

          {(jsonInput || selectedFileName) && !submitted && (
            <div className="text-sm text-gray-500">
              Click Submit to process the{' '}
              {selectedFileName ? 'uploaded file' : 'JSON content'}.
            </div>
          )}

          {submitted && (
            <div className="text-sm text-green-600">
              Your submission has been sent for processing in the background.
              The questions will be available in the database when processing is
              complete. You can continue using the application.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={onSubmitClick}
            disabled={!jsonInput.trim() || isSubmitting}
          >
            {isSubmitting
              ? 'Submitting...'
              : submitted
              ? 'Submitted'
              : 'Submit'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
