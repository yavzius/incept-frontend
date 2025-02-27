import React, { useEffect, useState } from 'react';
import ApiComparison from '../features/compare/components/ApiComparison';
import type { Question } from '../lib/questionApi';
import { getResults } from '../lib/storageService';

export default function ComparisonPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load questions from storage on component mount
  useEffect(() => {
    // Get saved results from storage
    const savedResults = getResults();

    // Extract questions from results
    const extractedQuestions = savedResults.map((result) => result.question);

    setQuestions(extractedQuestions);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">API Comparison</h1>

      <div className="mb-6">
        <p className="text-gray-600">
          This page allows you to compare results between the standard API
          endpoint (<code>/questions/grade</code>) and the compact endpoint (
          <code>/questions/grade/compact</code>).
        </p>
      </div>

      {questions.length > 0 ? (
        <ApiComparison questions={questions} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
          <p>
            No questions available. Please go to the home page first to load or
            import some questions.
          </p>
          <a
            href="/"
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            Go to Home Page
          </a>
        </div>
      )}
    </div>
  );
}
