# Prompts to implement the backend (for AI code-generation tools)

Use these prompts **in order**. Paste one prompt at a time into your AI tool (e.g. Cursor, ChatGPT). Wait for the implementation and verify the checkpoint before moving to the next prompt. The project has `spec.md`, `plan.md`, `.env`, and `.gitignore` already; the database schema is in `CS196-Database-main/schema/`.

---

## Prompt 1 — Phase 1: Foundation (scaffold + DB connection)

```
Implement Phase 1 of the backend from plan.md (Foundation).

Context:
- This is a Node.js + Express + MySQL backend for a Twitter-style app. Follow plan.md and spec.md in this repo.
- The project already has .env at the root with DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=chirper. Use dotenv to load it. Add PORT to .env if needed (e.g. 3000; avoid 5000 on macOS—it’s used by AirPlay).
- Database schema: use the CS196 Chirper schema. The schema files are in CS196-Database-main/schema/ (01_users.sql through 06_blocks.sql). Assume the chirper database and tables already exist (user runs them per DATABASE_SETUP.md). Do not run SQL schema in code.

Do all of Chunk 1.1 (plan.md Phase 1):
1. Create the backend scaffold: use a folder like src/ or server/. Add package.json scripts so "npm start" runs the server. Install express, mysql2, dotenv.
2. Load dotenv in the entry file. Create .env.example with placeholder keys (no real secrets): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT, SESSION_SECRET.
3. Create a DB config module that creates a MySQL connection pool using mysql2/promise, using env vars. Export the pool.
4. Add GET /health that returns 200 and a simple JSON like { "ok": true }.
5. Add GET /health/db that runs a trivial query (e.g. SELECT 1) with the pool; return 200 if success, 503 if DB fails.

Do not implement auth, routes, or any other features yet. Just server, pool, and health routes.

Checkpoint: npm start runs; GET /health returns 200; GET /health/db returns 200 when MySQL is running.
```

---

## Prompt 2 — Phase 2 (Auth): Signup

```
Implement the signup part of Phase 2 (Auth) from plan.md.

Context:
- Backend already has Express server, MySQL pool (from Phase 1), and health routes. Follow plan.md and spec.md.
- Database: users table has id, username (UNIQUE), email (UNIQUE), password_hash, created_at, bio, profile_picture, name (see CS196 schema).

Do Chunk 2.1 (Signup):
1. Install bcrypt. Create a users service (e.g. src/services/users.js or src/lib/users.js) with a function that inserts a user: username, email, password_hash (hash the password with bcrypt before insert), and optional name. Return the created user row (exclude password_hash from return).
2. Add a password validator: minimum 8 characters, at least one letter and one number. Export it and use it in signup.
3. Add POST /api/auth/signup. Body: username, email, password (and optionally name). Validate password with the validator. Check that username and email are not already taken (query DB). If taken, return 409 with a clear message (username taken vs email taken). Hash password, insert user, return 201 with user info (id, username, email, name, no password).
4. Handle duplicate username/email with a single DB check and distinct error messages for "username taken" and "email taken".

Do not add session, login, or protected routes yet. Just signup.

Checkpoint: POST /api/auth/signup with valid body creates a user and returns 201; duplicate username or email returns 409; invalid password returns 400.
```

---

## Prompt 3 — Phase 2 (Auth): Session, login, /me

```
Implement session and login for Phase 2 (Auth) from plan.md.

Context:
- Backend has Express, MySQL pool, health routes, and POST /api/auth/signup. Follow plan.md and spec.md. Auth is session-based (server-side sessions).

Do Chunk 2.2 (Session and login):
1. Install express-session. Configure it: use a secret from env (SESSION_SECRET), set cookie options (httpOnly, secure in production if you have it), session name. Use the default in-memory store for now. Mount express-session before any routes that need it (e.g. in the main app file before mounting routes).
2. Add POST /api/auth/login. Body: username (or email) and password. Look up user by username or email. Use bcrypt.compare to check password. If invalid, return 401. If valid, set req.session.userId (and optionally username) and return 200 with minimal user info (id, username, email, no password).
3. Add GET /api/auth/me. If req.session.userId exists, load the user from DB and return id, username, email, name, bio, profile_picture. If no session, return 401.

Do not add requireAuth middleware or logout yet. Just session, login, and /me.

Checkpoint: After POST /api/auth/login with correct credentials, GET /api/auth/me returns the user; without login, /api/auth/me returns 401.
```

