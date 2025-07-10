import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TopNavigation from './TopNavigation';

// Mock useAuth to provide a user
vi.mock('./AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useAuth: () => ({ user: { name: 'Test User', email: 'test@example.com', role: 'admin' }, logout: vi.fn() }),
  });
});

describe('TopNavigation', () => {
  it('renders without crashing inside BrowserRouter', () => {
    render(
      <BrowserRouter>
        <TopNavigation />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });
}); 