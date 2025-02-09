import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className = '' }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <Tooltip content={description}>
            <Info className="w-5 h-5 text-gray-400" />
          </Tooltip>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}