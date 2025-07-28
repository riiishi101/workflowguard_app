// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
            <Routes>
              <Route path="/workflow-history/:workflowId" element={<WorkflowHistory />} />
            </Routes>
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
      // Use a function matcher to find the text even if wrapped
      const initial = screen.queryAllByText((content, node) => node?.textContent === 'Initial');
      const update = screen.queryAllByText((content, node) => node?.textContent === 'Update');
      expect(initial.length).toBeGreaterThan(0);
      expect(update.length).toBeGreaterThan(0);
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
    
    let errorFound = false;
    try {
      await waitFor(() => expect(screen.getByTestId('workflow-history-error')).toBeInTheDocument(), { timeout: 2000 });
      errorFound = true;
    } catch (e) {
      // Print the DOM for debugging
       
      console.log('DEBUG DOM:');
      screen.debug();
    }
    expect(errorFound).toBe(true);
  });
}); 