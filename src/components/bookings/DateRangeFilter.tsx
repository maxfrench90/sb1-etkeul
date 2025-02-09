import React from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Button } from '../ui/Button';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangeFilter({ startDate, endDate, onRangeChange }: DateRangeFilterProps) {
  const presetRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 }
  ];

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onRangeChange(start, end);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-wrap gap-2">
        {presetRanges.map(({ label, days }) => (
          <Button
            key={days}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(days)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <DatePicker
            selected={startDate}
            onChange={(date) => onRangeChange(date, endDate)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={new Date()}
            placeholderText="Start Date"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <DatePicker
            selected={endDate}
            onChange={(date) => onRangeChange(startDate, date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            placeholderText="End Date"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}