import React from 'react';
import type { FilterType } from '../types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu';

interface FilterBarProps {
  errorCount: number;
  successCount: number;
  loadingCount: number;
  activeFilter: FilterType;
  toggleFilter: (filterType: FilterType) => void;
  standards?: string[];
  standardCounts?: Record<string, number>;
  selectedStandard?: string | null;
  setStandardFilter?: (standard: string | null) => void;
}

export function FilterBar({
  errorCount,
  successCount,
  loadingCount,
  activeFilter,
  toggleFilter,
  standards = [],
  standardCounts = {},
  selectedStandard = null,
  setStandardFilter = () => {},
}: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {errorCount > 0 && (
        <div
          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
            activeFilter === 'errors'
              ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50'
          }`}
          onClick={() => toggleFilter('errors')}
        >
          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-red-100 text-red-500">
            <span className="text-xs">✗</span>
          </div>
          <span className="font-medium">{errorCount}</span>
          {activeFilter === 'errors' && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
        </div>
      )}

      {/* Success filter card */}
      {successCount > 0 && (
        <div
          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
            activeFilter === 'success'
              ? 'bg-green-100 border-green-300 text-green-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50'
          }`}
          onClick={() => toggleFilter('success')}
        >
          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-green-100 text-green-500">
            <span className="text-xs">✓</span>
          </div>
          <span className="font-medium">{successCount}</span>
          {activeFilter === 'success' && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
        </div>
      )}

      {/* Loading filter card */}
      {loadingCount > 0 && (
        <div
          className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
            activeFilter === 'loading'
              ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50'
          }`}
          onClick={() => toggleFilter('loading')}
        >
          <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-blue-100 text-blue-500">
            <div className="animate-spin h-3 w-3 border-b-2 border-blue-500 rounded-full"></div>
          </div>
          <span className="font-medium">{loadingCount}</span>
          {activeFilter === 'loading' && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
        </div>
      )}

      {/* Standards filter dropdown */}
      {standards.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={`flex items-center px-2 py-1 rounded border text-xs cursor-pointer transition-all duration-200 ${
                activeFilter === 'standard'
                  ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-purple-50'
              }`}
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5 bg-purple-100 text-purple-500">
                <span className="text-xs">S</span>
              </div>
              <span className="font-medium">
                {activeFilter === 'standard' && selectedStandard
                  ? `${selectedStandard} (${
                      standardCounts[selectedStandard] || 0
                    })`
                  : 'Standards'}
              </span>
              {activeFilter === 'standard' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {selectedStandard && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStandardFilter(null)}>
                  Clear filter
                </DropdownMenuItem>
              </>
            )}
            {standards.map((standard) => (
              <DropdownMenuItem
                key={standard}
                className={`flex justify-between items-center ${
                  selectedStandard === standard ? 'bg-purple-50' : ''
                }`}
                onClick={() => setStandardFilter(standard)}
              >
                <span>{standard}</span>
                <span className="text-xs text-gray-500">
                  {standardCounts[standard] || 0}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
