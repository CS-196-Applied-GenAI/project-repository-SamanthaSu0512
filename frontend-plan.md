# Frontend build blueprint — Chirper

Step-by-step plan derived from `frontend-spec.md`. Chunks build on each other; each chunk is broken into small, testable steps.

---

## Part 1: High-level blueprint

### Phase A — Scaffold and routing shell
- Create React app (e.g. Vite + React), add React Router, same-origin proxy to backend `/api`.
- Define route table (public: `/login`, `/signup`; protected: `/`, `/compose`, `/tweet/:id/reply`, `/tweet/:id/replies`, `/profile`, `/profile/:username`; catch-all `*`).
- Add a minimal layout shell (no auth yet): render route outlet, placeholder pages.

### Phase B — Auth and session
- Login and signup pages calling `POST /api/auth/login` and `POST /api/auth/signup` with `fetch(..., { credentials: 'include' })`.
- On success, redirect to Home; on 401/400 show errors.
- Auth context (or similar): “current user” from `GET /api/auth/me` on app load; null when not logged in.

### Phase C — Protected routes and global nav
- Wrap protected routes: if not logged in, redirect to `/login`.
- Global nav (Feed | My profile | Logout) on authenticated layout; Logout calls `POST /api/auth/logout` then redirect to `/login`.

### Phase D — Home feed
- Fetch `GET /api/feed` with credentials; render list of tweets (author, text, time).
- Rich actions: Like, Retweet, Reply (link to reply page), author → profile. Wire `POST/DELETE .../like` and `.../retweet` per backend.

### Phase E — Compose and reply
- `/compose`: textarea + submit → `POST /api/tweets` → redirect Home.
- `/tweet/:id/reply`: load parent tweet (optional: `GET` single tweet if backend adds it, or pass from feed); textarea + submit → `POST /api/tweets` with `parent_tweet_id` → redirect to replies or Home.

### Phase F — Replies page
- `/tweet/:id/replies`: fetch `GET /api/tweets/:id/replies`; show parent tweet (from feed or add `GET /api/tweets/:id` if needed) and list of replies.

### Phase G — Profile
- `/profile`: use `GET /api/users/me`; show bio, avatar, up to 5 tweets (backend may need `GET /api/users/:username/tweets?limit=5` or filter by author from feed).
- `/profile/:username`: backend needs `GET /api/users/:username` (or resolve username → id); show same layout; Follow/Block if not self.

### Phase H — Error, inactivity, polish
- 404 route: unknown path → error message + link to Home/Login.
- 5-minute inactivity: timer reset on activity; on timeout clear client state and redirect to `/login`.
- CSS Modules, light theme; empty states and loading/error UI.

---

## Part 2: Iterative chunks (build order)

| Chunk | Goal | Depends on |
|-------|------|------------|
| **1** | Scaffold + router + proxy | — |
| **2** | Auth pages + session state | 1 |
| **3** | Protected layout + global nav | 2 |
| **4** | Home feed (list + rich actions) | 3 |
| **5** | Compose + Reply pages | 4 |
| **6** | Replies page | 5 |
| **7** | Profile (me + by username) | 3 (can parallel 4–6 with mocks) |
| **8** | 404 + inactivity + polish | 4–7 |

---

## Part 3: Chunks broken into small steps

### Chunk 1 — Scaffold + router + proxy
1. **1.1** Create Vite + React app in repo (e.g. `frontend/` or root with `client/`). Verify `npm run dev` serves app.
2. **1.2** Add React Router; create placeholder components for Login, Signup, Home, Compose, Reply, Replies, Profile, NotFound. Wire routes (no auth yet).
3. **1.3** Configure dev proxy: `/api` → `http://localhost:3000` (or backend port). Verify `fetch('/api/health', { credentials: 'include' })` from app hits backend.

**Test:** Open `/login`, `/signup`, `/` in browser; no console errors. Proxy request returns `{ ok: true }`.

---

### Chunk 2 — Auth pages + session
4. **2.1** Login page: form (username or email, password), `POST /api/auth/login`, show error on 401/400, redirect to `/` on 200.
5. **2.2** Signup page: username, email, password, name; `POST /api/auth/signup`, redirect to `/` on 201.
6. **2.3** Auth context: on app mount `GET /api/auth/me` with credentials; store user in context (or null). Export `useAuth()` with `{ user, setUser, logout }`.

**Test:** Signup → lands on Home placeholder; refresh keeps “logged in” (me returns user). Logout (button on Home placeholder) → me returns 401 after.

---

