import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { generateQuestions } from '../services';
import { useStandards } from '../../questions/hooks/useStandards';
import type {
  GenerateFormState,
  GenerateRequest,
  GenerateResponse,
} from '../types';
import type { QuestionResult } from '../../questions/types';

interface GenerateFormProps {
  onSuccess?: (response: GenerateResponse) => void;
  onError?: (error: string) => void;
  results?: QuestionResult[]; // Add results prop to get previously fetched questions
}

export function GenerateForm({
  onSuccess,
  onError,
  results = [],
}: GenerateFormProps) {
  const { standards } = useStandards(results);
  const [formState, setFormState] = useState<GenerateFormState>({
    standard: '',
    query: 'The student is very bored and they like challenging questions',
    count: 5,
    difficulty: 2,
    isLoading: false,
  });

  // Calculate standard counts
  const standardCounts = React.useMemo(() => {
    return results.reduce((acc, result) => {
      const standard = result.question.standard;
      if (standard) {
        acc[standard] = (acc[standard] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [results]);

  // Update standard when a standard is selected from the dropdown
  const handleStandardSelect = (value: string) => {
    setFormState((prev) => ({ ...prev, standard: value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'count') {
      // Ensure count is a positive number
      const countValue = parseInt(value);
      if (!isNaN(countValue) && countValue > 0) {
        setFormState((prev) => ({ ...prev, [name]: countValue }));
      }
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDifficultyChange = (value: string) => {
    setFormState((prev) => ({ ...prev, difficulty: parseInt(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formState.standard.trim()) {
      setFormState((prev) => ({ ...prev, error: 'Standard is required' }));
      return;
    }

    if (!formState.query.trim()) {
      setFormState((prev) => ({ ...prev, error: 'Query is required' }));
      return;
    }

    // Clear previous errors and set loading state
    setFormState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const request: GenerateRequest = {
        standard: formState.standard,
        query: formState.query,
        count: formState.count,
        difficulty: formState.difficulty,
      };

      const response = await generateQuestions(request);

      // Reset form and call success callback
      setFormState({
        standard: '',
        query: '',
        count: 5,
        difficulty: 2,
        isLoading: false,
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate questions';

      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formState.error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md mb-4">
            {formState.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="standard">Standard</Label>
          {standards.length > 0 ? (
            <Select
              value={formState.standard}
              onValueChange={handleStandardSelect}
              disabled={formState.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a standard" />
              </SelectTrigger>
              <SelectContent>
                {standards.map((standard) => (
                  <SelectItem key={standard} value={standard}>
                    <div className="flex justify-between w-full">
                      <span>{standard}</span>
                      <span className="text-gray-500 ml-2">
                        ({standardCounts[standard] || 0})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              id="standard"
              name="standard"
              value={formState.standard}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="e.g. CCSS.MATH.CONTENT.HSA.REI.B.4"
              disabled={formState.isLoading}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="query">Query</Label>
          <Textarea
            id="query"
            name="query"
            value={formState.query}
            onChange={handleInputChange}
            className="min-h-[100px]"
            placeholder="Describe the type of questions you want to generate..."
            disabled={formState.isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="count">Count</Label>
          <input
            id="count"
            name="count"
            type="number"
            min="1"
            max="50"
            value={formState.count}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            disabled={formState.isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>Difficulty Level</Label>
          <RadioGroup
            value={formState.difficulty.toString()}
            onValueChange={handleDifficultyChange}
            className="flex space-x-4"
            disabled={formState.isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="difficulty-1" />
              <Label htmlFor="difficulty-1" className="cursor-pointer">
                Easy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="difficulty-2" />
              <Label htmlFor="difficulty-2" className="cursor-pointer">
                Medium
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="difficulty-3" />
              <Label htmlFor="difficulty-3" className="cursor-pointer">
                Hard
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={formState.isLoading}
          >
            {formState.isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Generate Questions'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
