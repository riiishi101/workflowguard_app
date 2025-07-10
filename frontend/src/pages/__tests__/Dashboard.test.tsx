/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import * as apiService from '@/services/api';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

vi.mock('../../components/ui/select', () => {
  const React = require('react');
  const MockSelect = React.forwardRef(({ value, onValueChange, children, ...props }, ref) => (
    <select
      ref={ref}
      value={value}
      onChange={e => onValueChange?.(e.target.value)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!child) return null;
        if (child.props && child.props.value) {
          return <option value={child.props.value}>{child.props.children}</option>;
        }
        return child;
      })}
    </select>
  ));
  const Passthrough = ({ children }) => <>{children}</>;
  const MockSelectItem = ({ value, children }) => <option value={value}>{children}</option>;
  const MockSelectValue = () => null;
  return {
    __esModule: true,
    Select: MockSelect,
    SelectTrigger: Passthrough,
    SelectContent: Passthrough,
    SelectItem: MockSelectItem,
    SelectValue: MockSelectValue,
  };
});

// Mock AuthContext and Plan
vi.mock('../../components/AuthContext', () => ({
  useRequireAuth: () => {},
  usePlan: () => ({ plan: { id: 'starter' }, hasFeature: () => true, isTrialing: () => false }),
  useAuth: () => ({ user: { id: 'u1', role: 'admin', email: 'test@example.com' } }),
}));

// Mock TopNavigation and modals
vi.mock('../../components/TopNavigation', () => ({ default: () => <div data-testid="top-nav" /> }));
vi.mock('../../components/EmptyDashboard', () => ({ default: () => <div data-testid="empty-dashboard" /> }));
vi.mock('../../components/UpgradeRequiredModal', () => ({ default: () => null }));
vi.mock('../../components/CreateNewWorkflowModal', () => ({ default: () => null }));
// Do NOT mock RollbackConfirmModal so the real modal is rendered

// Mock API methods
const mockWorkflows = [
  { id: '1', name: 'Test Workflow', hubspotId: 'hs1', ownerId: 'u1', createdAt: '', updatedAt: '', owner: { email: 'test@example.com' }, versions: [{ id: 'v1', createdAt: '' }], status: 'Active' },
];
const mockAnalytics = { overview: { activeUsers: 1, conversionRate: 100, totalUsers: 1 } };

vi.spyOn(apiService.default, 'getWorkflows').mockResolvedValue(mockWorkflows);
vi.spyOn(apiService.default, 'getBusinessIntelligence').mockResolvedValue(mockAnalytics);
vi.spyOn(apiService.default, 'deleteWorkflow').mockResolvedValue({});
vi.spyOn(apiService.default, 'rollbackWorkflow').mockResolvedValue({});


describe('Dashboard', () => {
  it('renders dashboard cards and table', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.spyOn(apiService.default, 'getWorkflows').mockRejectedValueOnce(new Error('API Error'));
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });

  it('filters workflows by name', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Test Workflow')).toBeInTheDocument());
    const searchInput = screen.getByPlaceholderText(/search workflows by name/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.getByText('No workflows found')).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('filters workflows by status', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Test Workflow')).toBeInTheDocument());
    const statusSelect = screen.getByRole('combobox');
    // Change to Inactive
    fireEvent.change(statusSelect, { target: { value: 'inactive' } });
    expect(screen.getByText('No workflows found')).toBeInTheDocument();
    // Change back to Active
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('bulk deletes selected workflows', async () => {
    const deleteSpy = vi.spyOn(apiService.default, 'deleteWorkflow').mockResolvedValue({});
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Test Workflow')).toBeInTheDocument());
    // Select the workflow
    const checkbox = screen.getByLabelText(/select workflow test workflow/i);
    fireEvent.click(checkbox);
    // Click delete (button is only visible when selected)
    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
  });

  it('calls rollback API and shows success toast', async () => {
    const rollbackSpy = vi.spyOn(apiService.default, 'rollbackWorkflow').mockResolvedValue({});
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Test Workflow')).toBeInTheDocument());
    // Open rollback modal
    const rollbackButton = screen.getAllByLabelText(/rollback/i)[0];
    await userEvent.click(rollbackButton);
    // Find all elements with 'Confirm Rollback' and click the button
    const confirmButtons = await screen.findAllByText(/confirm rollback/i, {}, { timeout: 2000 });
    const button = confirmButtons.find(el => el.nodeName === 'BUTTON');
    expect(button).toBeDefined();
    await userEvent.click(button!);
    await waitFor(() => expect(rollbackSpy).toHaveBeenCalled());
  });
}); 