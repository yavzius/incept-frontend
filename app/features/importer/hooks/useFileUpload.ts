import { useState, useRef } from 'react';

interface UseFileUploadReturn {
    selectedFileName: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    resetFileInput: () => void;
}

export function useFileUpload(
    onFileContent: (content: string) => void,
    onError: (message: string) => void
): UseFileUploadReturn {
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                onFileContent(content);
            } catch (err) {
                onError("Failed to read file. Please ensure it's a valid JSON file.");
            }
        };
        reader.readAsText(file);
    };

    const resetFileInput = () => {
        setSelectedFileName(null);
        onFileContent('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        selectedFileName,
        fileInputRef: fileInputRef as React.RefObject<HTMLInputElement>,
        handleFileUpload,
        resetFileInput,
    };
} 