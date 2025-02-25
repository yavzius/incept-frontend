import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import type { ChartConfig } from './ui/chart';

interface ErrorDimensionsRadarChartProps {
  errorDimensions: Record<string, number>;
  totalErrors: number;
}

export function ErrorDimensionsRadarChart({
  errorDimensions,
  totalErrors,
}: ErrorDimensionsRadarChartProps) {
  // Convert the error dimensions to chart data
  const chartData = Object.entries(errorDimensions)
    .map(([dimension, count]) => ({
      dimension,
      count,
      percentage: Math.round((count / totalErrors) * 100),
    }))
    .sort((a, b) => b.count - a.count); // Sort by count in descending order

  // Create a chart config
  const chartConfig: ChartConfig = {
    count: {
      label: 'Error Count',
      color: 'hsl(var(--chart-5))', // Red color
    },
  };

  // Calculate the most common error dimension
  const mostCommonError =
    chartData.length > 0 ? chartData[0].dimension : 'None';

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Error Dimensions</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        {chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-foreground"
          >
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={chartData}>
                <ChartTooltip
                  content={
                    <ChartTooltipContent nameKey="dimension" hideLabel={true} />
                  }
                />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{
                    fontSize: 10,
                    fill: 'currentColor',
                  }}
                  tickFormatter={(value: string) =>
                    value.length > 12 ? `${value.substring(0, 10)}...` : value
                  }
                />
                <PolarGrid />
                <Radar
                  name="Error Count"
                  dataKey="count"
                  stroke="hsl(var(--chart-5))"
                  fill="hsl(var(--chart-5))"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                    fill: 'hsl(var(--chart-5))',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No error data available
          </div>
        )}
      </CardContent>
      <div className="flex-col gap-2 text-sm p-4 text-center">
        <div className="flex items-center justify-center gap-2 font-medium leading-none">
          Most common: {mostCommonError} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground mt-1">
          Based on {totalErrors} errors across {chartData.length} dimensions
        </div>
      </div>
    </Card>
  );
}
