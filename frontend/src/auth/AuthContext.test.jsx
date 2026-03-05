import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('AuthContext', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows Welcome when /api/auth/me returns user', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' })),
        });
      }
      return Promise.reject(new Error('Unexpected request: ' + url));
    });
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome, alice/)).toBeInTheDocument();
    });
  });

  it('redirects to /login when logged out and visiting /', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      return Promise.reject(new Error('Unexpected request: ' + url));
    });
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    });
  });

  it('redirects to / when logged in and visiting /login', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice' })),
        });
      }
      return Promise.reject(new Error('Unexpected request: ' + url));
    });
    window.history.pushState({}, '', '/login');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome, alice/)).toBeInTheDocument();
    });
  });
});
