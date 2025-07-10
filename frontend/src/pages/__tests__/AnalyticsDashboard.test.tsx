/// <reference types="vitest/globals" />
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AnalyticsDashboard from '../AnalyticsDashboard';
import apiService from '@/services/api';
import { AuthProvider, PlanProvider } from '@/components/AuthContext';

// Mock the API service
vi.mock('@/services/api', () => ({
  default: {
    getBusinessIntelligence: vi.fn(),
  },
}));

// Mock the toast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Polyfill ResizeObserver for recharts in jsdom
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// Dynamic mock for usePlan
let mockHasFeature = () => true;
let mockPlan = { planId: 'professional', trialPlanId: 'trial' };
let mockIsTrialing = () => false;

vi.mock('@/components/AuthContext', async () => {
  const actual = await vi.importActual('@/components/AuthContext');
  return {
    ...actual,
    usePlan: () => ({
      plan: mockPlan,
      hasFeature: mockHasFeature,
      isTrialing: mockIsTrialing,
    }),
    useAuth: () => ({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        hubspotPortalId: '12345',
      },
      token: 'mock-token',
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
    AuthProvider: actual.AuthProvider,
    PlanProvider: actual.PlanProvider,
  };
});

const mockAnalyticsData = {
  overview: {
    totalUsers: 150,
    activeUsers: 120,
    usersWithOverages: 45,
    conversionRate: 30.0,
    totalRevenue: 15000,
    monthlyRevenue: 2500,
    revenueGrowth: 15.5,
  },
  usageTrends: [
    { period: 'Jan', totalWorkflows: 1200 },
    { period: 'Feb', totalWorkflows: 1350 },
    { period: 'Mar', totalWorkflows: 1100 },
    { period: 'Apr', totalWorkflows: 1400 },
    { period: 'May', totalWorkflows: 1600 },
    { period: 'Jun', totalWorkflows: 1800 },
  ],
  userAnalytics: [
    {
      userId: '1',
      email: 'user1@example.com',
      planId: 'professional',
      totalWorkflows: 25,
      totalOverages: 3,
      totalRevenue: 150,
      riskLevel: 'medium',
    },
    {
      userId: '2',
      email: 'user2@example.com',
      planId: 'starter',
      totalWorkflows: 10,
      totalOverages: 1,
      totalRevenue: 50,
      riskLevel: 'low',
    },
  ],
  planDistribution: {
    'Starter': 60,
    'Professional': 80,
    'Enterprise': 10,
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          {component}
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    mockHasFeature = () => true;
    mockPlan = { planId: 'professional', trialPlanId: 'trial' };
    mockIsTrialing = () => false;
    vi.clearAllMocks();
    // Mock successful API response
    (apiService.getBusinessIntelligence as any).mockResolvedValue(mockAnalyticsData);
  });

  it('renders analytics dashboard with loading state', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    // Should show loading skeletons initially
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gain insights into your WorkflowGuard usage, billing, and performance')).toBeInTheDocument();
    
    // Should show refresh button
    expect(screen.getByRole('button', { name: /refresh analytics data/i })).toBeInTheDocument();
  });

  it('renders analytics data when API call succeeds', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Total Workflows Monitored')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Total Revenue').length).toBeGreaterThan(0);
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch analytics data';
    (apiService.getBusinessIntelligence as any).mockRejectedValue(new Error(errorMessage));
    
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
      duration: 5000,
    });
  });

  it('allows refreshing analytics data', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    const refreshButton = screen.getByRole('button', { name: /refresh analytics data/i });
    
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // Should call API again
    expect(apiService.getBusinessIntelligence).toHaveBeenCalledTimes(2);
  });

  it('shows filter controls', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/select date range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select plan filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select portal filter/i)).toBeInTheDocument();
    });
  });

  it('renders charts section with data', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    await waitFor(() => {
      expect(screen.queryAllByText((content, node) => node?.textContent === 'Workflow Monitoring Trend').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === 'Plan Distribution').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === '150 total users').length).toBeGreaterThan(0);
    });
  });

  it('renders analytics table with data', async () => {
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    
    await waitFor(() => {
      expect(screen.queryAllByText((content, node) => node?.textContent === 'Detailed Analytics').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === 'user1@example.com').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === 'user2@example.com').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === 'Professional').length).toBeGreaterThan(0);
      expect(screen.queryAllByText((content, node) => node?.textContent === 'Starter').length).toBeGreaterThan(0);
    });
  });

  it('handles empty analytics data gracefully', async () => {
    (apiService.getBusinessIntelligence as any).mockResolvedValue({
      overview: null,
      usageTrends: [],
      userAnalytics: [],
    });
    
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    const emptyMessages = await screen.findAllByText((_, node) => node?.textContent?.includes('No metrics available. Please check your data sources.'));
    expect(emptyMessages.length).toBeGreaterThan(0);
  });

  it('shows upgrade modal for users without advanced monitoring feature', async () => {
    mockHasFeature = () => false;
    mockPlan = { planId: 'basic', trialPlanId: 'trial' };
    const { default: AnalyticsDashboard } = await import('../AnalyticsDashboard');
    await act(async () => {
      renderWithProviders(<AnalyticsDashboard />);
    });
    expect(await screen.findByTestId('upgrade-modal')).toBeInTheDocument();
  });
}); 