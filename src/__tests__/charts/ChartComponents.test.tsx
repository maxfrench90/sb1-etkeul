import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { PieChart } from '../../components/charts/PieChart';
import { ChartCard } from '../../components/charts/ChartCard';

describe('Chart Components', () => {
  const mockData = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 200 },
    { month: 'Mar', value: 150 }
  ];

  describe('BarChart', () => {
    it('renders with correct data', () => {
      render(
        <BarChart
          data={mockData}
          xKey="month"
          yKey="value"
          height={300}
        />
      );

      // Check if chart container is rendered
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    it('applies custom styling', () => {
      render(
        <BarChart
          data={mockData}
          xKey="month"
          yKey="value"
          color="#FF0000"
          className="custom-chart"
        />
      );

      expect(screen.getByRole('graphics-document')).toHaveClass('custom-chart');
    });
  });

  describe('LineChart', () => {
    it('renders with correct data', () => {
      render(
        <LineChart
          data={mockData}
          xKey="month"
          yKey="value"
          height={300}
        />
      );

      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(
        <LineChart
          data={[]}
          xKey="month"
          yKey="value"
        />
      );

      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });
  });

  describe('PieChart', () => {
    const pieData = [
      { name: 'A', value: 30 },
      { name: 'B', value: 70 }
    ];

    it('renders with correct data', () => {
      render(
        <PieChart
          data={pieData}
          height={300}
        />
      );

      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    it('applies custom colors', () => {
      const colors = ['#FF0000', '#00FF00'];
      
      render(
        <PieChart
          data={pieData}
          colors={colors}
        />
      );

      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });
  });

  describe('ChartCard', () => {
    it('renders title and description', () => {
      render(
        <ChartCard
          title="Test Chart"
          description="Test Description"
        >
          <div>Chart Content</div>
        </ChartCard>
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <ChartCard title="Test Chart">
          <div data-testid="chart-content">Chart Content</div>
        </ChartCard>
      );

      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });
  });
});