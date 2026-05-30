# ✦ Tasky — To-Do App (Rebuilt)

A full-stack To-Do application with a properly structured React frontend (Vite) and Python Flask backend. This is a multi-file rewrite of the original single-`index.html` project.

---

## 📁 Project Structure

```
todo-app/
├── frontend/
│   ├── index.html                   # Vite entry HTML
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # Root component (state + API calls)
│       ├── data/
│       │   └── todos.json           # Seed / fallback data
│       ├── components/
│       │   ├── Header.jsx           # Title + stats bar
│       │   ├── TodoForm.jsx         # Add-task form (expandable)
│       │   ├── FilterBar.jsx        # Status + category filters
│       │   ├── TodoList.jsx         # Renders the list
│       │   └── TodoItem.jsx         # Single task row
│       └── styles/
│           ├── global.css           # CSS variables, reset, body
│           ├── Header.css
│           ├── TodoForm.css
│           ├── FilterBar.css
│           ├── TodoList.css
│           └── TodoItem.css
├── backend/
│   ├── app.py                       # Flask app + SQLAlchemy models + routes
│   ├── todos.json                   # Seed data (loaded on first run)
│   ├── requirements.txt
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Features

- Add tasks with title, description, priority (low/medium/high), and category
- Mark tasks complete / incomplete
- Delete tasks with smooth animation
- Filter by status (All / Open / Done) and category
- Stats counter (Total / Open / Done) in the header
- **Offline-first**: frontend falls back to `todos.json` if the backend is unavailable
- Optimistic UI updates — no loading spinners on actions

---

## 🛠 Tech Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | React 18, Vite, CSS Modules (per-component) |
| Backend  | Python 3.11, Flask, Flask-SQLAlchemy         |
| Database | PostgreSQL (Railway) / SQLite (local dev)   |
| Seed     | `todos.json` (both frontend & backend)      |

---

## 🔧 Local Development

### Option A — Docker Compose (recommended)

```bash
git clone <repo>
cd todo-app
docker-compose up
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Option B — Manual

**Backend**
```bash
cd backend
pip install -r requirements.txt
python app.py          # starts on :5000, seeds DB from todos.json
```

**Frontend**
```bash
cd frontend
npm install
npm run dev            # starts on :3000, proxies /todos → :5000
```

---

## 📌 Environment Variables

| Variable       | Description                          | Default              |
|----------------|--------------------------------------|----------------------|
| `DATABASE_URL` | PostgreSQL connection string         | SQLite (`todos.db`)  |
| `VITE_API_URL` | Backend base URL (set in frontend)   | `http://localhost:5000` |

---

## 👨‍💻 Author
Melwin LJ — rebuilt with multi-file architecture by Claude
# trigger test
# trigger test
