import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Blocked', () => {
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
      if (url === '/api/users/me/blocks') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify([
                {
                  id: 2,
                  username: 'bob',
                  name: 'Bob',
                  profile_picture: null,
                },
              ])
            ),
        });
      }
      if (typeof url === 'string' && url.includes('/api/users/') && url.includes('/block')) {
        return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows loading then blocked users list', async () => {
    window.history.pushState({}, '', '/blocked');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Blocked users/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@bob/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Unblock$/i })).toBeInTheDocument();
  });

  it('shows empty state when no blocked users', async () => {
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
    window.history.pushState({}, '', '/blocked');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/blocked anyone/i)).toBeInTheDocument();
    });
  });

  it('unblock removes user from list', async () => {
    window.history.pushState({}, '', '/blocked');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    const unblockBtn = screen.getByRole('button', { name: /^Unblock$/i });
    fireEvent.click(unblockBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/users\/2\/block/),
        expect.objectContaining({ method: 'DELETE', credentials: 'include' })
      );
    });
    await waitFor(() => {
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });
  });
});
