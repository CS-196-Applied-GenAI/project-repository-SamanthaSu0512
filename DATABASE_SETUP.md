# Database setup (Option A — local MySQL)

MySQL for this project runs **locally** (no Docker). Use Homebrew to install and run MySQL on your Mac.

---

## Where to run commands

**Run all commands below from the project root** (the folder that contains `spec.md`, `plan.md`, and `CS196-Database-main`).

On your machine that’s:

```text
/Users/yuyansu/Documents/GitHub/project-repository-SamanthaSu0512
```

In the terminal:

```bash
cd /Users/yuyansu/Documents/GitHub/project-repository-SamanthaSu0512
```

Then run each step from that directory (except the schema commands: those use paths from project root).

---

## 1. Install MySQL (if not already installed)

```bash
brew install mysql
```

---

## 2. Start MySQL

```bash
brew services start mysql
```

Homebrew’s MySQL often does **not** ask for a password; root may have an empty password. For the commands below, use `-u root -p` and press Enter when asked for a password (empty = no password). If you want to set a root password later, run `mysql_secure_installation`.

---

## 3. Create the database

From the **project root**:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS chirper;"
```

Enter your MySQL root password when prompted.

---

## 4. Run the schema

**Do not run** `chirper_full_schema.sql` as a single file — table order is wrong. Run these from the **project root**:

```bash
mysql -u root -p chirper < CS196-Database-main/schema/01_users.sql
mysql -u root -p chirper < CS196-Database-main/schema/02_tweets.sql
mysql -u root -p chirper < CS196-Database-main/schema/03_likes.sql
mysql -u root -p chirper < CS196-Database-main/schema/04_comments.sql
mysql -u root -p chirper < CS196-Database-main/schema/05_auth.sql
mysql -u root -p chirper < CS196-Database-main/schema/05_follows.sql
mysql -u root -p chirper < CS196-Database-main/schema/06_blocks.sql
```

Enter your MySQL root password when prompted for each (or once if your client caches it).

---

## 5. Backend `.env`

Your Node app will read these from a file named **`.env`**. Create it in the same folder as your backend (e.g. project root or `server/` once you have one).

**How to set:**

1. In that folder, create a new file named exactly `.env` (the dot is part of the name).
2. Put these lines in it (one per line). Use your real MySQL root password, or leave `DB_PASSWORD=` empty if you have no password:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_root_password
   DB_NAME=chirper
   ```
3. Save the file. **Do not commit `.env` to git** — add `.env` to your `.gitignore` so passwords stay local.
4. If you don’t have a backend folder yet, you can create `.env` in the project root now and move or copy it when you create the app.

---

## 6. Verify

From the **project root**:

```bash
mysql -u root -p -e "USE chirper; SHOW TABLES;"
```

You should see: blocks, blacklisted_tokens, comments, follows, likes, tweets, users.

---

**Stop MySQL when you’re done:** `brew services stop mysql`
