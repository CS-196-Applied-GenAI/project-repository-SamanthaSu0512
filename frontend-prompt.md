# Frontend implementation prompts (TDD, incremental)

Use these prompts with a code-generation LLM in order. Each prompt assumes the previous steps are done and integrated. Prefer small commits; run tests after each step.

**Context:** Chirper is a Twitter-style app. Backend is Node/Express with session cookies (same origin). See `frontend-spec.md` and `frontend-plan.md` for pages, routes, and stack (React, React Router, CSS Modules, fetch with `credentials: 'include'`).

---

## Prompt 0 — Project context (paste once at session start)

```text
You are implementing the Chirper frontend per frontend-spec.md and frontend-plan.md.
Stack: React (Vite), React Router, CSS Modules, plain fetch with credentials: 'include', same-origin (dev proxy /api → backend).
Do not leave orphaned components or routes: every new file must be imported and used in App or a parent. Prefer test-driven or test-after: add a minimal test (e.g. Vitest + React Testing Library) for each new page or component that has behavior, or at least verify in browser before moving on.
```

**Checkpoint:** N/A (context only).

---

## Prompt 1 — Scaffold and first route

```text
Create a Vite + React app in a `frontend/` folder at the repo root. Add React Router. Define routes for /login, /signup, / (Home), /compose, /tweet/:id/reply, /tweet/:id/replies, /profile, /profile/:username, and a catch-all * for NotFound. Use placeholder components that render the route name (e.g. "Login page"). Wire App.jsx so the browser shows the correct placeholder for each path. Add a dev proxy in vite.config.js: /api → http://localhost:3000. No auth yet. Add one smoke test (e.g. Vitest) that renders App and checks that /login route shows "Login" (or similar). Run npm run dev and npm test to confirm.
```

**Checkpoint / test:**
- From repo root: `cd frontend && npm run test` — all tests pass (smoke test for /login).
- `cd frontend && npm run dev` — open http://localhost:5173/login → see "Login page"; try /signup, /, /compose, /profile, /profile/alice, /unknown → each shows the matching placeholder or NotFound.

---

## Prompt 2 — API helper and health check

```text
In frontend/src, add api.js (or api/index.js) that exports a small helper: getJson(path) using fetch(path, { credentials: 'include' }), parses JSON, and throws on !res.ok with status and body. Use only relative paths like /api/feed. Add a one-line test or manual check: from the app (e.g. a temporary button on Home that calls getJson('/api/health')), verify the backend health endpoint returns { ok: true } when the backend is running. Remove or guard the temporary button so it is not production-only noise (or leave behind a dev-only check). Ensure nothing is orphaned: api.js is imported wherever fetch is needed going forward.
```

**Checkpoint / test:**
- Backend running on port 3000: from the app (temporary button or console), `getJson('/api/health')` resolves to `{ ok: true }`. If backend is down, helper throws or shows error.
- Run `npm run test` — no regressions.
- Remove or guard the temporary UI before considering the step done.

---

## Prompt 3 — Login page and POST /api/auth/login

```text
Implement the Login page: form with fields for username or email and password, submit calls POST /api/auth/login with JSON body { username, password } or { email, password } (match backend). Use fetch with credentials: 'include' and Content-Type application/json. On 200, redirect to /. On 401/400, show error message from response body. Style with Login.module.css (CSS Modules). Do not add Auth context yet; redirect can use window.location or React Router navigate. Add a test: render Login, mock fetch to resolve 200, assert navigate or redirect was triggered (or assert error message on 401).
```

**Checkpoint / test:**
- `npm run test` — Login test passes (mock 200 → redirect; mock 401 → error text).
- Manual: start backend, go to /login, submit valid credentials → redirect to Home; wrong password → error message.

---

## Prompt 4 — Signup page and POST /api/auth/signup

```text
Implement the Signup page: username, email, password, optional name. POST /api/auth/signup with JSON; on 201 redirect to /. On 400/409 show error. Use Signup.module.css. Wire /signup route to this component. Add a test: mock fetch 201, assert redirect; mock 409, assert error text.
```

**Checkpoint / test:**
- `npm run test` — Signup tests pass.
- Manual: /signup with new username/email → redirect to Home; duplicate username/email → error.

---

## Prompt 5 — Auth state: GET /api/auth/me and AuthContext

```text
Add AuthContext (or similar) that on mount calls GET /api/auth/me with credentials. Store { user } or null. Export useAuth() with { user, loading, setUser, logout }. Logout calls POST /api/auth/logout then setUser(null). Wrap the app in AuthProvider. On 401 from /api/auth/me, set user to null. Replace any placeholder "Home" with a simple "Welcome, {user.username}" when user is present. Ensure Login and Signup are still reachable when not logged in. Add a test: mock /api/auth/me to return user, render app, assert welcome text; mock 401, assert no user.
```

**Checkpoint / test:**
- `npm run test` — auth context / me tests pass.
- Manual: after login, Home shows "Welcome, {username}"; refresh keeps user; open /login in new tab while logged in (optional redirect to /); logout then Home or /api/me shows logged out.

---

## Prompt 6 — Protected routes and redirect to login

```text
Add a ProtectedRoute (or layout) wrapper: if !user and !loading, redirect to /login. Wrap /, /compose, /tweet/:id/reply, /tweet/:id/replies, /profile, /profile/:username with it. If user is logged in and visits /login or /signup, redirect to /. No orphaned routes: every protected path must render inside the wrapper.
```

