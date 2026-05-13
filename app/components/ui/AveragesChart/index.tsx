'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatTime } from '../../../lib/stats';
import type { AveragesOverTime } from '../../../lib/stats';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type ViewMode = '30days' | 'ytd' | '12months';

interface AveragesChartProps {
  data: AveragesOverTime | null;
  isLoading?: boolean;
}

const VIEW_LABELS: Record<ViewMode, string> = {
  '30days': '30 Days',
  'ytd': 'Year to Date',
  '12months': '12 Months',
};

export default function AveragesChart({ data, isLoading }: AveragesChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('30days');
  const { resolvedTheme } = useTheme();
  const [chartColors, setChartColors] = useState({
    line: '',
    periodAvg: '',
    totalAvg: '',
    grid: '',
    tick: '',
  });

  // Read colors from CSS custom properties so chart stays in sync with theme tokens
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setChartColors({
      line: styles.getPropertyValue('--color-primary').trim(),
      periodAvg: styles.getPropertyValue('--color-foreground').trim(),
      totalAvg: styles.getPropertyValue('--color-set-purple').trim(),
      grid: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      tick: styles.getPropertyValue('--color-muted-foreground').trim(),
    });
  }, [resolvedTheme]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[250px]">
        <span className="text-muted-foreground">Loading chart...</span>
      </div>
    );
  }

  const dataset = data
    ? viewMode === '30days' ? data.daily
      : viewMode === 'ytd' ? data.ytd
      : data.monthly
    : [];

  const hasData = dataset.some(p => p.avgTime !== null);

  if (!data || !hasData) {
    return (
      <div>
        <ToggleButtons viewMode={viewMode} setViewMode={setViewMode} />
        <div className="flex justify-center items-center h-[250px]">
          <span className="text-muted-foreground">No completion data yet</span>
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const lineColor = chartColors.line;
  const periodAvgColor = chartColors.periodAvg;
  const totalAvgColor = chartColors.totalAvg;
  const gridColor = chartColors.grid;
  const tickColor = chartColors.tick;

  const chartData = {
    labels: dataset.map(p => p.label),
    datasets: [
      {
        label: 'Daily Score',
        data: dataset.map(p => p.avgTime),
        borderColor: lineColor,
        backgroundColor: lineColor,
        pointBackgroundColor: lineColor,
        pointRadius: viewMode === '30days' ? 3 : 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'Period Avg',
        data: dataset.map(p => p.runningAvg),
        borderColor: periodAvgColor,
        backgroundColor: periodAvgColor,
        pointBackgroundColor: periodAvgColor,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        borderDash: [6, 3],
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'Total Avg',
        data: dataset.map(p => p.totalAvg),
        borderColor: totalAvgColor,
        backgroundColor: totalAvgColor,
        pointBackgroundColor: totalAvgColor,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        borderDash: [2, 2],
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: tickColor,
          usePointStyle: true,
          generateLabels: (chart: any) => {
            return chart.data.datasets.map((ds: any, i: number) => ({
              text: ds.label,
              pointStyle: 'line',
              strokeStyle: ds.borderColor,
              fillStyle: ds.borderColor,
              lineDash: ds.borderDash || [],
              lineWidth: ds.borderWidth || 2,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            const prefix = ctx.dataset.label || '';
            return val != null ? `${prefix}: ${formatTime(val)}` : `${prefix}: No data`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: viewMode === '30days' ? 10 : 12,
        },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          callback: (value: any) => formatTime(value),
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <div>
      <ToggleButtons viewMode={viewMode} setViewMode={setViewMode} />
      <div className="h-[250px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

function ToggleButtons({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex mb-4 rounded-lg overflow-hidden border border-border">
      {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
            viewMode === mode
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {VIEW_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
