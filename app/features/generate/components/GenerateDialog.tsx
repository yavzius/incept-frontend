import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { GenerateForm } from './GenerateForm';
import type { GenerateResponse } from '../types';
import type { QuestionResult } from '../../questions/types';

interface GenerateDialogProps {
  results?: QuestionResult[];
  onSuccess?: (response: GenerateResponse) => void;
  onError?: (error: string) => void;
  triggerLabel?: string;
}

export function GenerateDialog({
  results = [],
  onSuccess,
  onError,
  triggerLabel = 'Generate Questions',
}: GenerateDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (response: GenerateResponse) => {
    if (onSuccess) {
      onSuccess(response);
    }
    setOpen(false); // Close the dialog on success
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Questions</DialogTitle>
        </DialogHeader>
        <GenerateForm
          results={results}
          onSuccess={handleSuccess}
          onError={onError}
        />
      </DialogContent>
    </Dialog>
  );
}
