# FlowDeps — Dependency-Based Task Execution System

A full-stack web application that lets teams manage tasks in the right order. Creators define the task graph and dependencies; executors only see tasks that are genuinely unblocked; and an AI layer suggests dependencies, priorities, and the best person for the job.

---

## Main Objective

Most task tools treat every task as independent. FlowDeps models the reality that **task B cannot start until task A is done**. The system enforces this at the database level — executors literally cannot see or claim tasks whose dependencies are incomplete. This prevents wasted effort, reduces blockers, and keeps work flowing in the correct sequence.

---

## Features

### Core Task Management
- **Dependency graph** — every task can declare one or more prerequisite tasks; the system computes and visualises the full graph with React Flow
- **Role-based access** — Creators define and manage the task graph; Executors can only see and claim tasks whose dependencies are fully completed
- **Atomic task claiming** — two executors cannot claim the same task; enforced at the database level
- **Cycle prevention** — the API rejects any dependency that would create a circular chain (A → B → A)
- **Critical path detection** — the longest dependency chain is computed so you know which delays actually hurt the project
- **Task status workflow** — `pending → in-progress → completed / blocked` with full transition validation
- **Kanban board** — drag-and-drop visual task management by status column
- **Task history** — every status change is recorded with who changed it and when
- **Comments** — threaded comments on individual tasks

### AI Assistance
- AI-powered dependency suggestions when creating a new task
- Priority recommendations based on task context
- Executor matching — suggests the best executor for a given task

### Email Notifications (Automated)
| Trigger | Recipient |
|---|---|
| All dependencies of a task are completed | Assigned executor |
| Executor completes a task | Task creator |
| Task is past its due date | Task creator |
| Daily digest of all blocked tasks | All creators (9 AM daily) |

### Reports & Analytics
- Task completion rate and breakdown by status and priority
- Team performance leaderboard — tasks completed, efficiency score
- Dependency health score — percentage of tasks with all deps satisfied
- Tasks created over the last 30 days (time-series chart)
- CSV export of all task data

### Auth & Profile
- JWT-based authentication with secure HTTP-only cookies
- Two roles: **Creator** and **Executor**
- Forgot password — direct reset flow (no email link; enter new password on the page)
- Change password from profile
- Notification preferences — enable/disable email notifications per user
- Dark / Light mode toggle with full theme support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Recharts, React Flow, React Hot Toast |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcryptjs + cookie-parser |
| Email | Nodemailer (Gmail SMTP) |
| Scheduling | node-cron |
| AI | OpenAI API (via custom AI controller) |

---

## Project Structure

