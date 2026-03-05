/**
 * Fetch JSON from same-origin API with session cookies.
 * @param {string} path - e.g. '/api/feed', '/api/health'
 * @returns {Promise<any>}
 */
export async function getJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/**
 * POST JSON to same-origin API with session cookies.
 * @param {string} path - e.g. '/api/auth/login'
 * @param {object} body - will be JSON.stringify'd
 * @returns {Promise<any>}
 */
export async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(parsed?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

/**
 * DELETE request with credentials (no body). Throws on !res.ok.
 */
export async function deleteJson(path) {
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(parsed?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}
