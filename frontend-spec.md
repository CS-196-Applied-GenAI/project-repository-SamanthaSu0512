# Frontend specification — Chirper

Handoff document for a developer. Iterative decisions are captured below.

---

## 1. Stack and delivery

| Decision | Choice |
|----------|--------|
| Framework | **React** with **React Router** |
| Serving | **Same origin** — e.g. Express serves the built React app, or in dev Vite (or similar) proxies `/api` to the backend so the browser uses one origin and session cookies work without CORS. |
| Styling | **CSS Modules** (scoped `.module.css` per page/component). Default **light** theme. |
| API calls | **Plain `fetch`** with `credentials: 'include'` (session cookies). No Axios. |

---

## 2. Pages (assignment alignment)

| # | Page | Purpose |
|---|--------|--------|
| 1 | **Account creation** | Sign up (username, email, password, optional name). |
| 2 | **Login** | Sign in; redirect to **Home** on success. |
| 3 | **Home** | Tweet feed (only top-level tweets; replies are not in the feed). |
| 4 | **Post (compose)** | Author a new tweet (text, max length per backend). |
| 5 | **Secondary post (reply)** | Author a reply to an existing tweet (`parent_tweet_id`). |
| 6 | **Replies** | View replies to a specific tweet (and optionally the parent tweet). |
| 7 | **Profile** | View **own** profile and **other users’** profiles by username. |
| 9 | **Error / 404** | Unknown path; show a clear error state and link to Home or Login. |

- **Profile URLs:** `/profile` = current user; `/profile/:username` = that user’s profile (readable URLs).
- **Reply backend:** `POST /api/tweets` with `{ text, parent_tweet_id }`; `GET /api/tweets/:id/replies`. Feed excludes replies (`parent_tweet_id` is null for feed items).

---

## 3. Navigation and auth

- **After login or signup:** redirect to **Home** (`/` or `/feed`).
- **Global nav** on every authenticated page: e.g. **Feed** | **My profile** | **Logout** (consistent top bar or sidebar).
- **From any in-app page:** user can go to feed, to own profile, to another user’s profile (e.g. by clicking author on a tweet), and **Logout** → redirect to **Login**.
- **Protected routes:** only logged-in users can access Home, Post, Reply, Replies, Profile. If not logged in, **redirect to `/login`** with **no return URL** (no “resume where you left off”).
- **Inactivity timeout:** **5 minutes** with no interaction → treat as logged out (clear client state, redirect to `/login`). Implement with a timer reset on user activity (clicks, keypress, scroll, or focus).

---

## 4. Feature details

- **Home feed:** **Rich** — each tweet shows Like, Retweet, Reply, and link to author’s profile. Use backend `liked` / `retweeted` (and any counts if provided) to show state.
- **Profile page:** show bio, avatar, follow/unfollow and block/unblock (when not self), and **up to 5** of that user’s tweets. If the backend does not yet expose “user by username” or “user’s tweets by username,” the spec assumes those endpoints will be added (e.g. `GET /api/users/:username`, `GET /api/users/:username/tweets?limit=5`) or equivalent.
- **Compose / Reply pages:** form with textarea, character limit aligned with backend (e.g. 240), submit → then redirect to Home or to the parent tweet’s replies page as appropriate.

---

## 5. Security (frontend)

- Do not store session tokens in localStorage; rely on **httpOnly cookies** and same-origin `fetch` with `credentials: 'include'`.
- On **401** from the API (e.g. session expired), redirect to `/login`.
- Apply **5-minute inactivity** logout as above.

---

## 6. Routes (suggested)

| Path | Page | Auth |
|------|------|------|
| `/signup` | Account creation | Public |
| `/login` | Login | Public |
| `/` or `/feed` | Home (feed) | Required |
| `/compose` | Post (new tweet) | Required |
| `/tweet/:id/reply` | Reply to tweet | Required |
| `/tweet/:id/replies` | Replies list | Required |
| `/profile` | Current user profile | Required |
| `/profile/:username` | Other user profile | Required |
| `*` | Error / 404 | — |

Adjust path names if you prefer (e.g. `/post` instead of `/compose`).

---

## 7. Out of scope / optional

- Dark mode toggle (not required; light only).
- “Return URL” after login (explicitly not used).
- Dummy data: assignment suggests using dummy data in the browser while iterating; can be static JSON or seed via backend.

---

## 8. Backend dependency summary

- Session auth (cookies), same origin.
- Existing: auth, users/me, feed, tweets CRUD, like, retweet, blocks, follows.
- Replies: `parent_tweet_id` on tweets; `GET /api/tweets/:id/replies`; feed only top-level tweets.
- Profile by username: if not present, add `GET /api/users/:username` and user tweets (limit 5) for profile page.