---

## Prompt 4 — Phase 2 (Auth): requireAuth and logout

```
Implement auth middleware and logout for Phase 2 (Auth) from plan.md.

Context:
- Backend has session, POST /api/auth/login, GET /api/auth/me. Follow plan.md and spec.md.

Do Chunk 2.3 (Auth middleware and logout):
1. Create requireAuth middleware: if req.session.userId is missing, send 401 with a JSON body like { "error": "Unauthorized" }. Do not use this middleware on POST /api/auth/login, POST /api/auth/signup, GET /health, GET /health/db.
2. Apply requireAuth to GET /api/auth/me (and document in code or README that all future /api/* routes except login and signup will use requireAuth).
3. Add POST /api/auth/logout: call req.session.destroy, then return 204. If the client sends cookies, the session cookie should be cleared (express-session handles this when the session is destroyed).

Checkpoint: Request to GET /api/auth/me without a session returns 401. After login, /api/auth/me returns 200; after logout, /api/auth/me returns 401 again.
```

---

## Prompt 5 — Phase 3: Profile (get/update + avatar upload)

```
Implement Phase 3 (Profile) from plan.md.

Context:
- Backend has auth: signup, login, logout, requireAuth, GET /api/auth/me. Follow plan.md and spec.md. users table has bio, profile_picture, name, username (UNIQUE).

Do Chunk 3.1 and 3.2:
1. Add GET /api/users/me (protected): return full profile for req.session.userId (id, username, email, name, bio, profile_picture). You can alias or reuse logic from GET /api/auth/me.
2. Add PATCH /api/users/me (protected): body may include bio, username. If username is provided, check it is unique (excluding current user). Update only provided fields. Return updated profile.
3. Install multer. Create uploads/ folder. Configure multer: single file, field name e.g. profilePicture; allow only image MIME types; max size e.g. 2MB. Save files with a safe name (e.g. uuid + original extension).
4. Add PATCH /api/users/me/avatar (or a route that accepts multipart for avatar) (protected): use multer; after upload, update users.profile_picture for the current user to the stored path (e.g. /uploads/filename.ext or the path the frontend can use). Return updated profile. Optionally delete the previous file when replacing.
5. Serve uploaded files: express.static('uploads') mounted at /uploads so that GET /uploads/<filename> returns the image.

Checkpoint: GET /api/users/me returns profile; PATCH /api/users/me updates bio/username (409 if username taken); PATCH avatar uploads image and updates profile_picture; GET /uploads/<file> serves the image.
```

---

## Prompt 6 — Phase 4 (Tweets & feed): Create/delete tweet + feed helpers

```
Implement Phase 4 (Tweets and feed) from plan.md — Part 1: create/delete tweet and feed query helpers.

Context:
- Backend has auth and profile. Follow plan.md and spec.md. tweets table: id, user_id, text (VARCHAR 240), image_url, created_at, retweeted_from. Block and follow logic will be used by the feed.

Do Chunk 4.1 and 4.2:
1. Tweets service: (a) Function to insert a tweet (user_id, text, retweeted_from = null). Enforce text length <= 240; throw or return error if longer. Return created row. (b) Function to delete a tweet where id = ? and user_id = ? (owner only). Return whether a row was deleted.
2. Add POST /api/tweets (protected): body { text }. Validate length <= 240; 400 if over. Insert with req.session.userId. Return 201 with the created tweet.
3. Add DELETE /api/tweets/:id (protected): delete only if tweet belongs to current user. 204 if deleted; 403 or 404 if not owner or not found.
4. Implement "blocked set" for a viewer: query blocks table where blocker_id = viewer OR blocked_id = viewer; return set of user ids that the viewer must not see (and who must not see the viewer).
5. Implement "followed set" for a viewer: list of followee_id from follows where follower_id = viewer.
6. Build a feed query helper: tweets (including retweets) where author not in blocked set and author did not block viewer. Order by created_at DESC. Support limit and offset (or cursor). For retweets, join or resolve retweeted_from so you get original tweet content and author.

Do not implement the blended feed API route yet. Just the helpers and create/delete tweet endpoints.

Checkpoint: POST /api/tweets creates a tweet (401 without auth; 400 if text > 240). DELETE /api/tweets/:id deletes own tweet (403 for others). Blocked-set and followed-set helpers return correct data.
```

---

## Prompt 7 — Phase 4 (Tweets & feed): Blended feed API and pagination

