import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('Profile', () => {
  const originalFetch = global.fetch;

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
                name: 'Alice',
                bio: 'Hello world',
                profile_picture: '/uploads/avatar.png',
              })
            ),
        });
      }
      if (url === '/api/users/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                name: 'Alice',
                bio: 'Hello world',
                profile_picture: '/uploads/avatar.png',
              })
            ),
        });
      }
      if (url === '/api/users/me/tweets?limit=5') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify([
                {
                  id: 1,
                  text: 'My tweet',
                  created_at: new Date().toISOString(),
                  author: { username: 'alice' },
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

  it('shows current user profile and up to 5 tweets', async () => {
    window.history.pushState({}, '', '/profile');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    });
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('My tweet')).toBeInTheDocument();
    });
    const avatar = document.querySelector('img[src*="uploads/avatar"]');
    expect(avatar).toBeInTheDocument();
  });
});
