import React, { createContext, useContext } from 'react';
import type { TooltipProps } from 'recharts';

export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
  };
}

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextValue | null>(null);

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={className}
        style={
          {
            '--chart-1': '215 25% 27%',
            '--chart-2': '142 72% 29%',
            '--chart-3': '217 91% 60%',
            '--chart-4': '41 100% 50%',
            '--chart-5': '0 84% 60%',
            '--color-chrome': 'hsl(var(--chart-1))',
            '--color-safari': 'hsl(var(--chart-2))',
            '--color-firefox': 'hsl(var(--chart-3))',
            '--color-edge': 'hsl(var(--chart-4))',
            '--color-other': 'hsl(var(--chart-5))',
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function useChartConfig() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartConfig must be used within a ChartContainer');
  }
  return context;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      fill: string;
      [key: string]: any;
    };
  }>;
  nameKey?: string;
  hideLabel?: boolean;
}

export function ChartTooltipContent({
  active,
  payload,
  nameKey,
  hideLabel = false,
}: ChartTooltipContentProps) {
  const { config } = useChartConfig();

  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0];
  const name = nameKey ? data.payload[nameKey] : data.name;
  const value = data.value;
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;
  const label = config[name]?.label || name;
  const color = data.payload.fill || config[name]?.color;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="flex items-center gap-1.5">
        {!hideLabel && (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="flex items-center gap-1">
          {!hideLabel && <span className="font-medium">{label}:</span>}
          <span>{formattedValue}</span>
        </div>
      </div>
    </div>
  );
}

export function ChartTooltip({
  content,
  ...props
}: Omit<TooltipProps<any, any>, 'cursor'> & { content: React.ReactNode }) {
  return (
    <g>
      <foreignObject
        className="overflow-visible"
        width={1}
        height={1}
        {...(props as any)}
      >
        {content}
      </foreignObject>
    </g>
  );
}
