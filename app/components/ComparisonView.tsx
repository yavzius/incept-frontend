import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import type { ComparisonResult, ScoreCardDimension } from '../lib/questionApi';

interface ComparisonViewProps {
  result: ComparisonResult;
}

// Helper function to detect differences between dimensions
function findDifferences(
  standardDimensions: ScoreCardDimension[],
  compactDimensions: ScoreCardDimension[]
): Record<string, { standard: boolean; compact: boolean }> {
  const differences: Record<string, { standard: boolean; compact: boolean }> =
    {};

  // Create maps for faster lookup
  const standardMap = new Map(
    standardDimensions.map((dim) => [dim.name, dim.passed])
  );
  const compactMap = new Map(
    compactDimensions.map((dim) => [dim.name, dim.passed])
  );

  // Check standard dimensions
  standardDimensions.forEach((dim) => {
    const compactPassed = compactMap.get(dim.name);
    if (compactPassed !== undefined && compactPassed !== dim.passed) {
      differences[dim.name] = {
        standard: dim.passed,
        compact: compactPassed,
      };
    }
  });

  // Check for dimensions only in compact
  compactDimensions.forEach((dim) => {
    if (!standardMap.has(dim.name)) {
      differences[dim.name] = {
        standard: false, // Not present in standard
        compact: dim.passed,
      };
    }
  });

  return differences;
}

export function ComparisonView({ result }: ComparisonViewProps) {
  // Check if both responses are available
  const hasStandardResponse = !result.isLoading && result.response;
  const hasCompactResponse = !result.isCompactLoading && result.compactResponse;

  // Extract pass/fail status
  const standardPassed = hasStandardResponse
    ? result.response?.scorecard.overall_pass
    : undefined;
  const compactPassed = hasCompactResponse
    ? result.compactResponse?.scorecard.overall_pass
    : undefined;

  // Detect differences in dimensions if both responses are available
  const differences =
    hasStandardResponse && hasCompactResponse
      ? findDifferences(
          result.response?.scorecard.dimensions || [],
          result.compactResponse?.scorecard.dimensions || []
        )
      : {};

  const hasDifferences = Object.keys(differences).length > 0;

  return (
    <div className="comparison-view">
      <h3 className="text-lg font-semibold mb-2">Comparison Results</h3>

      {/* Overall Results Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card
          className={`${
            standardPassed
              ? 'bg-green-50'
              : standardPassed === false
              ? 'bg-red-50'
              : ''
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Standard API</CardTitle>
            <CardDescription>
              {result.isLoading
                ? 'Loading...'
                : result.error
                ? 'Error: ' + result.error
                : standardPassed
                ? 'Passed'
                : 'Failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasStandardResponse && (
              <div className="text-sm">
                <div>
                  <strong>Status:</strong> {result.response?.status}
                </div>
                <div>
                  <strong>Dimensions:</strong>{' '}
                  {result.response?.scorecard.dimensions.length}
                </div>
                {result.standardResponseTime !== undefined && (
                  <div>
                    <strong>Response Time:</strong>{' '}
                    {result.standardResponseTime.toFixed(0)} ms
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`${
            compactPassed
              ? 'bg-green-50'
              : compactPassed === false
              ? 'bg-red-50'
              : ''
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Compact API</CardTitle>
            <CardDescription>
              {result.isCompactLoading
                ? 'Loading...'
                : result.compactError
                ? 'Error: ' + result.compactError
                : compactPassed
                ? 'Passed'
                : 'Failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCompactResponse && (
              <div className="text-sm">
                <div>
                  <strong>Status:</strong> {result.compactResponse?.status}
                </div>
                <div>
                  <strong>Dimensions:</strong>{' '}
                  {result.compactResponse?.scorecard.dimensions.length}
                </div>
                {result.compactResponseTime !== undefined && (
                  <div>
                    <strong>Response Time:</strong>{' '}
                    {result.compactResponseTime.toFixed(0)} ms
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Differences Section */}
      {hasDifferences && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Differences Found</h4>
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-yellow-200">
                  <th className="text-left py-1">Dimension</th>
                  <th className="text-center py-1">Standard</th>
                  <th className="text-center py-1">Compact</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(differences).map(
                  ([name, { standard, compact }]) => (
                    <tr key={name} className="border-b border-yellow-100">
                      <td className="py-1">{name}</td>
                      <td className="text-center py-1">
                        <span
                          className={
                            standard ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {standard ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="text-center py-1">
                        <span
                          className={
                            compact ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {compact ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* When both are available but no differences */}
      {hasStandardResponse && hasCompactResponse && !hasDifferences && (
        <div className="bg-green-50 p-3 rounded border border-green-200 mt-4">
          <p className="text-sm text-green-700">
            <span className="font-semibold">Results match:</span> Both endpoints
            returned identical results.
          </p>
        </div>
      )}
    </div>
  );
}

export default ComparisonView;
