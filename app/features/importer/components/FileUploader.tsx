import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';

interface FileUploaderProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedFileName: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetFileInput: () => void;
}

export function FileUploader({
  fileInputRef,
  selectedFileName,
  handleFileUpload,
  resetFileInput,
}: FileUploaderProps) {
  return (
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
              <span className="text-sm text-gray-500">{selectedFileName}</span>
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
  );
}