```
task-depend/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── nodemailerAuth.js       # Email transporter + all email templates
│   │   ├── controllers/
│   │   │   ├── aiController.js         # AI suggestions (deps, priority, executor)
│   │   │   ├── authController.js       # Register, login, forgot/reset password
│   │   │   ├── reportController.js     # Analytics, team performance, CSV export
│   │   │   ├── taskController.js       # Full task CRUD + notifications
│   │   │   └── userController.js       # User management
│   │   ├── database/
│   │   │   └── connection.js           # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT verification
│   │   │   └── errorMiddleware.js      # Global error handler
│   │   ├── models/
│   │   │   ├── taskModel.js            # Task schema (deps, history, comments)
│   │   │   └── userModel.js            # User schema (roles, performance, prefs)
│   │   ├── routers/
│   │   │   ├── aiRouter.js
│   │   │   ├── authRouter.js
│   │   │   ├── reportRouter.js
│   │   │   ├── taskRouter.js
│   │   │   └── userRouter.js
│   │   ├── utils/
│   │   │   ├── automations.js          # Cron job logic (delay alerts, digests)
│   │   │   ├── generateToken.js        # JWT token helper
│   │   │   └── testEmail.js            # Email connection test
│   │   └── server.js                   # Express app + cron scheduler
│   ├── .env                            # Backend environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # Axios instance with base URL + auth header
│   │   ├── components/
│   │   │   ├── Charts/
│   │   │   │   ├── PerformanceChart.jsx
│   │   │   │   └── TaskStatusChart.jsx
│   │   │   ├── Common/
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── PriorityBadge.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   ├── TaskCard.jsx
│   │   │   │   └── Toast.jsx
│   │   │   ├── Forms/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── TaskForm.jsx
│   │   │   └── Layout/
│   │   │       ├── Header.jsx          # Top bar with theme toggle and notifications
│   │   │       ├── Layout.jsx          # Main app shell (sidebar + header + content)
│   │   │       └── Sidebar.jsx         # Role-aware navigation sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Auth state, theme (dark/light), login/register
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── ForgotPassword.jsx  # 2-step password reset (no email link)
│   │   │   │   ├── Login.jsx           # Sign in + Sign up on one page
│   │   │   │   └── Register.jsx        # Redirects to Login signup tab
│   │   │   ├── Dashboard/
│   │   │   │   ├── CreatorDashboard.jsx
│   │   │   │   └── ExecutorDashboard.jsx
│   │   │   ├── Executor/
│   │   │   │   └── AvailableTasks.jsx  # Tasks with all deps completed
│   │   │   ├── Landing/
│   │   │   │   └── Landing.jsx
│   │   │   ├── Notifications/
│   │   │   │   └── Notifications.jsx
│   │   │   ├── Profile/
│   │   │   │   └── Profile.jsx
│   │   │   ├── Reports/
│   │   │   │   └── Reports.jsx
│   │   │   └── Tasks/
│   │   │       ├── CreateTask.jsx
│   │   │       ├── EditTask.jsx
│   │   │       ├── KanbanBoard.jsx
│   │   │       ├── TaskDetail.jsx      # Dependency graph + comments + history
│   │   │       └── TaskList.jsx
│   │   ├── reducer/
│   │   │   └── taskReducer.js
│   │   ├── routers/
│   │   │   └── AppRouter.jsx           # Route guards by auth + role
│   │   ├── services/                   # API call wrappers
│   │   │   ├── aiService.js
│   │   │   ├── authService.js
│   │   │   ├── reportService.js
│   │   │   ├── taskService.js
│   │   │   └── userService.js
│   │   ├── App.css                     # Global styles + CSS variables (dark/light)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                            # Frontend environment variables
│   └── package.json
│
└── README.md
```

---

## Project Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** database (MongoDB Atlas free tier works fine)
- A **Gmail** account with an [App Password](https://support.google.com/accounts/answer/185833) for email notifications

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd task-depend
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` with the following:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/TaskExecutionSystem

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

Start the backend development server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

---

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` with the following:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

### 4. Build for production

**Backend** (runs as-is with Node):
```bash
cd backend
npm start
```

**Frontend** (generates static files in `dist/`):
```bash
cd frontend
npm run build
npm run preview
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create new account | Public |
| POST | `/api/auth/login` | Sign in | Public |
| POST | `/api/auth/forgot-password` | Verify email for reset | Public |
| POST | `/api/auth/reset-password/:token` | Set new password directly | Public |
| GET | `/api/auth/me` | Get current user profile | Required |
| POST | `/api/auth/change-password` | Change password | Required |
| GET | `/api/tasks` | List all tasks (role-filtered) | Required |
| POST | `/api/tasks` | Create a task | Creator |
| GET | `/api/tasks/:id` | Get task details | Required |
| PUT | `/api/tasks/:id` | Update task | Creator |
| DELETE | `/api/tasks/:id` | Delete task | Creator |
| PUT | `/api/tasks/:id/execute` | Claim / update task status | Executor |
| GET | `/api/tasks/available` | Tasks ready to be claimed | Executor |
| GET | `/api/tasks/dashboard` | Dashboard stats | Required |
| GET | `/api/reports/analytics` | Task analytics | Creator |
| GET | `/api/reports/team-performance` | Team performance data | Creator |
| GET | `/api/reports/export/csv` | Export all tasks as CSV | Creator |
| POST | `/api/ai/suggest` | AI suggestions for a task | Required |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWTs | `any_long_random_string` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `EMAIL_USER` | Gmail address for sending emails | `you@gmail.com` |
| `EMAIL_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |


### SAMPLE LOGIN USERS


**FOR CREATORS**
1. Email: admin@example.com, Password: admin@123
2. Email: e0323043@sriher.edu.in, Password: vedhasri@2006
3. Email: vedhakumar0665@gmail.com, Password: vedha@123

**FOR EXECUTORS**
1. Email: john@example.com, Password: john@123
2. Email: harsh@gmail.com, Password: password321