**Checkpoint / test:**
- Manual: logged out, visit / or /profile → redirect to /login. After login, / and /profile load. Logged in, visit /login → redirect to /.

---

## Prompt 7 — Global nav and logout

```text
Add an AuthenticatedLayout: top bar with links "Feed" → /, "My profile" → /profile, and "Logout" button that calls logout from useAuth and navigates to /login. Use it only for routes that require auth (inside ProtectedRoute). Style with CSS Modules. Ensure navigating between Feed and Profile works without full reload.
```

**Checkpoint / test:**
- Manual: when logged in, nav shows Feed, My profile, Logout; clicking each navigates; Logout → /login and session cleared (try / again → /login).

---

## Prompt 8 — Home feed: fetch and list tweets

```text
On the Home page (when authenticated), fetch GET /api/feed with credentials. Render a list of tweets: author username, text, created_at (formatted). Show loading and error states. Use CSS Modules. Add a test: mock fetch to return an array of tweets, assert one tweet’s text appears.
```

**Checkpoint / test:**
- `npm run test` — Home feed test passes (mock feed response).
- Manual: with backend and at least one tweet, Home shows the tweet list; loading then content or error.

---

## Prompt 9 — TweetCard: Like, Retweet, Reply, profile link

```text
Extract a TweetCard component that receives a tweet (with author, text, liked, retweeted from API). Render Like button (POST or DELETE /api/tweets/:id/like based on liked), Retweet (same for retweet), Reply link to /tweet/:id/reply, and author link to /profile/:username. Use fetch with credentials. After toggling, refetch feed or update local state. Wire TweetCard into Home. No orphaned component: only used on Home (and later Replies if needed).
```

**Checkpoint / test:**
- Manual: on Home, Like/Retweet toggle state and persist after refresh; Reply and author links navigate to reply page and profile.

---

## Prompt 10 — Compose page

```text
Implement /compose: textarea with max length 240, submit calls POST /api/tweets with { text }. On 201 redirect to /. Show validation error if empty or over limit. Use Compose.module.css. Wire route (already under ProtectedRoute). Test: mock 201, assert redirect.
```

**Checkpoint / test:**
- `npm run test` — Compose test passes.
- Manual: /compose, submit tweet → redirect to Home; new tweet appears in feed.

---

## Prompt 11 — Reply page

```text
Implement /tweet/:id/reply: show parent tweet id or snippet (optional: fetch GET /api/tweets/:id if backend adds it; otherwise show "Replying to tweet #id"). Textarea, submit POST /api/tweets with { text, parent_tweet_id: id }. On 201 redirect to /tweet/:id/replies or /. Use Reply.module.css.
```

**Checkpoint / test:**
- Manual: from a tweet, Reply → reply page; submit → redirect to replies or Home; reply appears on /tweet/:id/replies.

---

## Prompt 12 — Replies page

```text
Implement /tweet/:id/replies: fetch GET /api/tweets/:id/replies, render list of replies (TweetCard or simpler row). Optionally show parent tweet at top (from location state or fetch). Add Reply link to /tweet/:id/reply. Style with CSS Modules.
```

**Checkpoint / test:**
- Manual: /tweet/:id/replies shows replies list; Reply link works.

---

## Prompt 13 — Profile: me and by username

```text
Implement /profile: GET /api/users/me, show name, bio, avatar (img src = origin + profile_picture). Show up to 5 tweets: if backend has GET /api/users/:username/tweets?limit=5 use it for /profile (me); otherwise show a placeholder or fetch feed and filter by author_id. Implement /profile/:username: backend must expose GET /api/users/:username (add if missing); show same layout; Follow/Block buttons for others (POST/DELETE /api/users/:id/follow and block). Wire Profile and ProfileByUsername; no duplicate orphan components.
```

**Checkpoint / test:**
- Manual: /profile shows current user and up to 5 tweets; /profile/:username shows that user and follow/block when not self.

---

## Prompt 14 — 404 and inactivity timeout

```text
Ensure catch-all * renders NotFound with message and link to / or /login. Implement 5-minute inactivity: reset a timer on mousedown, keydown, scroll; on fire call logout and redirect to /login. Use useEffect and clear on unmount. Optionally use a shorter timeout in development for testing.
```

**Checkpoint / test:**
- Manual: visit /random-path → NotFound page. Leave tab idle (or use short dev timeout) → redirect to /login.

---

## Prompt 15 — Final wiring and cleanup

```text
Review the app: remove any temporary debug UI, ensure all routes are reachable from nav or links, no console errors, no unused imports. Add README in frontend/ with npm run dev, npm run build, and that backend must run on port 3000 with DB. Confirm proxy and credentials work for all API calls.
```

**Checkpoint / test:**
- `cd frontend && npm run build` succeeds.
- Manual smoke: login → feed → compose → profile → logout; no console errors; no temp buttons left.

---

## Usage notes

- Run prompts in order; do not skip unless you merge steps manually.
- If the backend lacks an endpoint (e.g. GET /api/users/:username), either add it in the backend repo or stub the frontend with mock data until the API exists.
- Keep each prompt’s deliverable testable (manual or automated) before proceeding.