```
Implement the blended feed API and pagination for Phase 4 from plan.md.

Context:
- Backend has create/delete tweet, blocked set, followed set, and feed query helper. Follow plan.md and spec.md. Feed: 10 tweets per batch; blended (prefer tweets from followed users); exclude blocked; most recent first.

Do Chunk 4.3:
1. Implement blended batch: fetch up to 6 tweets from followed users (excluding blocked), then up to 4 from non-followed (excluding blocked). Merge and sort by created_at DESC, take first 10. Support offset/cursor for "load more" (next 10).
2. Add GET /api/feed (protected). Query params: optional before (tweet id) or offset for pagination; default first page. Return array of tweets, each with author info (id, username, name, profile_picture). For retweets, include original tweet content and original author (resolve retweeted_from).
3. For each tweet in the response, add liked: boolean and retweeted: boolean for the current user (query likes and tweets where retweeted_from = id for current user).
4. Document in a comment or README that "Refresh" on frontend = GET /api/feed with no params (first page).

Checkpoint: GET /api/feed returns 10 tweets (blended, no blocked users); with offset or before returns next 10; each tweet has author info, liked, retweeted; retweets show original content.
```

---

## Prompt 8 — Phase 5: Follow and block

```
Implement Phase 5 (Follow and block) from plan.md.

Context:
- Backend has auth, profile, tweets, and feed (with block filter). Follow plan.md and spec.md. Tables: follows (follower_id, followee_id), blocks (blocker_id, blocked_id).

Do Chunk 5.1 and 5.2:
1. Follow: (a) Helper to insert into follows (follower_id, followee_id). If follower_id === followee_id, do not insert (self-follow). Idempotent on duplicate. (b) POST /api/users/:id/follow (protected): current user = follower, :id = followee. 404 if target user not found; 400 if self-follow. 204 or 200. (c) Helper to delete from follows. (d) DELETE /api/users/:id/follow (protected): unfollow. 204.
2. Block: (a) Helper to insert into blocks (blocker_id, blocked_id). No self-block (blocker_id !== blocked_id). Idempotent. (b) POST /api/users/:id/block (protected): current user = blocker. 404 if target not found; 400 if self. 204. (c) Unblock helper and DELETE /api/users/:id/block. 204.
3. Confirm the feed (Phase 4) uses the same blocked-set logic so that when A blocks B, neither sees the other's content in the feed.

Checkpoint: Follow/unfollow another user (400 on self-follow). Block/unblock another user (400 on self-block). After blocking, feed does not show that user's tweets and vice versa.
```

---

## Prompt 9 — Phase 6: Likes and retweets

```
Implement Phase 6 (Likes and retweets) from plan.md.

Context:
- Backend has auth, profile, tweets, feed, follow, block. Follow plan.md and spec.md. likes table: (tweet_id, user_id). Retweet = new row in tweets with user_id and retweeted_from = original tweet id, text = null. One retweet per user per original.

Do Chunk 6.1 and 6.2:
1. Like: (a) Helper insert into likes (tweet_id, user_id). Idempotent. (b) POST /api/tweets/:id/like (protected). 404 if tweet missing. 204 or 200. (c) Unlike helper (delete from likes). (d) DELETE /api/tweets/:id/like (protected). 204.
2. Retweet: (a) Helper: check no existing tweet with same user_id and retweeted_from = original_id; then insert tweet (user_id, retweeted_from = original_id, text = null). Return new tweet. 409 or no-op if already retweeted. (b) POST /api/tweets/:id/retweet (protected). 404 if original missing; 409 if already retweeted. Return created retweet. (c) Unretweet helper: delete from tweets where user_id = ? and retweeted_from = ?. (d) DELETE /api/tweets/:id/retweet (protected). 204.
3. Ensure feed and any tweet response resolve retweeted_from (original tweet content and author) so retweets display correctly. Feed already includes liked and retweeted booleans; keep that.

Checkpoint: Like/unlike a tweet. Retweet/unretweet (one per user per original). Feed shows retweets with original content; liked and retweeted flags correct.
```

---

## After all prompts

Once all 9 prompts are implemented:

- Run through the **spec.md** checklist (all 16 required features).
- Ensure **requireAuth** is applied to all `/api/*` routes except `/api/auth/login` and `/api/auth/signup`.
- Test with the frontend or with a tool like Postman/curl (signup → login → use session cookie for protected routes).
