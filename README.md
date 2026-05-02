# EtheraAI Team Task Manager

A full-stack web application where users can create projects, assign tasks, and track team progress. Features role-based access control, a Kanban-style task board, and a modern glassmorphism UI.

## Features
- **Authentication**: JWT-based login and signup.
- **Project Management**: Create projects and track overall completion progress.
- **Team Collaboration**: Add team members to projects with Role-Based Access Control (Admin/Member).
- **Task Tracking**: Create tasks, set priorities, assign users, track status (To Do, In Progress, Review, Done), and set due dates.
- **Dashboard**: Aggregate statistics showing total projects, task counts by status, overdue tasks, and a breakdown of progress per project.
- **UI/UX**: Responsive dark mode design with glassmorphism effects and subtle animations.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Sequelize ORM). SQLite is used automatically for local development.
- **Frontend**: Vanilla HTML/CSS/JS (SPA architecture with hash routing)

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   (For local development without PostgreSQL, the app will automatically fall back to SQLite).

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to `http://localhost:3000` in your browser.

## Railway Deployment

This app is ready to be deployed on Railway.

1. Create a new project on Railway and connect your GitHub repository.
2. Add a PostgreSQL database service.
3. In the Web service variables, add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = `your-secure-random-string`
   - `NODE_ENV` = `production`
4. Generate a public domain under Settings > Networking.
