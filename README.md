# MediCore — Hospital Management System

A production-grade full-stack application built with **Express.js**, **PostgreSQL**, and **Prisma ORM**.  
Frontend: vanilla HTML + CSS + JavaScript SPA. Deployed on **Render**.

---

## Features

- **Dashboard** — live stats, ward occupancy bars, recent assignments, full-capacity alerts
- **Patients** — searchable sortable table, full CRUD with modal forms
- **Wards** — card grid with occupancy progress bars, availability colour-coding
- **Doctors** — searchable table, active case counts
- **Assignments** — assign a patient to a ward (core flow), discharge, history tabs
- Transactional assignment creation with `SELECT ... FOR UPDATE` row-locking (prevents overbooking)
- Occupancy invariant enforced at application layer and via DB `CHECK` constraint

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | PostgreSQL 14+ |
| ORM | Prisma 5 (`@prisma/client`) |
| Validation | express-validator 7 |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Deploy | Render (Web Service + Render PostgreSQL) |

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- `psql` CLI

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/hospital-management-system.git
cd hospital-management-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL connection string:
# DATABASE_URL=postgresql://user:password@localhost:5432/hospital_db
```

### 3. Run Prisma migrations

```bash
npx prisma migrate dev --name init
```

### 4. Apply the CHECK constraint (optional but recommended)

```bash
psql "$DATABASE_URL" -f prisma/migrations/0001_add_check_constraint.sql
```

### 5. Seed the database

```bash
npm run db:seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).  
Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Prisma Workflow

| Command | Purpose |
|---|---|
| `npm run prisma:migrate` | Create and apply a new migration (dev only) |
| `npm run prisma:deploy` | Apply pending migrations (production) |
| `npm run prisma:generate` | Regenerate Prisma Client after schema changes |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Seed the database with sample data |

---

## API Reference

All routes are prefixed with `/api`.

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service health check |

### Patients
| Method | Path | Description |
|---|---|---|
| GET | `/api/patients` | List all patients |
| GET | `/api/patients/:id` | Get patient + assignment history |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient (cascades assignments) |

### Wards
| Method | Path | Description |
|---|---|---|
| GET | `/api/wards` | List wards (includes `availableBeds`) |
| GET | `/api/wards/:id` | Get ward + active assignments |
| POST | `/api/wards` | Create ward |
| PUT | `/api/wards/:id` | Update ward |
| DELETE | `/api/wards/:id` | Delete ward (restricted if occupied) |

### Doctors
| Method | Path | Description |
|---|---|---|
| GET | `/api/doctors` | List doctors (includes active case count) |
| GET | `/api/doctors/:id` | Get doctor + assignments |
| POST | `/api/doctors` | Create doctor |
| PUT | `/api/doctors/:id` | Update doctor |
| DELETE | `/api/doctors/:id` | Delete doctor |

### Assignments
| Method | Path | Description |
|---|---|---|
| GET | `/api/assignments` | List all (supports `?status=active`) |
| GET | `/api/assignments/:id` | Get assignment (flattened) |
| POST | `/api/assignments` | **Create assignment (transactional, row-locked)** |
| PUT | `/api/assignments/:id` | Update / discharge (`{ "status": "discharged" }`) |
| DELETE | `/api/assignments/:id` | Delete (decrements occupancy if active) |

---

## Deploying to Render

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "chore: initial production build"
git push origin main
```

### Step 2 — Deploy via Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New +** → **Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` automatically — click **Apply**
5. The build runs: `npm install && npx prisma generate && npx prisma migrate deploy`

### Step 3 — Seed production data

In Render Dashboard → your Web Service → **Shell**:

```bash
npm run db:seed
```

### Step 4 — Verify

```
https://your-app.onrender.com/api/health
```

Should return: `{ "success": true, "status": "ok", "timestamp": "..." }`

### Free tier notes

- Web service **sleeps after 15 minutes** of inactivity — first request takes 30–60s to wake
- Render PostgreSQL on the free tier **expires after 90 days**
- If your Render DB URL requires SSL, append `?sslmode=require` to `DATABASE_URL` in Render environment variables (Render injects the correct URL automatically via `render.yaml`)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: `5000`) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## Project Structure

```
hospital-management-system/
├── prisma/
│   ├── schema.prisma          # Prisma schema with enums + relations
│   ├── seed.js                # Idempotent seed script
│   └── migrations/
│       └── 0001_add_check_constraint.sql
├── src/
│   ├── config/prisma.js       # Prisma Client singleton
│   ├── middleware/
│   │   ├── errorHandler.js    # Central error handler (maps Prisma codes)
│   │   ├── notFound.js        # 404 handler
│   │   └── validate.js        # express-validator collector
│   ├── controllers/           # Business logic per resource
│   ├── routes/                # Express routers
│   ├── validators/            # express-validator rule chains
│   ├── utils/ApiError.js      # Typed operational errors
│   ├── app.js                 # Express app setup
│   └── server.js              # HTTP server bootstrap
├── public/
│   ├── index.html             # SPA shell
│   ├── css/styles.css         # Full design system
│   └── js/                    # Modular vanilla JS
├── postman/                   # Postman collection
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```
