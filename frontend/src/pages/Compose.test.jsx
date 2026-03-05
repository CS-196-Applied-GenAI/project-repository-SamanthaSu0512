import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Compose', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url, options) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice' })),
        });
      }
      if (url === '/api/tweets' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          text: () => Promise.resolve(JSON.stringify({ id: 1, text: 'My new tweet', user_id: 1 })),
        });
      }
      if (url === '/api/feed') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([])),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts tweet and redirects to / on 201', async () => {
    window.history.pushState({}, '', '/compose');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /what's happening/i })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('textbox', { name: /what's happening/i }), {
      target: { value: 'My new tweet' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^post$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tweets',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ text: 'My new tweet' }),
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Welcome, alice/)).toBeInTheDocument();
    });
  });

  it('shows error when text is empty', async () => {
    window.history.pushState({}, '', '/compose');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /what's happening/i })).toBeInTheDocument();
    });
    const form = screen.getByRole('textbox').closest('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
    });
    const tweetCalls = global.fetch.mock.calls.filter((c) => c[0] === '/api/tweets' && c[1]?.method === 'POST');
    expect(tweetCalls.length).toBe(0);
  });
});
