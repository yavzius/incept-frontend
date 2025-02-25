import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LabelList, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import type { ChartConfig } from './ui/chart';

interface DifficultyPieChartProps {
  difficultyCounts: Record<number, number>;
  totalQuestions: number;
}

export function DifficultyPieChart({
  difficultyCounts,
  totalQuestions,
}: DifficultyPieChartProps) {
  // Convert the difficulty counts to chart data
  const chartData = Object.entries(difficultyCounts)
    .map(([difficulty, count]) => ({
      difficulty: parseInt(difficulty),
      count,
      label: `Level ${difficulty}`,
    }))
    .sort((a, b) => a.difficulty - b.difficulty);

  // Create a chart config for the difficulty levels
  const chartConfig: ChartConfig = {};

  // Define colors for different difficulty levels
  const getColorForDifficulty = (difficulty: number) => {
    if (difficulty <= 2) return 'hsl(var(--chart-2))'; // Green
    if (difficulty <= 4) return 'hsl(var(--chart-3))'; // Blue
    if (difficulty <= 6) return 'hsl(var(--chart-4))'; // Yellow
    return 'hsl(var(--chart-5))'; // Red
  };

  // Add each difficulty level to the chart config
  chartData.forEach((item) => {
    chartConfig[item.difficulty] = {
      label: `Level ${item.difficulty}`,
      color: getColorForDifficulty(item.difficulty),
    };
  });

  // Calculate the percentage change (this is just for display, you can customize this)
  const averageDifficulty =
    chartData.reduce((acc, item) => acc + item.difficulty * item.count, 0) /
    totalQuestions;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Questions by Difficulty</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px] [&_.recharts-text]:fill-foreground"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="difficulty" />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="difficulty"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={2}
                label={({ label, percent }) =>
                  `${label} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.difficulty}`}
                    fill={getColorForDifficulty(entry.difficulty)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <div className="flex-col gap-2 text-sm p-4 text-center">
        <div className="flex items-center justify-center gap-2 font-medium leading-none">
          Average difficulty: {averageDifficulty.toFixed(1)}{' '}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground mt-1">
          Based on {totalQuestions} questions
        </div>
      </div>
    </Card>
  );
}
