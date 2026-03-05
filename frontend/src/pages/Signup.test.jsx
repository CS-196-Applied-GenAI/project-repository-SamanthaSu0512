import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Signup from './Signup';

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <AuthProvider>
        <Signup />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Signup', () => {
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

  it('calls POST /api/auth/signup and redirects on 201', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      if (url === '/api/auth/signup') {
        return Promise.resolve({
          ok: true,
          status: 201,
          text: () => Promise.resolve(JSON.stringify({ id: 1, username: 'alice', email: 'alice@example.com' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderSignup();
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'alice',
            email: 'alice@example.com',
            password: 'pass1234',
            name: undefined,
          }),
        })
      );
    });
  });

  it('shows error on 409', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
        });
      }
      if (url === '/api/auth/signup') {
        return Promise.resolve({
          ok: false,
          status: 409,
          text: () => Promise.resolve(JSON.stringify({ error: 'Username already taken' })),
        });
      }
      return Promise.reject(new Error('Unexpected: ' + url));
    });
    renderSignup();
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/username already taken/i);
    });
  });
});
