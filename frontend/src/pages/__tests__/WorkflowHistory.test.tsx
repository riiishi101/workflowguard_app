// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkflowHistory from '../WorkflowHistory';
import apiService from '@/services/api';
import { AuthProvider, PlanProvider } from '@/components/AuthContext';
import { vi } from 'vitest';

// Mock the API service
vi.mock('@/services/api', () => ({
  default: {
    getWorkflowById: vi.fn(),
    getWorkflowVersions: vi.fn(),
  },
}));

const mockWorkflow = { id: 'w1', name: 'Customer Onboarding', status: 'active', hubspotId: 'hs1', ownerId: 'u1' };
const mockVersions = [
  { id: 'v1', workflowId: 'w1', versionNumber: 1, snapshotType: 'Manual Snapshot', notes: 'Initial', createdAt: '2024-07-01', createdBy: 'u1', data: {} },
  { id: 'v2', workflowId: 'w1', versionNumber: 2, snapshotType: 'Manual Snapshot', notes: 'Update', createdAt: '2024-07-02', createdBy: 'u1', data: {} },
];

describe('WorkflowHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderWithAuth() {
    return render(
      <MemoryRouter initialEntries={["/workflow-history/w1"]}>
        <AuthProvider>
          <PlanProvider>
            <WorkflowHistory />
          </PlanProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it('renders and loads workflow versions', async () => {
    const getWorkflowByIdSpy = vi.spyOn(apiService, 'getWorkflowById').mockResolvedValue(mockWorkflow);
    const getWorkflowVersionsSpy = vi.spyOn(apiService, 'getWorkflowVersions').mockResolvedValue(mockVersions);
    
    renderWithAuth();
    
    await waitFor(() => expect(screen.getByText((content) => /Customer Onboarding/i.test(content))).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1, name: /Workflow History/i })).toBeInTheDocument();
    
    // Wait for versions to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText((_, node) => node?.textContent?.includes('Initial'))).toBeInTheDocument();
      expect(screen.getByText((_, node) => node?.textContent?.includes('Update'))).toBeInTheDocument();
    });
    
    // Verify API calls were made
    expect(getWorkflowByIdSpy).toHaveBeenCalledWith('w1');
    expect(getWorkflowVersionsSpy).toHaveBeenCalledWith('w1');
  });

  it('shows empty state if no versions', async () => {
    vi.spyOn(apiService, 'getWorkflowById').mockResolvedValue(mockWorkflow);
    vi.spyOn(apiService, 'getWorkflowVersions').mockResolvedValue([]);
    
    renderWithAuth();
    
    await waitFor(() => expect(screen.getByText(/No Workflow History Yet/i)).toBeInTheDocument());
  });

  it('shows error state on API error', async () => {
    vi.spyOn(apiService, 'getWorkflowById').mockRejectedValue(new Error('API Error'));
    vi.spyOn(apiService, 'getWorkflowVersions').mockRejectedValue(new Error('API Error'));
    
    renderWithAuth();
    
    await waitFor(() => expect(screen.getByText('API Error')).toBeInTheDocument());
  });
}); 