import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('Replies', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice' })),
        });
      }
      if (url === '/api/tweets/1/replies') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify([
                {
                  id: 2,
                  text: 'First reply',
                  created_at: new Date().toISOString(),
                  author: { username: 'bob' },
                },
              ])
            ),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches and shows replies and Reply link', async () => {
    window.history.pushState({}, '', '/tweet/1/replies');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Replies to tweet #1/)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /reply to this tweet/i })).toHaveAttribute(
      'href',
      '/tweet/1/reply'
    );
    await waitFor(() => {
      expect(screen.getByText('First reply')).toBeInTheDocument();
    });
    expect(screen.getByText(/@bob/)).toBeInTheDocument();
  });
});
