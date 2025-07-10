/// <reference types="vitest/globals" />
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    vi.clearAllMocks();
    // Mock successful API response
    (apiService.getBusinessIntelligence as any).mockResolvedValue(mockAnalyticsData);
  });

  it('renders analytics dashboard with loading state', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    // Should show loading skeletons initially
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gain insights into your WorkflowGuard usage, billing, and performance')).toBeInTheDocument();
    
    // Should show refresh button
    expect(screen.getByRole('button', { name: /refresh analytics data/i })).toBeInTheDocument();
  });

  it('renders analytics data when API call succeeds', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Workflows Monitored')).toBeInTheDocument();
      expect(screen.getByText('6,800')).toBeInTheDocument(); // Total workflows from mock data
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch analytics data';
    (apiService.getBusinessIntelligence as any).mockRejectedValue(new Error(errorMessage));
    
    renderWithProviders(<AnalyticsDashboard />);
    
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
    renderWithProviders(<AnalyticsDashboard />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh analytics data/i });
    
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
    
    fireEvent.click(refreshButton);
    
    // Should call API again
    expect(apiService.getBusinessIntelligence).toHaveBeenCalledTimes(2);
  });

  it('shows filter controls', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/select date range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select plan filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select portal filter/i)).toBeInTheDocument();
    });
  });

  it('renders charts section with data', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Workflow Monitoring Trend')).toBeInTheDocument();
      expect(screen.getByText('Plan Distribution')).toBeInTheDocument();
      expect(screen.getByText('150 total users')).toBeInTheDocument();
    });
  });

  it('renders analytics table with data', async () => {
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Detailed Analytics')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });
  });

  it('handles empty analytics data gracefully', async () => {
    (apiService.getBusinessIntelligence as any).mockResolvedValue({
      overview: null,
      usageTrends: [],
      userAnalytics: [],
    });
    
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No metrics available. Please check your data sources.')).toBeInTheDocument();
      expect(screen.getByText('No chart data available. Data will appear once usage patterns are established.')).toBeInTheDocument();
      expect(screen.getByText('No analytics data available. Data will appear once users start using the platform.')).toBeInTheDocument();
    });
  });

  it('shows upgrade modal for users without advanced monitoring feature', async () => {
    // Mock the usePlan hook to return false for hasFeature
    vi.doMock('@/components/AuthContext', async () => {
      const actual = await vi.importActual('@/components/AuthContext');
      return {
        ...actual,
        usePlan: () => ({
          plan: { planId: 'starter' },
          hasFeature: () => false,
          isTrialing: () => false,
        }),
        useAuth: () => ({
          user: { email: 'test@example.com' },
        }),
      };
    });
    
    renderWithProviders(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Unlock Premium Features')).toBeInTheDocument();
    });
  });
}); 