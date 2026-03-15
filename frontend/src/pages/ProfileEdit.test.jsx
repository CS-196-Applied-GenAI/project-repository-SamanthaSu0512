import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('ProfileEdit', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url, options) => {
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
                bio: 'Old bio',
              })
            ),
        });
      }
      if ((url === '/api/users/me' || url.startsWith('/api/users/me')) && options?.method !== 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                name: 'Alice',
                bio: 'Old bio',
              })
            ),
        });
      }
      if (url === '/api/users/me' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: 1,
                username: 'alice',
                name: 'Alice',
                bio: 'New bio',
              })
            ),
        });
      }
      if (url === '/api/users/me/tweets?limit=5') {
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

  it('loads current user and shows form', async () => {
    window.history.pushState({}, '', '/profile/edit');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit profile/i })).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old bio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
  });

  it('Cancel navigates back to profile', async () => {
    window.history.pushState({}, '', '/profile/edit');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    });
  });

  it('Save submits PATCH and navigates to profile', async () => {
    window.history.pushState({}, '', '/profile/edit');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Old bio')).toBeInTheDocument();
    });
    const bioInput = screen.getByPlaceholderText(/Tell us about yourself/i);
    fireEvent.change(bioInput, { target: { value: 'New bio' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('New bio'),
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    });
  });
});
