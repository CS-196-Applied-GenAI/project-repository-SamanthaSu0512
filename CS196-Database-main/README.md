# 🚀 Database Setup Guide: Getting Started with MySQL

Welcome! This guide is designed to help you get your local environment up and running with **MySQL** and populate your database using the files in the `/schema` folder. 

Don't worry if you've never used a database before—we'll take it one step at a time.

---

## 🛠 Step 1: Install MySQL

Before you can run any SQL files, you need the MySQL server installed on your machine.

### For Windows
1. Download the **MySQL Installer** from the [official downloads page](https://dev.mysql.com/downloads/installer/).
2. Choose the **"Developer Default"** setup type.
3. **Important:** During the "Accounts and Roles" step, you will be asked to set a **Root Password**. Write this down! You will need it to log in.

### For macOS
1. The easiest way is using [Homebrew](https://brew.sh/). Open your terminal and run:
   ```bash
   brew install mysql


2. Once installed, start the service:
```bash
brew services start mysql

```

### For Linux (Ubuntu/Debian)

1. Run the following in your terminal:
```bash
sudo apt update
sudo apt install mysql-server

```



---

## 🔑 Step 2: Accessing the MySQL Shell

To verify everything is working, open your terminal (or Command Prompt) and type:

```bash
mysql -u root -p

```

* `-u root`: This tells MySQL you want to log in as the "root" user (the admin).
* `-p`: This tells MySQL to prompt you for the password you created during installation.

If you see `mysql>`, you're in! Type `exit` to leave the shell for now.

---

## 📂 Step 3: Running the Schema Files

The `/schema` folder contains `.sql` files that define the structure of your database (tables, columns, etc.). You should generally run them in the order they are numbered (e.g., `01_schema.sql`, then `02_seeds.sql`).

The document visualizing this schema and explaining it in detail can be found [here](docslink)

### Method A: Using the Command Line (Recommended)

This is the fastest way to "pipe" a file directly into MySQL. Run this command from the **root of this project folder**:

```bash
mysql -u root -p < schema/01_schema.sql

```

> **Note:** Replace `01_schema.sql` with the actual name of the file you want to run. You will be prompted for your password after hitting Enter.

### Method B: Inside the MySQL Shell

If you are already logged into the MySQL prompt, you can use the `source` command:

1. Log in: `mysql -u root -p`
2. Select your database (if you've created one): `USE my_database_name;`
3. Run the file:
```sql
source schema/01_schema.sql;

```



---

## 🔍 Troubleshooting Tips

* **"Command not found":** If your terminal doesn't recognize `mysql`, you may need to add MySQL to your system's **PATH environment variables**.
* **Permission Denied:** On Linux/Mac, you might need to use `sudo` for certain installation steps.
* **Syntax Errors:** Ensure you are running the files in the correct order. For example, you can't add data to a table (seed) if the table hasn't been created yet (schema).

---
```
