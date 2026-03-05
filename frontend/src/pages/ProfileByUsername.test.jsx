import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('ProfileByUsername', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({ id: 1, username: 'alice', name: 'Alice' })
            ),
        });
      }
      if (url === '/api/users/bob') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 2,
                username: 'bob',
                name: 'Bob',
                bio: 'Bob bio',
              })
            ),
        });
      }
      if (url === '/api/users/bob/tweets?limit=5') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
        });
      }
      if (url === '/api/users/2/follow' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      if (url === '/api/users/2/block' && options?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows other user profile and Follow/Block buttons', async () => {
    window.history.pushState({}, '', '/profile/bob');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    expect(screen.getByText(/@bob/)).toBeInTheDocument();
    expect(screen.getByText('Bob bio')).toBeInTheDocument();
    const followBtn = screen.getByRole('button', { name: /^follow$/i });
    const blockBtn = screen.getByRole('button', { name: /^block$/i });
    expect(followBtn).toBeInTheDocument();
    expect(blockBtn).toBeInTheDocument();
    fireEvent.click(followBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/2/follow',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      );
    });
  });
});
