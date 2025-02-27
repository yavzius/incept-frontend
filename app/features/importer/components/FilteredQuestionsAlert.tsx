import React from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/shared/components/ui/alert';

interface FilteredQuestionsAlertProps {
  filteredQuestions: {
    total: number;
    filtered: number;
    reasons: string[];
  };
}

export function FilteredQuestionsAlert({
  filteredQuestions,
}: FilteredQuestionsAlertProps) {
  if (filteredQuestions.filtered === 0) {
    return null;
  }

  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-200">
      <AlertTitle>Questions Filtered</AlertTitle>
      <AlertDescription>
        <p>
          {filteredQuestions.filtered} out of {filteredQuestions.total}{' '}
          questions were filtered out.
        </p>
        {filteredQuestions.reasons.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold">Reasons:</p>
            <ul className="list-disc pl-5 text-sm">
              {filteredQuestions.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
