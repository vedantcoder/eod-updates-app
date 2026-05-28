# DevPulse — Progress Tracker

A full-stack web application where developers post daily EOD (End-of-Day) updates and admins track team progress with analytics.

## Features

- **User Authentication** — Register/Login with JWT tokens (HTTPBearer)
- **EOD Log CRUD** — Create, view, edit, delete daily standup updates
- **Personal Analytics** — View weekly stats (total hours, avg/day, tag frequency)
- **Admin Dashboard** — See all users, their logs, and collective stats
- **Team Support** — Assign users to teams, view team-wise analytics

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React with Vite
- **Database**: Supabase (PostgreSQL)
- **Auth**: HTTPBearer + JWT tokens
- **Deployment**: Render (backend), Vercel (frontend)

## Project Structure

```
eod-updates-app/
├── backend/
│   ├── main.py              # FastAPI app with all routes
│   ├── auth.py              # JWT + HTTPBearer logic
│   ├── models.py            # Pydantic schemas
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Login, Dashboard, Admin)
│   │   ├── context/         # Auth context
│   │   ├── api/             # API client
│   │   └── App.jsx          # Main app with routing
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite config
│   └── .env                 # Frontend env vars
├── schema.sql               # Supabase schema (run in SQL editor)
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Supabase account (free tier OK)

### Setup

#### 1. Database (Supabase)

1. Go to [Supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** → Copy & paste contents of `schema.sql` → Click **Run**
4. Copy your credentials:
   - Project URL
   - Anon Key
   - Service Role Key

#### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env and update with your Supabase credentials
cp .env.example .env  # Update SUPABASE_URL and SUPABASE_KEY

# Run server
python -m uvicorn main:app --reload
```

Server runs at `http://localhost:8000`

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env from .env.example (adjust API_URL if needed)
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

## API Endpoints

### Auth

- `POST /auth/register` — Register new user
- `POST /auth/login` — Login (returns JWT token)
- `GET /auth/me` — Get current user info (protected)

### Logs

- `POST /logs` — Create EOD log (protected)
- `GET /logs/my-logs` — Get user's logs (protected)
- `GET /logs/{log_id}` — Get single log (protected)
- `PUT /logs/{log_id}` — Update log (protected)
- `DELETE /logs/{log_id}` — Delete log (protected)

### Analytics

- `GET /analytics/my-stats?week=<date>` — User's weekly stats (protected)
- `GET /analytics/my-tags` — User's tag frequency (protected)

### Admin

- `GET /admin/users` — List all users with stats (admin only)
- `GET /admin/users/{user_id}/logs` — View user's logs (admin only)
- `GET /admin/stats` — Collective stats (admin only)

## Development

### Testing with Postman/Bruno

1. Register a user via `POST /auth/register`
2. Copy the `access_token` from response
3. In Postman, add header: `Authorization: Bearer <token>`
4. Test endpoints

### Debugging

- Backend logs print to console
- Frontend errors in browser console
- Check `.env` files are correctly configured

## Deployment

### Backend (Railway)

```bash
# Push to GitHub
git push

# On Railway.app:
# 1. Create new project
# 2. Connect GitHub repo
# 3. Set environment variables (SUPABASE_URL, SUPABASE_KEY, JWT_SECRET)
# 4. Deploy
```

### Frontend (Vercel)

```bash
# On Vercel:
# 1. Import GitHub repo
# 2. Set environment variable: VITE_API_URL=<railway-backend-url>
# 3. Deploy
```

## Future work (if time permits)

- [ ] Export weekly summary as Markdown
- [ ] AI Weekly Summary generation
- [ ] Blocker Intelligence (repeated blockers detection)
- [ ] Tone/Productivity Insight

## Contributing

This is an evaluation project for KVGAI Tech Pvt. Ltd. PS-I program.

## License

MIT
