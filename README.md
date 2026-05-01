# TaskFlow Team Task Manager

A full-stack web application for team task management with role-based access control (Admin/Member), project management, task tracking with Kanban boards, and a real-time dashboard.

## Live Demo

**Live URL:** [https://taskflow-production-132b.up.railway.app](https://taskflow-production-132b.up.railway.app)

## Features

- **Authentication** Secure signup/login with JWT tokens
- **Project Management** Create, update, and delete projects with color coding
- **Team Management** Add/remove members with Admin & Member roles
- **Task Tracking** Kanban-style board with To Do, In Progress, Review, Done columns
- **Dashboard** Overview of tasks, status distribution, overdue items, and recent activity
- **Role-Based Access Control**
  - **Admin**: Full project control, manage members, create/edit/delete tasks
  - **Member**: View tasks, update task status
- **Responsive Design** Works on desktop, tablet, and mobile

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router v6     |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB with Mongoose ODM           |
| Auth       | JWT (JSON Web Tokens) + bcrypt      |
| Validation | express-validator                   |
| Styling    | Custom CSS (90s Newspaper Neo-Brutalist) |
| Deployment | Railway                             |

## Project Structure

```
EtharaAI/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # Axios instance with interceptors
│   │   ├── components/     # Layout component
│   │   ├── context/        # Auth context provider
│   │   └── pages/          # Dashboard, Projects, ProjectDetail, Login, Register
│   └── package.json
├── server/                 # Express Backend
│   ├── config/             # Database connection
│   ├── controllers/        # Auth, Project, Task controllers
│   ├── middleware/          # JWT auth & RBAC middleware
│   ├── models/             # User, Project, Task Mongoose models
│   ├── routes/             # API route definitions
│   └── server.js           # Express app entry point
├── package.json            # Root scripts for deployment
├── railway.toml            # Railway deployment config
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint               | Access  | Description         |
|--------|------------------------|---------|---------------------|
| POST   | `/api/auth/register`   | Public  | Register new user   |
| POST   | `/api/auth/login`      | Public  | Login user          |
| GET    | `/api/auth/me`         | Private | Get current user    |
| GET    | `/api/auth/users/search` | Private | Search users      |

### Projects
| Method | Endpoint                          | Access        | Description          |
|--------|-----------------------------------|---------------|----------------------|
| POST   | `/api/projects`                   | Private       | Create project       |
| GET    | `/api/projects`                   | Private       | Get user's projects  |
| GET    | `/api/projects/:id`               | Member        | Get project detail   |
| PUT    | `/api/projects/:id`               | Admin         | Update project       |
| DELETE | `/api/projects/:id`               | Admin         | Delete project       |
| POST   | `/api/projects/:id/members`       | Admin         | Add member           |
| DELETE | `/api/projects/:id/members/:uid`  | Admin         | Remove member        |
| PUT    | `/api/projects/:id/members/:uid`  | Admin         | Change member role   |

### Tasks
| Method | Endpoint                                    | Access  | Description        |
|--------|---------------------------------------------|---------|--------------------|
| POST   | `/api/projects/:pid/tasks`                  | Member  | Create task        |
| GET    | `/api/projects/:pid/tasks`                  | Member  | Get project tasks  |
| GET    | `/api/projects/:pid/tasks/:tid`             | Member  | Get single task    |
| PUT    | `/api/projects/:pid/tasks/:tid`             | Member* | Update task        |
| DELETE | `/api/projects/:pid/tasks/:tid`             | Admin   | Delete task        |

### Dashboard
| Method | Endpoint         | Access  | Description          |
|--------|------------------|---------|----------------------|
| GET    | `/api/dashboard`  | Private | Get dashboard data  |

> *Members can only update task status; Admins can update all fields.

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd EtharaAI

# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# Run both servers
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

## Railway Deployment

1. Push code to GitHub
2. Go to [Railway](https://railway.app) -> New Project -> Deploy from GitHub
3. Add a MongoDB service (Railway Plugin or MongoDB Atlas)
4. Set environment variables:
   - `MONGODB_URI` your MongoDB connection string
   - `JWT_SECRET` a strong random secret
   - `JWT_EXPIRES_IN` `7d`
   - `NODE_ENV` `production`
   - `CLIENT_URL` your Railway frontend URL
5. Deploy Railway auto-detects `railway.toml` config

## Author

Built for EtharaAI Team Task Manager Assignment.

