import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Login from './Login';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
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
      return undefined;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows error on 401', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Invalid username or password' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid username or password/i);
    });
  });

  it('calls POST /api/auth/login with username and password on submit', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'alice', password: 'pass1234' }),
        })
      );
    });
  });
});