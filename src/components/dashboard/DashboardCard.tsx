import React from 'react';
import { Activity, LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

export function DashboardCard({ title, value, icon: Icon, trend, trendValue }: DashboardCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const TrendIcon = trend === 'up' ? Icon : trend === 'down' ? Icon : Activity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900 rounded-full">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <TrendIcon className={`h-4 w-4 ${trendColors[trend]}`} />
        <span className={`ml-2 text-sm ${trendColors[trend]}`}>
          {trendValue}
        </span>
      </div>
    </div>
  );
}