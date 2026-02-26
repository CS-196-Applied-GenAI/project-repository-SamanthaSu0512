# Backend Build Plan — Twitter(X)-Style App

This plan covers the **backend only** (Node.js + Express + MySQL). It aligns with [spec.md](./spec.md). Steps are ordered so each builds on the previous; each step is small enough to implement and test before moving on.

---

## Blueprint Overview

| Phase | Focus | Delivers |
|-------|--------|----------|
| 1 | Foundation | Project scaffold, DB connection, schema |
| 2 | Auth | Signup, login, session, middleware, logout |
| 3 | Profile | Get/update profile, profile picture upload |
| 4 | Tweets & feed | Create/delete tweet, blended feed, pagination |
| 5 | Social | Follow/unfollow, block/unblock |
| 6 | Engagement | Like/unlike, retweet/unretweet |

**Stack:** Node.js, Express, MySQL (chirper), express-session (with store), bcrypt, multer (uploads).

---

## Phase 1: Foundation

**Goal:** Run an Express server that can talk to MySQL and has the CS196 schema applied.

### Chunk 1.1 — Project scaffold and DB connection

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **1.1.1** | Create repo folder; `npm init`; install `express`, `mysql2`, `dotenv`. Create `src/` (or `server/`), `index.js` (or `app.js`), start script. | `npm start` runs and server listens. |
| **1.1.2** | Add `.env` and `.env.example` (e.g. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=chirper`, `PORT`). Load dotenv in entry file. | Env vars load without committing secrets. |
| **1.1.3** | Create a DB config module: create MySQL connection pool using `mysql2/promise`, export the pool. | Pool is created; no queries yet. |
| **1.1.4** | Add a minimal health route (e.g. `GET /health`) that returns 200. | Request to `/health` returns 200. |
| **1.1.5** | Add `GET /health/db` that runs a trivial query (e.g. `SELECT 1`) using the pool and returns 200 only if the query succeeds. | DB connectivity verified. |

### Chunk 1.2 — Database schema

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **1.2.1** | Obtain CS196 schema (clone repo or copy `chirper_full_schema.sql`). Ensure DB `chirper` exists (create if not in schema). | `chirper` database exists. |
| **1.2.2** | Run the full schema SQL (tables: users, tweets, likes, follows, blocks, comments, blacklisted_tokens). | All tables present; describe matches spec. |
| **1.2.3** | (Optional) Add a small script or doc step that runs the schema so new environments can be set up in one command. | Another machine can run schema and connect. |

**Phase 1 done when:** Server starts, `/health` and `/health/db` pass, and all CS196 tables exist.

---

## Phase 2: Auth

**Goal:** Signup, login with session, auth middleware, logout. No protected behavior until Phase 2 is done.

### Chunk 2.1 — Signup

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **2.1.1** | Add `bcrypt` (and optionally a validation lib like `express-validator` or Joi). Create a `users` service/module with a function that inserts into `users` (username, email, password_hash, optional name). Use bcrypt to hash password before insert. | Unit or integration test: insert user, then query by username; password_hash is not plain text. |
| **2.1.2** | Implement password validation: min length 8, at least one letter and one number. Expose a small validator function and use it in the signup flow. | Test: reject short / no letter / no number; accept valid password. |
| **2.1.3** | Add `POST /api/auth/signup` (or `/register`). Body: username, email, password (and optionally name). Validate uniqueness of username and email (query DB); validate password rules; hash and insert. Return 201 + minimal user info (no password); 400/409 on validation or duplicate. | Signup succeeds for new user; duplicate username/email returns 409. |
| **2.1.4** | Prevent duplicate username/email with a single check (e.g. SELECT by username OR email) and clear error messages. | Test both “username taken” and “email taken”. |

### Chunk 2.2 — Session and login

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **2.2.1** | Install `express-session`. Configure express-session (secret from env, cookie settings, name). Use in-memory store for now (or connect-mysql2/session store if preferred). Mount before routes that need session. | Session cookie is set on any response after first request. |
| **2.2.2** | Add `POST /api/auth/login`. Body: username (or email), password. Look up user by username (or email); compare password with bcrypt.compare. If invalid, 401. If valid, set `req.session.userId` (and optionally `username`) and return 200 + minimal user info. | Login with correct creds sets session and returns user; wrong password returns 401. |
| **2.2.3** | Add `GET /api/auth/me` (or `/session`): if `req.session.userId` exists, return current user from DB (id, username, email, name, bio, profile_picture); else 401. | When logged in, `/api/auth/me` returns user; when not, 401. |

### Chunk 2.3 — Auth middleware and logout

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **2.3.1** | Create `requireAuth` middleware: if no `req.session.userId`, send 401 (and optionally a JSON message). Do not use for `/api/auth/login`, `/api/auth/signup`, or health routes. | Unauthenticated request to a protected route returns 401. |
| **2.3.2** | Apply `requireAuth` to `/api/auth/me` and document that all future `/api/*` routes (except login/signup) will use it. | `/api/auth/me` without session → 401; with session → 200. |
| **2.3.3** | Add `POST /api/auth/logout`: call `req.session.destroy`, clear cookie if needed, return 204. | After logout, session is gone; next `/api/auth/me` returns 401. |

**Phase 2 done when:** Signup, login, logout, and “require login” for protected routes work and are testable (manual or automated).

---

## Phase 3: Profile

**Goal:** Get and update profile (bio, username); profile picture upload.

### Chunk 3.1 — Get and update profile (no file)

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **3.1.1** | Add `GET /api/users/me` (or reuse/alias `/api/auth/me`): return full profile for `req.session.userId` (id, username, email, name, bio, profile_picture). Protected. | Returns current user profile. |
| **3.1.2** | Add `PATCH /api/users/me`: body may include `bio`, `username`. If `username` provided, check uniqueness (excluding current user); update only provided fields. Return updated profile. Protected. | Update bio; update username to unused value; duplicate username → 409. |

### Chunk 3.2 — Profile picture upload

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **3.2.1** | Install `multer`. Create `uploads/` (or `public/uploads/`). Configure multer: single file, field name e.g. `profilePicture`; restrict to image MIME types and max size (e.g. 2MB). Save to disk with a safe filename (e.g. uuid + extension). | Upload a small image; file appears in `uploads/`. |
| **3.2.2** | Add `PATCH /api/users/me/avatar` (or include in `PATCH /api/users/me` with multipart): use multer; after upload, set `users.profile_picture` to the stored path/URL for current user; return updated profile. Optionally delete previous file if replacing. | Upload image → profile_picture updated; GET profile returns new URL/path. |
| **3.2.3** | Serve uploaded files: e.g. `express.static('uploads')` under `/uploads` so profile picture URL is usable by frontend. | `GET /uploads/<filename>` returns the image. |

**Phase 3 done when:** Current user can get profile, update bio/username, and set profile picture via upload; image is stored and path saved in DB.

---

## Phase 4: Tweets and feed

**Goal:** Create/delete tweets; blended feed with block filter; 10 per batch; load more; refresh = first page again.

### Chunk 4.1 — Create and delete tweet

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **4.1.1** | Add a tweets helper: insert tweet (user_id, text, retweeted_from = NULL). Enforce `text` length ≤ 240 (reject longer with 400). Return created row (id, user_id, text, created_at, retweeted_from). | Unit/integration test: create tweet; over 240 → 400. |
| **4.1.2** | Add `POST /api/tweets`: body `{ text }`. Validate length; insert with `req.session.userId`; return 201 + tweet. Protected. | Create tweet as logged-in user; 401 when not logged in. |
| **4.1.3** | Add delete helper: delete from tweets where id = ? and user_id = ? (only owner). Return whether a row was deleted. | Test: delete own tweet → success; delete other’s → no row deleted. |
| **4.1.4** | Add `DELETE /api/tweets/:id`: call delete helper; if no row deleted, 403 or 404; else 204. Protected. | Delete own tweet → 204; other’s tweet → 403/404. |

### Chunk 4.2 — Feed query and block filter

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **4.2.1** | Implement “blocked set” for viewer: users that viewer blocked + users who blocked viewer. Query blocks table for `blocker_id = viewer` and `blocked_id = viewer`; collect all blocked IDs. | Given a viewer id, get set of user ids that must be excluded. |
| **4.2.2** | Build feed query: tweets (including retweets, i.e. rows with or without `retweeted_from`) where author not in blocked set, and author has not blocked viewer. Order by `created_at DESC`. Parameterize limit and offset (or cursor). | Query returns only non-blocked tweets in correct order. |
| **4.2.3** | Add “followed set” for viewer: list of followee_id where follower_id = viewer. Use for blending. | Given viewer id, get set of followed user ids. |

### Chunk 4.3 — Blended feed and pagination

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **4.3.1a** | Implement “from followed” query: fetch tweets from followed users only (excluding blocked), ordered by created_at DESC, limit 6. | Returns up to 6 tweets from people the user follows. |
| **4.3.1b** | Implement “from others” query: fetch tweets from non-followed users (excluding blocked), ordered by created_at DESC, limit 4. Merge with “from followed” results, sort combined by created_at DESC, take first 10. | Batch of 10 respects follow preference and block filter. |
| **4.3.2** | Add cursor/offset: “load more” sends `before=<id>` or `offset=10`. Next batch of 10 with same blend and block rules. | Second page returns next 10; no duplicates. |
| **4.3.3** | Add `GET /api/feed`: query params optional `before` (tweet id) or `offset`; default first page. Return array of tweets (each with author info: id, username, name, profile_picture). For retweets, include original tweet content (join or resolve retweeted_from). Protected. | First page and “load more” both work; blocked users never appear. |
| **4.3.4** | For each tweet in feed response, add current user’s state: `liked` (boolean), `retweeted` (boolean). Query likes and retweets for current user and merge into response. | Frontend can show like/retweet state without extra calls. |
| **4.3.5** | Document that “Refresh” on frontend = call `GET /api/feed` with no params (first page again). No new endpoint. | — |

**Phase 4 done when:** User can post and delete own tweets; feed is blended, filtered by blocks, paginated by 10; refresh is “first page” again.

---

## Phase 5: Follow and block

**Goal:** Follow/unfollow, block/unblock; feed and other features already use block filter.

### Chunk 5.1 — Follow / unfollow

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **5.1.1** | Add follow helper: insert into `follows` (follower_id, followee_id). If follower_id === followee_id, do not insert (self-follow). Idempotent: ignore duplicate key. | Self-follow prevented; duplicate follow doesn’t error. |
| **5.1.2** | Add `POST /api/users/:id/follow`: target user id = params. Current user = follower. Call follow helper; 404 if target user not found; 400 if self. Return 204 or 200. Protected. | Follow another user; self-follow → 400. |
| **5.1.3** | Add unfollow helper: delete from follows where follower_id = ? and followee_id = ?. | — |
| **5.1.4** | Add `DELETE /api/users/:id/follow`: unfollow target. 204. Protected. | Unfollow works. |

### Chunk 5.2 — Block / unblock

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **5.2.1** | Add block helper: insert into `blocks` (blocker_id, blocked_id). If blocker_id === blocked_id, do not insert. Idempotent. | Self-block prevented. |
| **5.2.2** | Add `POST /api/users/:id/block`: current user = blocker. 404 if target not found; 400 if self. Return 204. Protected. | Block another user; self-block → 400. |
| **5.2.3** | Add unblock helper and `DELETE /api/users/:id/block`. 204. Protected. | Unblock works. |
| **5.2.4** | Confirm feed (Phase 4) and any user/tweet listing use the same “blocked set” logic so blocker and blocked see no content from each other. | Manual or test: block user → they disappear from feed and vice versa. |

**Phase 5 done when:** Follow, unfollow, block, unblock work; feed respects blocks.

---

## Phase 6: Likes and retweets

**Goal:** Like/unlike; retweet/unretweet (one retweet per user per original).

### Chunk 6.1 — Like / unlike

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **6.1.1** | Add like helper: insert into `likes` (tweet_id, user_id). Idempotent (ignore duplicate). Ensure tweet exists and is not blocked from viewer’s perspective if you want strict semantics. | Like a tweet; second like no-op. |
| **6.1.2** | Add `POST /api/tweets/:id/like`: current user likes tweet :id. 404 if tweet missing; 204 or 200. Protected. | Like returns success. |
| **6.1.3** | Add unlike helper: delete from likes where tweet_id = ? and user_id = ?. | — |
| **6.1.4** | Add `DELETE /api/tweets/:id/like`: unlike. 204. Protected. | Unlike works. |

### Chunk 6.2 — Retweet / unretweet

| Step | What to do | Test / checkpoint |
|------|------------|--------------------|
| **6.2.1** | Add retweet helper: check no existing tweet with same user_id and retweeted_from = original_id; insert tweet (user_id, retweeted_from = original_id, text = NULL). Return new tweet row. | One retweet per user per original; duplicate → 409 or no-op. |
| **6.2.2** | Add `POST /api/tweets/:id/retweet`: current user retweets tweet :id. 404 if original missing; 409 if already retweeted (or 200 idempotent). Return created retweet or existing. Protected. | Retweet and duplicate retweet handled. |
| **6.2.3** | Add unretweet helper: delete from tweets where user_id = ? and retweeted_from = ?; return whether row deleted. | — |
| **6.2.4** | Add `DELETE /api/tweets/:id/retweet`: remove retweet row for current user and original :id. 404 if no such retweet; 204. Protected. | Unretweet works. |
| **6.2.5** | Ensure feed and tweet responses resolve retweeted_from (show original tweet content and author) so retweets display correctly. | Feed shows retweets with original content. |

**Phase 6 done when:** Like, unlike, retweet, unretweet work; feed includes retweets with original content.

---

## Implementation order (summary)

Execute in this order; each step assumes the previous are done and tested.

1. **1.1.1 → 1.1.5** — Server, env, pool, health, DB health  
2. **1.2.1 → 1.2.3** — Schema  
3. **2.1.1 → 2.1.4** — Signup  
4. **2.2.1 → 2.2.3** — Session, login, /me  
5. **2.3.1 → 2.3.3** — requireAuth, logout  
6. **3.1.1 → 3.1.2** — Get/update profile (no file)  
7. **3.2.1 → 3.2.3** — Profile picture upload and static serve  
8. **4.1.1 → 4.1.4** — Create/delete tweet  
9. **4.2.1 → 4.2.3** — Block set, feed query, followed set  
10. **4.3.1a → 4.3.5** — Blended feed (from followed + from others), pagination, GET /api/feed, like/retweet state, refresh doc  
11. **5.1.1 → 5.1.4** — Follow/unfollow  
12. **5.2.1 → 5.2.4** — Block/unblock, confirm feed uses blocks  
13. **6.1.1 → 6.1.4** — Like/unlike  
14. **6.2.1 → 6.2.5** — Retweet/unretweet, feed shows retweets  

---

## Right-sizing notes

- **Small enough:** Each step is one clear deliverable (one route, one helper, or one config change) with a test/checkpoint. No step mixes unrelated features.
- **Big enough:** Steps are not single-line changes; they include validation, errors, and DB work so progress is visible and testable.
- **Testing:** Prefer at least one test per step (integration test for routes, or unit test for helpers). Health and auth are critical; add a few more tests there if time allows.
- **Iteration:** Steps 4.3.1a and 4.3.1b are the split of the blended feed; combine them into one step if you prefer a single implementation (e.g. one SQL with conditional ordering). If a step feels too small, combine with the next. Adjust in your repo as you go; this plan is the baseline.

---

## File/structure suggestion

```
project-root/
  .env
  .env.example
  package.json
  spec.md
  plan.md
  src/
    index.js          # entry, mount middleware and routes
    config/
      db.js           # pool
    middleware/
      requireAuth.js
      upload.js       # multer for avatar
    routes/
      auth.js         # signup, login, logout, me
      users.js        # profile, follow, block, avatar
      tweets.js      # create, delete, like, retweet, feed
    services/        # or lib/
      users.js
      tweets.js
      feed.js
      blocks.js
  uploads/           # profile pictures
```

You can rename `src` to `server` or use a different structure; keep auth, routes, and DB access clearly separated.
