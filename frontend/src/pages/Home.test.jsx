import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('Home feed', () => {
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
      if (url === '/api/feed') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify([
            {
              id: 10,
              user_id: 2,
              text: 'Hello world',
              created_at: '2025-01-15T12:00:00.000Z',
              author: { id: 2, username: 'bob', name: 'Bob', profile_picture: null },
              liked: false,
              retweeted: false,
            },
          ])),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches feed and shows tweet text', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
    expect(screen.getByText(/@bob/)).toBeInTheDocument();
  });
});
