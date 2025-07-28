# 🧠 Neurobase

> Natural Language Interface for Your Database

Neurobase lets you **query your database in plain English** — no SQL required. Powered by AI and designed for modern teams, it helps you go from question to data in seconds.

---

## 🚀 Features

- 🔎 Ask questions like:  
  _“What’s the total revenue last month?”_  
  _“Show top 5 users by activity”_
- 📦 Supports **PostgreSQL**, **MySQL**, and **Supabase**
- 🧠 Built with **AI SDKs**, natural language processing, and query optimization
- 🖥️ Clean **Next.js + Tailwind UI**
- 🐳 One-click **Docker deployment**
- 🛡️ Role-based access (Coming soon)

---

## 🧑‍💻 Tech Stack

| Layer      | Tech Used                      |
|------------|-------------------------------|
| Frontend   | Next.js, TypeScript, Tailwind |
| Backend    | Node.js, OpenAI SDK           |
| Database   | PostgreSQL, Supabase          |
| DevOps     | Docker, Railway/Vercel        |

---

## 📸 Preview

![Neurobase Screenshot](/Screenshot From 2025-07-28 12-48-46.png) <!-- Replace with actual image path -->

---

## 🛠️ Setup Instructions

```bash
git clone https://github.com/Blackrose-blackhat/neurobase.git
cd neurobase
cp .env.example .env.local
# Add your OpenAI + DB credentials
pnpm install
pnpm dev
