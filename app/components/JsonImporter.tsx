import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './ui/card';
import type { Question, QuestionResult, ApiResponse } from '../lib/questionApi';
import { graderWorkerService } from '../lib/workerService';

interface JsonImporterProps {
  onImportResults?: (results: QuestionResult[]) => void;
}

export function JsonImporter({ onImportResults }: JsonImporterProps) {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
      } catch (err) {
        setError("Failed to read file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const resetFileInput = () => {
    setSelectedFileName(null);
    setJsonInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setResults([]);

      let questions: Question[];
      try {
        questions = JSON.parse(jsonInput);
        if (!Array.isArray(questions)) {
          questions = [questions];
        }
      } catch (err) {
        throw new Error('Invalid JSON format. Please check your input.');
      }

      // Use the worker service to process questions in the background
      const handleProgress = (updatedResults: QuestionResult[]) => {
        setResults(updatedResults);
        if (onImportResults) {
          onImportResults(updatedResults);
        }
      };

      const handleComplete = () => {
        setIsSubmitting(false);
        setRequestId(null);
      };

      // Start processing and store the request ID
      const id = graderWorkerService.processQuestions(
        questions,
        handleProgress,
        handleComplete
      );
      setRequestId(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (requestId) {
      graderWorkerService.cancelProcessing(requestId);
      setIsSubmitting(false);
      setRequestId(null);
    }
  };

  // Status indicator component
  const StatusIndicator = ({ result }: { result: QuestionResult }) => {
    if (result.isLoading) {
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
          <div className="animate-spin h-4 w-4 border-b-2 border-gray-400 rounded-full"></div>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-500">
          ✗
        </div>
      );
    }

    if (result.response) {
      const passed = result.response.scorecard.overall_pass;
      return (
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}
        >
          {passed ? '✓' : '✗'}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full max-h-[80vh] overflow-auto p-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle>JSON Question Importer</CardTitle>
          <CardDescription>Import JSON to grade questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload" className="mb-2">
              Upload JSON File
            </Label>
            <div>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                {selectedFileName && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">
                      {selectedFileName}
                    </span>
                    <Button
                      type="button"
                      onClick={resetFileInput}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="json-input">Or Paste JSON Content</Label>
              <Button
                type="button"
                onClick={() => setJsonInput('')}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            </div>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"standard": "6.NS.B.2", "statement": "Example statement", ...}]'
              className="min-h-[150px] font-mono"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {(jsonInput || selectedFileName) && (
            <div className="text-sm text-gray-500">
              Click Submit to process the{' '}
              {selectedFileName ? 'uploaded file' : 'JSON content'}.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {isSubmitting ? (
            <Button onClick={handleCancel} variant="destructive">
              Cancel Processing
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!jsonInput.trim()}>
              Submit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
