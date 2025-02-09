import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/utils';
import { DataGrid } from '../../components/data/DataGrid';

describe('DataGrid', () => {
  const mockData = [
    { id: '1', name: 'Item 1', status: 'active', created_at: '2024-01-01' },
    { id: '2', name: 'Item 2', status: 'inactive', created_at: '2024-01-02' }
  ];

  const mockColumns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Created At', sortable: true }
  ];

  it('renders data correctly', () => {
    renderWithProviders(
      <DataGrid
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('handles sorting', async () => {
    const onSortChange = vi.fn();

    renderWithProviders(
      <DataGrid
        data={mockData}
        columns={mockColumns}
        onSortChange={onSortChange}
      />
    );

    // Click on sortable column header
    fireEvent.click(screen.getByText('Name'));

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'name',
      direction: 'asc'
    });

    // Click again to change sort direction
    fireEvent.click(screen.getByText('Name'));

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'name',
      direction: 'desc'
    });
  });

  it('handles filtering', async () => {
    const onFilterChange = vi.fn();
    const filterGroups = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { id: 'active', label: 'Active', value: 'active' },
          { id: 'inactive', label: 'Inactive', value: 'inactive' }
        ]
      }
    ];

    renderWithProviders(
      <DataGrid
        data={mockData}
        columns={mockColumns}
        filterGroups={filterGroups}
        onFilterChange={onFilterChange}
      />
    );

    // Open filter dropdown
    fireEvent.click(screen.getByText('Status'));
    fireEvent.click(screen.getByText('Active'));

    expect(onFilterChange).toHaveBeenCalledWith({
      status: 'active'
    });
  });

  it('handles empty state', () => {
    renderWithProviders(
      <DataGrid
        data={[]}
        columns={mockColumns}
        emptyStateProps={{
          title: 'No data found',
          description: 'Try adjusting your filters'
        }}
      />
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('handles row selection', () => {
    const onRowClick = vi.fn();

    renderWithProviders(
      <DataGrid
        data={mockData}
        columns={mockColumns}
        onRowClick={onRowClick}
      />
    );

    fireEvent.click(screen.getByText('Item 1'));

    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });
});