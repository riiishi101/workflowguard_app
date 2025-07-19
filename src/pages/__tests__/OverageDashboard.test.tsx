import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import apiService from '@/services/api';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import OverageDashboard from '@/pages/OverageDashboard';
import { PlanProvider } from '@/components/AuthContext';

const mockUser = { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' };
const summary = {
  totalOverages: 1000,
  unbilledOverages: 200,
  usersWithOverages: 3,
  overagePeriods: 5,
};
const unbilledOverages = [
  { id: 'o1', user: { name: 'User1', email: 'u1@example.com' }, type: 'API', amount: 100, periodStart: '2024-07-01', createdAt: '2024-07-02' },
];
const allOverages = [
  ...unbilledOverages,
  { id: 'o2', user: { name: 'User2', email: 'u2@example.com' }, type: 'Workflow', amount: 900, periodStart: '2024-06-01', createdAt: '2024-06-02', billed: true },
];

// Mock useAuth to always return mockUser
vi.mock('@/components/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useAuth: () => ({ user: mockUser }),
  });
});


function renderWithAuth() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PlanProvider>
        <OverageDashboard />
        </PlanProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('OverageDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockReturnValue(new Promise(() => {}));
    renderWithAuth();
    expect(screen.getByText(/loading overage data/i)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockRejectedValue(new Error('fail'));
    vi.spyOn(apiService, 'getUnbilledOverages').mockResolvedValue([]);
    vi.spyOn(apiService, 'getAllOverages').mockResolvedValue([]);
    renderWithAuth();
    await waitFor(() => expect(screen.getByText(/fail/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders metrics and tables with data', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockResolvedValue(summary);
    vi.spyOn(apiService, 'getUnbilledOverages').mockResolvedValue(unbilledOverages);
    vi.spyOn(apiService, 'getAllOverages').mockResolvedValue(allOverages);
    renderWithAuth();
    await waitFor(() => expect(screen.getAllByText(/overage dashboard/i)[0]).toBeInTheDocument());
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/unbilled overages \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('User1')).toBeInTheDocument();
    expect(screen.getByText('u1@example.com')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('Mark as Billed')).toBeInTheDocument();
    expect(screen.getByText(/all overages/i)).toBeInTheDocument();
    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByText('$900')).toBeInTheDocument();
  });

  it('filters by billing status', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockResolvedValue(summary);
    vi.spyOn(apiService, 'getUnbilledOverages').mockResolvedValue(unbilledOverages);
    vi.spyOn(apiService, 'getAllOverages').mockResolvedValue(allOverages);
    renderWithAuth();
    await waitFor(() => expect(screen.getByText(/overage dashboard/i)).toBeInTheDocument());
    const billingSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.change(billingSelect, { target: { value: 'billed' } });
    // Should trigger fetchData with billed filter (mocked)
  });

  it('marks overage as billed', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockResolvedValue(summary);
    vi.spyOn(apiService, 'getUnbilledOverages').mockResolvedValue(unbilledOverages);
    vi.spyOn(apiService, 'getAllOverages').mockResolvedValue(allOverages);
    const markSpy = vi.spyOn(apiService, 'markOverageAsBilled').mockResolvedValue({});
    renderWithAuth();
    await waitFor(() => expect(screen.getByText('Mark as Billed')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Mark as Billed'));
    await waitFor(() => expect(markSpy).toHaveBeenCalledWith('o1'));
  });

  it('refreshes data', async () => {
    vi.spyOn(apiService, 'getOverageSummary').mockResolvedValue(summary);
    vi.spyOn(apiService, 'getUnbilledOverages').mockResolvedValue(unbilledOverages);
    vi.spyOn(apiService, 'getAllOverages').mockResolvedValue(allOverages);
    renderWithAuth();
    await waitFor(() => expect(screen.getByText(/refresh data/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/refresh data/i));
    // Should trigger fetchData (mocked)
  });
}); 