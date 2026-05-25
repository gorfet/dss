# API reference

All routes are JSON. Authenticated routes require a NextAuth session cookie (set by signing in via `/api/auth/[...nextauth]`).

> Convention: `?q=` is a free-text search, `?page` & `?pageSize` paginate, mutations return `{ data, ... }` or `{ error }`.

---

## Auth

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `POST` | `/api/auth/register` | public | Student self-registration. Body: `{ firstName, lastName, email, password, studentNo, courseId? }` |
| `POST` | `/api/auth/forgot-password` | public | Creates a reset token, emails (or logs) the link |
| `POST` | `/api/auth/reset-password` | public | Body: `{ token, password }` |
| `*`    | `/api/auth/[...nextauth]` | public | NextAuth endpoint (credentials sign-in / sign-out) |

## Users

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/users` | ADMIN, REGISTRAR | Filters: `q`, `role`, `status`, `page`, `pageSize` |
| `POST` | `/api/users` | ADMIN | Body: `{ email, password, firstName, lastName, role, studentNo?, courseId?, employeeNo?, departmentId? }` |
| `PATCH`| `/api/users/:id` | ADMIN, REGISTRAR | Body: `{ firstName?, lastName?, status?, phone?, address? }` |
| `DELETE`| `/api/users/:id` | ADMIN | |
| `PATCH`| `/api/profile` | any | Edits own profile (incl. password) |

## Departments / Courses / Subjects

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/departments` | any | |
| `POST` | `/api/departments` | ADMIN | `{ code, name, description? }` |
| `PATCH`| `/api/departments/:id` | ADMIN | |
| `DELETE`| `/api/departments/:id` | ADMIN | |
| `GET`  | `/api/courses` | any | |
| `POST` | `/api/courses` | ADMIN | `{ code, name, departmentId, totalUnits? }` |
| `GET`  | `/api/subjects?q=` | any | Includes prerequisites |
| `POST` | `/api/subjects` | ADMIN | `{ code, name, units?, lectureHours?, labHours?, prerequisiteIds? }` |
| `GET`  | `/api/public/courses` | public | Used by registration page |

## Calendar

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/calendar` | any | Lists school years with semesters |
| `POST` | `/api/calendar` | ADMIN | `{ name, startDate, endDate, isActive? }` |
| `POST` | `/api/calendar/semesters` | ADMIN | `{ schoolYearId, term, startDate, endDate, enrollmentStart?, enrollmentEnd?, isActive? }` |

## Sections

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/sections?semesterId=&subjectId=&facultyId=` | any | |
| `POST` | `/api/sections` | ADMIN, REGISTRAR | `{ code, subjectId, semesterId, facultyId?, room?, capacity?, schedules: [{day, startTime, endTime, room?}] }` |
| `PATCH`| `/api/sections/:id` | ADMIN, REGISTRAR | `{ facultyId?, room?, capacity? }` |

## Enrollments

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/enrollments?status=&semesterId=` | any | Role-scoped (students see own, faculty see theirs) |
| `POST` | `/api/enrollments` | STUDENT | `{ sectionId }` — runs prereq/conflict/unit checks |
| `PATCH`| `/api/enrollments/:id` | ADMIN, REGISTRAR | `{ status, notes? }` |
| `DELETE`| `/api/enrollments/:id` | STUDENT (own), ADMIN | Marks WITHDRAWN |

## Grades

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `POST` | `/api/grades` | FACULTY, ADMIN | `{ enrollmentId, prelim?, midterm?, finals?, finalGrade?, remarks? }`. Auto-computes `finalGrade` and triggers notification. |

## Payments

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/payments?semesterId=&status=` | any | Students see own |
| `POST` | `/api/payments` | ADMIN, REGISTRAR | Upsert assessment `{ studentId, semesterId, tuition, miscFees?, discount?, scholarship?, notes? }` |
| `POST` | `/api/payments/:id/transactions` | ADMIN, REGISTRAR | Record payment `{ amount, method?, reference? }` |

## Attendance

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/attendance?sectionId=` | any | |
| `POST` | `/api/attendance` | FACULTY (own section), ADMIN | `{ sectionId, date, entries: [{studentId, status, remarks?}] }` |

## Announcements

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/announcements?audience=` | any | Default returns ALL + role-specific |
| `POST` | `/api/announcements` | ADMIN, REGISTRAR, FACULTY | `{ title, body, audience?, sectionId?, pinned? }`. Fans out notifications. |

## Notifications

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/notifications` | any | Recent 30 |
| `POST` | `/api/notifications/read-all` | any | Marks all unread → read |

## Reports & exports

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/reports?kind=summary\|enrollment-status\|by-course\|by-department\|faculty-workload` | ADMIN, REGISTRAR | Aggregations |
| `GET`  | `/api/reports/export?kind=enrollments\|students\|grades` | ADMIN, REGISTRAR | CSV download |

## Audit

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| `GET`  | `/api/audit?page=&pageSize=&entity=` | ADMIN | |
