import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('NotFound', () => {
  const originalFetch = global.fetch;

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
    global.fetch = originalFetch;
  });

  it('renders message and links to Feed and Login', async () => {
    window.history.pushState({}, '', '/random-path');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });
    expect(screen.getByText((content) => content.includes('looking for') && content.includes('exist'))).toBeInTheDocument();
    const feedLink = screen.getByRole('link', { name: /go to feed/i });
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(feedLink).toHaveAttribute('href', '/');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
