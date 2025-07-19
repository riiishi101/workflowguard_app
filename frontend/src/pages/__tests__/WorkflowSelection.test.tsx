import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import WorkflowSelection from '../WorkflowSelection';
import React from 'react';
import apiService from '@/services/api';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/components/AuthContext';
import { PlanProvider } from '@/components/AuthContext';

vi.mock('@/services/api');

const mockWorkflows = [
  { id: '1', name: 'Test Workflow 1', hubspotId: 'hs1', ownerId: 'u1', status: 'active', folder: 'Main', updatedAt: '2024-07-01T12:00:00Z' },
  { id: '2', name: 'Test Workflow 2', hubspotId: 'hs2', ownerId: 'u1', status: 'inactive', folder: 'Secondary', updatedAt: '2024-07-02T12:00:00Z' },
];

describe('WorkflowSelection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders and loads workflows', async () => {
    vi.mocked(apiService.getWorkflows).mockResolvedValue(mockWorkflows);
    render(
      <MemoryRouter>
        <AuthProvider>
          <PlanProvider>
          <WorkflowSelection />
          </PlanProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Test Workflow 1/i)).toBeInTheDocument());
    expect(screen.getByText(/Test Workflow 2/i)).toBeInTheDocument();
  });

  it('shows empty state if no workflows', async () => {
    vi.mocked(apiService.getWorkflows).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <AuthProvider>
          <PlanProvider>
          <WorkflowSelection />
          </PlanProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/no workflows found/i)).toBeInTheDocument());
  });

  it('shows error state on API error', async () => {
    vi.mocked(apiService.getWorkflows).mockRejectedValue(new Error('API fail'));
    render(
      <MemoryRouter>
        <AuthProvider>
          <PlanProvider>
          <WorkflowSelection />
          </PlanProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/failed to fetch workflows/i)).toBeInTheDocument());
  });
}); 