### Chunk 3 — Protected layout + global nav
7. **3.1** Protected route wrapper: if `!user` redirect to `/login`. Wrap `/`, `/compose`, `/tweet/:id/reply`, `/tweet/:id/replies`, `/profile`, `/profile/:username`.
8. **3.2** Authenticated layout: top bar with “Feed” → `/`, “My profile” → `/profile`, “Logout” → `POST /api/auth/logout` then redirect `/login`.
9. **3.3** Redirect logged-in user away from `/login` and `/signup` to `/` (optional but nice).

**Test:** Logged out, visit `/` → redirect to `/login`. After login, nav links work; Logout → `/login`.

---

### Chunk 4 — Home feed
10. **4.1** Home page: `GET /api/feed`, render list (author username, text, created_at). Loading and error states.
11. **4.2** Per tweet: Like button (POST/DELETE `/api/tweets/:id/like` by `liked`), Retweet (POST/DELETE `.../retweet`), Reply link to `/tweet/:id/reply`, author link to `/profile/:username`.
12. **4.3** Pagination or “Load more” if backend supports `before`/`offset` (optional).

**Test:** Create tweet via API or compose (after Chunk 5); feed shows it; like/retweet toggles.

---

### Chunk 5 — Compose + Reply
13. **5.1** Compose page: textarea (max 240), submit → `POST /api/tweets` → redirect `/`.
14. **5.2** Reply page `/tweet/:id/reply`: show parent snippet (from location state or fetch if backend adds GET tweet by id); textarea → `POST /api/tweets` with `parent_tweet_id` → redirect `/tweet/:id/replies` or `/`.

**Test:** Compose new tweet appears on feed. Reply to a tweet appears on that tweet’s replies page.

---

### Chunk 6 — Replies page
15. **6.1** `/tweet/:id/replies`: `GET /api/tweets/:id/replies`; render list. Show parent tweet at top (from feed state or add GET single tweet endpoint).
16. **6.2** Reply link from feed/replies page to `/tweet/:id/reply`.

**Test:** Open replies for a tweet with replies; list matches backend.

---

### Chunk 7 — Profile
17. **7.1** `/profile`: `GET /api/users/me`; show name, bio, avatar (img src = backend origin + profile_picture), up to 5 tweets (backend endpoint or client-side filter/limit).
18. **7.2** `/profile/:username`: backend `GET /api/users/:username` (add if missing); same layout; Follow/Block buttons if not self (`POST/DELETE /api/users/:id/follow`, block).

**Test:** Own profile shows me; another user’s profile shows their info and follow/block.

---

### Chunk 8 — 404 + inactivity + polish
19. **8.1** Catch-all route `*` → NotFound page with message and link to `/` or `/login`.
20. **8.2** Inactivity: 5 min timer, reset on mousedown/keydown/scroll; on fire → redirect `/login` (session may already be expired; backend session maxAge can align).
21. **8.3** CSS Modules, light theme; empty feed message; generic error boundary or error UI for failed fetches.

**Test:** Visit `/unknown` → 404 page. Leave tab idle 5+ min → redirect to login.

---

## Part 4: Sizing review

- **Chunk 1 (1.1–1.3):** Small — no backend contract beyond health; safe to test in isolation.
- **Chunk 2:** Medium — touches real auth; test with real signup/login.
- **Chunk 3:** Small — routing only; easy to verify redirects.
- **Chunk 4:** Medium — feed is the core; test with API or compose after 5.
- **Chunk 5–6:** Compose/reply/replies are incremental; each step is one page or one API.
- **Chunk 7:** May require backend additions (user by username, user tweets); can stub with mock data until API exists.
- **Chunk 8:** Small steps; inactivity is easy to test with a short timeout in dev.

**Adjust if needed:** If Chunk 4 feels large, split into “feed list only” (4.1) then “like/retweet/reply links” (4.2) as separate PRs. If profile backend is missing, do Chunk 7 with mock user/tweets first, then swap to real API.

---

## Part 5: File / folder sketch (suggested)

```
frontend/
  index.html
  vite.config.js          # proxy /api
  src/
    main.jsx
    App.jsx               # Router + AuthProvider
    api.js                # fetch wrappers with credentials: 'include'
    auth/
      AuthContext.jsx
      Login.jsx / Login.module.css
      Signup.jsx
    layout/
      AuthenticatedLayout.jsx   # nav + Outlet
      ProtectedRoute.jsx
    pages/
      Home.jsx
      Compose.jsx
      Reply.jsx
      Replies.jsx
      Profile.jsx
      NotFound.jsx
    components/
      TweetCard.jsx
      ...
```

Names can match your preference; keep pages and shared components separate for testing and reuse.
