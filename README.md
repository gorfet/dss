# DSS Enrollment Management System

A full-stack, role-aware **enrollment management system** for schools / universities. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind**, **Prisma**, and **PostgreSQL**. Ships with role-based dashboards for **Admin**, **Registrar**, **Faculty**, and **Student** users, plus authentication, audit logs, charts, exports, COR printing, and Docker support.

> Demo accounts (after seeding):
>
> | Role       | Email                  | Password      |
> |------------|------------------------|---------------|
> | Admin      | `admin@dss.local`      | `password123` |
> | Registrar  | `registrar@dss.local`  | `password123` |
> | Faculty    | `faculty@dss.local`    | `password123` |
> | Student    | `student@dss.local`    | `password123` |

---

## Features

### Authentication & security
- JWT sessions via **NextAuth** (Credentials provider)
- **bcrypt** password hashing (12 rounds)
- Role-based authorization at routes (`middleware.ts`) and API layer (`requireRole`)
- Password reset workflow (token-based, 1h expiry)
- **Audit logs** for create / update / delete / login / approve actions

### Student
- Online enrollment with **prerequisite checks**, **schedule conflict detection**, **unit limits**, and **waitlisting**
- Weekly schedule view, grades + GWA, balance/payments, COR (print/save PDF), announcements, profile

### Faculty
- View assigned sections + class lists
- Encode prelim / midterm / finals (auto-computed final grade) — students notified on post
- Attendance encoding
- Post announcements (audience-aware fan-out)

### Registrar
- Approve / reject enrollments
- Manage sections, schedules, room assignments
- Verify student records
- Tuition assessments, record payments (partial / paid / waived)
- Generate enrollment + faculty workload reports

### Admin
- Manage users (CRUD with role-specific profiles)
- Manage departments, courses, subjects (with prerequisites), school years, semesters, sections
- Assign faculty to subjects
- Analytics dashboards (Recharts)
- Audit log viewer, system settings
- Announcements

### UX & infrastructure
- Tailwind + shadcn-style primitives, **dark / light mode** (`next-themes`)
- Real-time in-app notifications (polled), email stub (logs to console without SMTP)
- CSV export for enrollments, students, grades
- Responsive layout with role-aware sidebar
- Print-friendly COR
- **Docker** + **docker-compose** for one-command deployment
- Seed data + ERD documentation

---

## Tech stack

| Layer    | Choice |
|---------|--------|
| Frontend | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Radix UI primitives, lucide-react, Recharts |
| Backend  | Next.js API routes (modular per domain), Zod input validation |
| Database | PostgreSQL via **Prisma** ORM |
| Auth     | NextAuth (Credentials, JWT) + bcrypt |
| State    | Server components + React hooks; SessionProvider client-side |
| Deploy   | Docker / docker-compose / Vercel-compatible |

---

## Project layout

```
.
├── prisma/
│   ├── schema.prisma           # DB schema
│   └── seed.ts                 # Sample data
├── src/
│   ├── app/
│   │   ├── (public)            # landing, login, register, forgot/reset
│   │   ├── dashboard/
│   │   │   ├── admin/          # admin pages
│   │   │   ├── registrar/      # registrar pages
│   │   │   ├── faculty/        # faculty pages
│   │   │   ├── student/        # student pages
│   │   │   └── profile/
│   │   └── api/                # REST API routes
│   ├── components/
│   │   ├── ui/                 # Tailwind+Radix primitives
│   │   ├── layout/             # dashboard shell, page header, stat card
│   │   ├── charts/             # Recharts wrappers
│   │   └── cor-view.tsx        # printable certificate of registration
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config + types
│   │   ├── prisma.ts
│   │   ├── rbac.ts             # requireRole / requireAuth helpers
│   │   ├── enrollment.ts       # enrollment rules engine
│   │   ├── notifications.ts    # notify + email stub
│   │   └── audit.ts
│   └── middleware.ts           # route-level RBAC
├── docs/
│   ├── ERD.md
│   ├── API.md
│   └── DEPLOYMENT.md
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Getting started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or use Docker Compose)

### 2. Configure environment
```bash
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET
openssl rand -base64 32   # for NEXTAUTH_SECRET
```

### 3. Install + migrate + seed
```bash
npm install
npm run db:push       # apply schema
npm run db:seed       # seed demo data
npm run dev
```

Visit http://localhost:3000.

### Docker quick start

```bash
docker compose up -d --build
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

App: http://localhost:3000 · Postgres: `localhost:5432`

---

## Useful commands

```bash
npm run dev          # dev server
npm run build        # production build (runs prisma generate)
npm run start        # start production server
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm run db:push      # sync schema to DB (no migration file)
npm run db:migrate   # create + apply a migration
npm run db:seed      # seed demo data
npm run db:reset     # reset DB and re-seed (destructive)
```

---

## Documentation

- [`docs/ERD.md`](docs/ERD.md) — entity relationship diagram (Mermaid)
- [`docs/API.md`](docs/API.md) — REST API reference
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment runbook (Docker, Vercel, bare metal)

---

## Roadmap / extension points
- Replace email stub in `src/lib/notifications.ts` with Nodemailer / Resend / SES
- Swap polled notifications for WebSocket/SSE if real-time push is required
- Add file upload module (avatar, course materials) — schema supports `avatarUrl`; wire up object storage (S3, Vercel Blob)
- Add 2FA for admin / registrar accounts
- Internationalization (next-intl)

---

## License

MIT — see [LICENSE](LICENSE) (or replace with your institution's preferred license).
