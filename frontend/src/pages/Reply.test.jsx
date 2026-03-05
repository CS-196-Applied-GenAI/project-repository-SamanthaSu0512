import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Reply', () => {
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
          text: () => Promise.resolve(JSON.stringify({ id: 2, text: 'My reply', parent_tweet_id: 1 })),
        });
      }
      if (url === '/api/tweets/1/replies') {
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

  it('posts reply with parent_tweet_id and redirects to replies', async () => {
    window.history.pushState({}, '', '/tweet/1/reply');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Replying to tweet #1/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('textbox', { name: /your reply/i }), {
      target: { value: 'My reply' },
    });
    fireEvent.click(screen.getByRole('button', { name: /post reply/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tweets',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ text: 'My reply', parent_tweet_id: 1 }),
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Replies to tweet #1/)).toBeInTheDocument();
    });
  });
});
