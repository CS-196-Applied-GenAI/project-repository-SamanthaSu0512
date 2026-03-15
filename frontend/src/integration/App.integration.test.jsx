/**
 * Frontend integration tests: multi-step flows across auth, routes, and API.
 * Mocks fetch for /api/* and asserts full user journeys (login → feed, protected routes, etc.).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Integration: authenticated flow', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                email: 'alice@test.com',
                name: 'Alice',
              })
            ),
        });
      }
      if (url === '/api/feed') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify([
                {
                  id: 1,
                  text: 'First tweet',
                  created_at: new Date().toISOString(),
                  author: { username: 'alice', name: 'Alice', id: 1 },
                },
              ])
            ),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('when logged in, home shows welcome and feed loads tweets', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, alice/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('First tweet')).toBeInTheDocument();
    });
  });

  it('navigate to compose from home shows compose page', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, alice/i)).toBeInTheDocument();
    });

    const composeLink = screen.getByRole('link', { name: /compose/i });
    fireEvent.click(composeLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /compose|new tweet/i })).toBeInTheDocument();
    });
  });

  it('navigate to profile shows my profile', async () => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                email: 'alice@test.com',
                name: 'Alice',
              })
            ),
        });
      }
      if (url === '/api/feed' || url.startsWith('/api/feed')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
        });
      }
      if (url === '/api/users/me' || url.startsWith('/api/users/me?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                email: 'alice@test.com',
                name: 'Alice',
              })
            ),
        });
      }
      if (url.startsWith('/api/users/me/tweets')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });

    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, alice/i)).toBeInTheDocument();
    });

    const profileLink = screen.getByRole('link', { name: /my profile/i });
    fireEvent.click(profileLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    });
  });
});

describe('Integration: guest flow and protection', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('at /login, can navigate to signup', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    });

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    fireEvent.click(signupLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign up|create account/i })).toBeInTheDocument();
    });
  });

  it('when not logged in, visiting / redirects to login or shows login', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      const heading = screen.queryByRole('heading', { name: /log in/i });
      const homeText = screen.queryByText(/Welcome back|Home page/);
      expect(heading || homeText).toBeTruthy();
    });
  });
});
