import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/utils';
import { DataExport } from '../../components/data/DataExport';

describe('DataExport', () => {
  const mockData = [
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'inactive' }
  ];

  const mockColumns = [
    { key: 'name', label: 'Name', exportable: true },
    { key: 'status', label: 'Status', exportable: true },
    { key: 'internal_id', label: 'Internal ID', exportable: false }
  ];

  it('renders export options', () => {
    renderWithProviders(
      <DataExport
        isOpen={true}
        onClose={() => {}}
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('handles column selection', () => {
    renderWithProviders(
      <DataExport
        isOpen={true}
        onClose={() => {}}
        data={mockData}
        columns={mockColumns}
      />
    );

    const nameCheckbox = screen.getByLabelText('Name');
    fireEvent.click(nameCheckbox);
    expect(nameCheckbox).not.toBeChecked();

    // Non-exportable columns should be disabled
    const internalIdCheckbox = screen.getByLabelText('Internal ID');
    expect(internalIdCheckbox).toBeDisabled();
  });

  it('exports data in selected format', async () => {
    const createObjectURL = vi.fn();
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    renderWithProviders(
      <DataExport
        isOpen={true}
        onClose={() => {}}
        data={mockData}
        columns={mockColumns}
      />
    );

    // Select CSV format and export
    fireEvent.click(screen.getByText('CSV'));
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
    });

    // Cleanup
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('shows progress during export', async () => {
    renderWithProviders(
      <DataExport
        isOpen={true}
        onClose={() => {}}
        data={mockData}
        columns={mockColumns}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Exporting data...')).toBeInTheDocument();
    });
  });
});