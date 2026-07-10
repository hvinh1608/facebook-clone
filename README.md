# Nexus - Premium Social Network Platform

Nexus is a modern, premium, dark-mode-first social media application built with a robust monorepo structure. It provides rich glassmorphism UI interactions, real-time messaging, notifications, groups, stories, and comprehensive admin controls.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Zustand + Tailwind CSS + Socket.io Client
- **Backend**: Node.js + Express.js + TypeScript + Socket.IO + Multer (Local Media Uploads)
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Authentication**: JWT Access Token & Refresh Token rotation + Google Auth OAuth Mock
- **Orchestration**: Docker + Docker Compose

---

## Pre-configured Demo Accounts
To log in immediately without registering, you can use these seeded credentials:
- **Normal User Account**:
  - **Email**: `alice@nexus.com`
  - **Password**: `password123`
- **Administrator Account**:
  - **Email**: `admin@nexus.com`
  - **Password**: `password123`

---

## Quick Start (Using Docker Compose)
The easiest way to spin up the entire application (PostgreSQL, Backend, and Frontend) is using Docker Compose.

1. **Clone the repository and go to the project root.**
2. **Launch all containers**:
   ```bash
   docker-compose up --build
   ```
3. **Database Initialization (inside container)**:
   Once the containers are running, run the following commands in a new terminal window to push the database schema and seed the mock data:
   - Generate client types:
     ```bash
     docker exec -it nexus-backend npm run db:generate
     ```
   - Push schemas to PostgreSQL:
     ```bash
     docker exec -it nexus-backend npm run db:push
     ```
   - Seed database mock users/posts/chats:
     ```bash
     docker exec -it nexus-backend npm run db:seed
     ```
4. **Access the application**:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend Server API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## Local Development (Without Docker)
If you prefer running the application locally on your host OS, make sure you have a local PostgreSQL instance running.

1. **Configure Environment Variables**:
   - Copy `.env.example` to `.env` at the project root.
   - Adjust `DATABASE_URL` with your local PostgreSQL credentials (e.g., `postgresql://postgres:password@localhost:5432/nexus?schema=public`).

2. **Install Workspace Dependencies**:
   ```bash
   npm install
   ```

3. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

4. **Sync Schema & Push to Database**:
   ```bash
   npm run db:push
   ```

5. **Seed Mock Data**:
   ```bash
   npm run db:seed
   ```

6. **Start Frontend & Backend Development Servers**:
   ```bash
   npm run dev
   ```
   - Frontend compiles at: `http://localhost:3000`
   - Backend boots up at: `http://localhost:5000`

---

## Monorepo Project Structure
```
.
├── apps
│   ├── backend/         # Express.js + Socket.IO Server (Port 5000)
│   └── frontend/        # Next.js App Router UI Client (Port 3000)
├── packages
│   └── database/        # Shared Prisma ORM client & seed configurations
├── docker-compose.yml   # Multi-service setup (Postgres, backend, frontend)
├── package.json         # Workspace execution manager scripts
└── README.md
```

## Features Complete Checklist
1. **Authentication**: Sign up, Login, Cookie-based silent token refresh, Mock Google Auth.
2. **User Profiles**: Edit profile details, upload avatar/cover, block/unblock, follow/unfollow.
3. **Feed & Posts**: Publish posts with text, images/videos, reactions emoji panel, nested comments/replies tree.
4. **Connections**: Add friends, cancel request, accept/decline, unfriend, suggestions.
5. **Real-time Chat**: 1-1 and group chats, media files attachments, typing status indicators, message deletions.
6. **Real-time Notifications**: Badge counts on Likes, Comments, Friend requests, Messages.
7. **Stories**: Create stories (expiring in 24 hours), viewer count analytics for authors.
8. **Group Communities**: Create groups (Public/Private), pending membership requests review, publish posts inside groups.
9. **Admin Panel**: Graphical overview statistics, block violation accounts, delete violation posts and resolve reports.
