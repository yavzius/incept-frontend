import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

interface JsonInputAreaProps {
  jsonInput: string;
  setJsonInput: (value: string) => void;
}

export function JsonInputArea({ jsonInput, setJsonInput }: JsonInputAreaProps) {
  return (
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
  );
}
