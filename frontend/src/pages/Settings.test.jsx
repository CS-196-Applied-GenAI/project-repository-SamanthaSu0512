import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Settings', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(JSON.stringify({ id: 1, username: 'alice', name: 'Alice' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows Settings title and Blocked users link', async () => {
    window.history.pushState({}, '', '/settings');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Settings$/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Manage your account and preferences/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Privacy & safety/i })).toBeInTheDocument();
    const blockedLink = screen.getByRole('link', { name: /Blocked users/i });
    expect(blockedLink).toBeInTheDocument();
    expect(blockedLink).toHaveAttribute('href', '/blocked');
  });

  it('navigates to blocked page when Blocked users is clicked', async () => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(JSON.stringify({ id: 1, username: 'alice', name: 'Alice' })),
        });
      }
      if (url === '/api/users/me/blocks') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    window.history.pushState({}, '', '/settings');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Settings$/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('link', { name: /Blocked users/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Blocked users/i })).toBeInTheDocument();
    });
  });
});
