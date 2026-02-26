# Twitter(X)-Style App — Project Specification

**Purpose:** Portfolio/resume project (4-week scope) to demonstrate fluency with AI coding tools.  
**Target:** Web application.  
**Grading context:** Implements required functionality for course submission (2.5 points per task, 16 tasks, 40 points max). Additional features (e.g. search) are welcome.

---

## 1. Tech Stack (Recommended for Code-Generation AI)

- **Frontend:** React (or Next.js with React) — single-page web app.
- **Backend:** Node.js with Express (or Next.js API routes).
- **Database:** MySQL. Use the **CS196 database structure** from:  
  [https://github.com/anyabdch/CS196-Database](https://github.com/anyabdch/CS196-Database)  
  Database name: `chirper`. Setup: run schema files in `schema/` in order (see repo README). Reference: `chirper_full_schema.sql` for full schema in one place.
- **Authentication:** Session-based (server-side sessions; use a session store such as DB or memory). No tasks or content viewable unless the user is logged in; logout destroys the session.
- **Profile pictures:** Upload only. User selects an image file; server stores it (e.g. under `uploads/` or similar) and saves the path/URL in `users.profile_picture` (VARCHAR(255)).

**Note:** The course schema uses `tweets.text VARCHAR(240)`. This spec uses a **240-character** limit to match the schema.

---

## 2. Database Reference (CS196 Chirper Schema)

- **users:** id, username (UNIQUE), password_hash, created_at, email (UNIQUE), bio, profile_picture, name  
- **tweets:** id, user_id, text (VARCHAR(240)), image_url, created_at, **retweeted_from** (FK to tweets.id, NULL for original tweets)  
- **likes:** (tweet_id, user_id) PK; FKs to tweets and users  
- **follows:** (follower_id, followee_id) PK; FKs to users  
- **blocks:** (blocker_id, blocked_id) PK; FKs to users  
- **comments:** (optional for this spec; not in required 16 features)  
- **blacklisted_tokens:** (optional if using session-based auth; can be ignored or repurposed for session invalidation)

**Retweet model:** A “retweet” is a new row in `tweets` with `user_id` = current user, `retweeted_from` = the original tweet’s id, and `text` NULL (or empty); display uses the original tweet’s content. “Unretweet” means deleting that retweet row. Enforce at most one retweet per user per original tweet so unretweet is well-defined.

---

## 3. Required Features (16 Items — Match Exactly for Grading)

### 3.1 Account & Auth

1. **Create an account**  
   - Usernames: unique (enforced in DB and on signup).  
   - Email: required and unique (per schema); collect on signup.  
   - Passwords: **length + complexity** — minimum 8 characters, at least one letter and one number (enforce on signup and optionally on change-password).  
   - Store only a secure hash (e.g. bcrypt) in `users.password_hash`.

2. **Login**  
   - Users cannot accomplish any task or view any content unless logged in. All protected routes and API endpoints must require a valid session.

3. **Logout**  
   - Destroy the server-side session; after logout, user cannot perform tasks or view content until logging in again.

### 3.2 Profile

4. **Update profile**  
   - Editable: **bio**, **username** (must remain unique), **profile picture** (via upload).  
   - Profile picture: accept file upload, store file, save path/URL in `users.profile_picture`.

### 3.3 Posts (Tweets)

5. **Post (tweet)**  
   - Character limit: **240** per tweet. Enforce in UI and API; persist in `tweets.text`.

6. **Delete a post**  
   - User can delete their own tweet(s). Remove row from `tweets` (and cascade will handle likes, etc. per schema).

### 3.4 Feed

7. **View a feed of recent tweets**  
   - **Blended feed:** Prefer tweets from users the current user **follows**; fill the rest with other recent tweets.  
   - Rule: when loading a batch, include a majority from followed accounts when available (e.g. at least 6 of 10 from followed users), then fill with most recent tweets from others. If the user follows few or no one, show global recent tweets.  
   - Order: **most recent first**.  
   - **Exclude** tweets from or by **blocked** users (see Block/Unblock): do not show tweets from users who blocked the viewer or whom the viewer blocked.

8. **Refresh tweet feed**  
   - Provide an explicit “Refresh” (or “Load latest”) control that reloads the feed from the top (e.g. fetch latest N tweets again).

### 3.5 Pagination

- **Page size:** 10 tweets per batch.  
- **Load more:** A “Load more” (or infinite scroll) that fetches the next 10 tweets (respecting the same blended + recency + block rules, and offset/cursor based on already-loaded tweets).

### 3.6 Follow

9. **Follow a user**  
   - Insert into `follows` (follower_id = current user, followee_id = target). Handle already-following (idempotent). Prevent self-follow (follower_id ≠ followee_id).

10. **Unfollow a user**  
    - Remove the row from `follows` for (current user, target).

### 3.7 Block

11. **Block a user**  
    - Insert into `blocks` (blocker_id = current user, blocked_id = target). Prevent self-block (blocker_id ≠ blocked_id).  
    - **Behavior:** The blocker sees no content from the blocked user; the blocked user sees no content from the blocker (e.g. in feed and any user-specific views, filter out tweets and profile content accordingly).

12. **Unblock a user**  
    - Remove the row from `blocks` for (current user, target).

### 3.8 Likes

13. **Like a post**  
    - Insert (tweet_id, user_id) into `likes`. Idempotent if already liked.

14. **Unlike a post**  
    - Remove the row from `likes` for that tweet and current user.

### 3.9 Retweet

15. **Retweet a post**  
    - Create a new row in `tweets` with `user_id` = current user and `retweeted_from` = the original tweet’s id. Prevent duplicate retweets: at most one retweet per user per original tweet (so unretweet always has exactly one row to delete).

16. **Unretweet a post**  
    - Delete the tweet row where `user_id` = current user and `retweeted_from` = that tweet’s id.

---

## 4. Additional Feature (In Scope)

- **Search**  
  - Search **posts** and **users** by keyword (e.g. match tweet text and username/display name).  
  - Simple implementation: MySQL `LIKE` on `tweets.text` and `users.username`/`users.name` (for case-insensitive search use a case-insensitive collation or `LOWER(column) LIKE LOWER(?)`).  
  - Results: list of matching tweets and/or users; respect block rules (don’t show content from blocked users).

---

## 5. Future / Optional (Not Required for 4-Week Deliverable)

- **Notifications** (e.g. “X liked your post”, “Y followed you”) — to be added if time permits.  
- **Replies (comments)** — not in the 16 required tasks; schema has `comments` table for future use.

---

## 6. Summary Checklist for Implementation

| # | Feature | Notes |
|---|--------|--------|
| 1 | Create account | Unique username and email; password: min 8 chars, 1 letter + 1 number |
| 2 | Login | Session-based; required for all actions/views |
| 3 | Logout | Destroy session |
| 4 | Update profile | Bio, username, profile picture (upload) |
| 5 | Post (tweet) | 240-character limit |
| 6 | Delete a post | Own tweets only |
| 7 | View feed | Blended (prefer followed), 10 per batch, most recent first, exclude blocked |
| 8 | Refresh feed | Reload from top |
| 9 | Follow user | |
| 10 | Unfollow user | |
| 11 | Block user | No content either way |
| 12 | Unblock user | |
| 13 | Like a post | |
| 14 | Unlike a post | |
| 15 | Retweet | New tweet with retweeted_from |
| 16 | Unretweet | Delete retweet row |
| + | Search | Posts + users by keyword |
| + | Load more | 10 tweets per batch |

---

## 7. Handoff Notes for Code-Generation AI

- Use the CS196 MySQL schema and repo for table definitions and setup.  
- Enforce “logged in required” on every protected route and API call; redirect or 401 when no valid session.  
- Apply block logic everywhere: feed, search, user profiles, and any listing of tweets or users.  
- Keep session handling on the server (session store + cookie); do not rely on JWT for the main auth flow.  
- Profile picture: validate file type/size on upload; store file and save path in `users.profile_picture`.
