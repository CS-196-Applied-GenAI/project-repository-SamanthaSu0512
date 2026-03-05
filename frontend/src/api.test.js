import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJson } from './api';

describe('getJson', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns parsed JSON on 200', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
    });
    const result = await getJson('/api/health');
    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith('/api/health', { credentials: 'include' });
  });

  it('throws on non-ok with status and body', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ error: 'Not logged in' })),
    });
    await expect(getJson('/api/feed')).rejects.toMatchObject({
      status: 401,
      message: 'Not logged in',
    });
  });
});
