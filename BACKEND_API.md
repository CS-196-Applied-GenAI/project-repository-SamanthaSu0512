# Backend API (frontend contract)

The frontend expects these endpoints. All require session cookies (`credentials: 'include'`) except signup and login. Base path in dev: `/api` (Vite proxies to backend on port 3000).

## Auth (`/api/auth`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/signup` | No | `{ username, email, password, name? }` | 201 `user` |
| POST | `/login` | No | `{ username?, email?, password }` | 200 `user` |
| GET | `/me` | Yes | — | 200 `user` or 401 |
| POST | `/logout` | Yes | — | 204 |

## Users (`/api/users`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/me` | Yes | — | 200 `user` |
| GET | `/me/tweets?limit=5` | Yes | — | 200 `tweet[]` |
| GET | `/:username` | Yes | — | 200 `user` or 404 |
| GET | `/:username/tweets?limit=5` | Yes | — | 200 `tweet[]` or 404 |
| POST | `/:id/follow` | Yes | — | 204 or 404/400 |
| DELETE | `/:id/follow` | Yes | — | 204 or 404 |
| POST | `/:id/block` | Yes | — | 204 or 404/400 |
| DELETE | `/:id/block` | Yes | — | 204 or 404 |

## Feed (`/api/feed`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/` | Yes | `?limit=&offset=&before=` | 200 `tweet[]` |

Feed items: `{ id, user_id, text, created_at, retweeted_from, author: { id, username, name, profile_picture }, liked, retweeted, originalTweet? }`.

## Tweets (`/api/tweets`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/` | Yes | `{ text, parent_tweet_id? }` | 201 `tweet` or 400/404 |
| GET | `/:id/replies` | Yes | — | 200 `reply[]` or 404 |
| POST | `/:id/like` | Yes | — | 204 or 404 |
| DELETE | `/:id/like` | Yes | — | 204 or 404 |
| POST | `/:id/retweet` | Yes | — | 201 or 404/409 |
| DELETE | `/:id/retweet` | Yes | — | 204 or 404 |

## Health

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/health` | No | 200 `{ ok: true }` |

---

Backend must run on **port 3000** and have the database (and optional reply migration) applied. See `DATABASE_SETUP.md` and `frontend/README.md`.
