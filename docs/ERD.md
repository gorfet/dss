# Entity Relationship Diagram

```mermaid
erDiagram
  USER ||--o| STUDENT_PROFILE : "has"
  USER ||--o| FACULTY_PROFILE : "has"
  USER ||--o{ NOTIFICATION : "receives"
  USER ||--o{ AUDIT_LOG : "performs"
  USER ||--o{ ANNOUNCEMENT : "authors"
  USER ||--o{ PASSWORD_RESET_TOKEN : "requests"

  DEPARTMENT ||--o{ COURSE : "offers"
  DEPARTMENT ||--o{ FACULTY_PROFILE : "employs"
  COURSE ||--o{ STUDENT_PROFILE : "enrolls"
  COURSE ||--o{ CURRICULUM_ENTRY : "has"
  SUBJECT ||--o{ CURRICULUM_ENTRY : "appears in"
  SUBJECT ||--o{ SUBJECT_PREREQUISITE : "has prereq"
  SUBJECT ||--o{ SECTION : "delivers"

  SCHOOL_YEAR ||--o{ SEMESTER : "contains"
  SEMESTER ||--o{ SECTION : "schedules"
  SEMESTER ||--o{ ENROLLMENT : "tracks"
  SEMESTER ||--o{ PAYMENT : "assesses"

  SECTION ||--o{ SCHEDULE : "meets"
  SECTION ||--o{ ENROLLMENT : "fills"
  SECTION ||--o{ ATTENDANCE : "records"
  FACULTY_PROFILE ||--o{ SECTION : "teaches"

  STUDENT_PROFILE ||--o{ ENROLLMENT : "submits"
  STUDENT_PROFILE ||--o{ PAYMENT : "owes"
  STUDENT_PROFILE ||--o{ ATTENDANCE : "marks"

  ENROLLMENT ||--o| GRADE : "earns"
  PAYMENT ||--o{ PAYMENT_TRANSACTION : "logs"

  USER {
    string id PK
    string email UK
    string firstName
    string lastName
    enum   role "ADMIN|REGISTRAR|FACULTY|STUDENT"
    enum   status "ACTIVE|PENDING|SUSPENDED"
  }
  STUDENT_PROFILE {
    string id PK
    string userId FK
    string studentNo UK
    string courseId FK
    enum   yearLevel
  }
  FACULTY_PROFILE {
    string id PK
    string userId FK
    string employeeNo UK
    string departmentId FK
  }
  DEPARTMENT {
    string id PK
    string code UK
    string name
  }
  COURSE {
    string id PK
    string code UK
    string name
    int    totalUnits
    string departmentId FK
  }
  SUBJECT {
    string id PK
    string code UK
    string name
    int    units
  }
  SUBJECT_PREREQUISITE {
    string subjectId FK
    string prerequisiteId FK
  }
  CURRICULUM_ENTRY {
    string courseId FK
    string subjectId FK
    int    yearLevel
    int    term
  }
  SCHOOL_YEAR {
    string id PK
    string name UK
    date   startDate
    date   endDate
    bool   isActive
  }
  SEMESTER {
    string id PK
    string schoolYearId FK
    enum   term "FIRST|SECOND|SUMMER"
    bool   isActive
  }
  SECTION {
    string id PK
    string code
    string subjectId FK
    string semesterId FK
    string facultyId FK
    int    capacity
    int    enrolled
  }
  SCHEDULE {
    string id PK
    string sectionId FK
    enum   day
    string startTime
    string endTime
  }
  ENROLLMENT {
    string id PK
    string studentId FK
    string sectionId FK
    string semesterId FK
    enum   status "DRAFT|PENDING|APPROVED|REJECTED|WAITLISTED|WITHDRAWN|COMPLETED"
  }
  GRADE {
    string id PK
    string enrollmentId FK,UK
    float  prelim
    float  midterm
    float  finals
    float  finalGrade
  }
  PAYMENT {
    string id PK
    string studentId FK
    string semesterId FK
    float  totalDue
    float  amountPaid
    enum   status "UNPAID|PARTIAL|PAID|WAIVED"
  }
  PAYMENT_TRANSACTION {
    string id PK
    string paymentId FK
    float  amount
    string method
  }
  ANNOUNCEMENT {
    string id PK
    string title
    string body
    enum   audience
    string authorId FK
  }
  NOTIFICATION {
    string id PK
    string userId FK
    enum   type
    string title
    bool   read
  }
  ATTENDANCE {
    string id PK
    string studentId FK
    string sectionId FK
    date   date
    enum   status
  }
  AUDIT_LOG {
    string id PK
    string userId FK
    string action
    string entity
  }
  PASSWORD_RESET_TOKEN {
    string id PK
    string userId FK
    string token UK
    date   expiresAt
  }
```

## Cardinality summary

- A `User` has at most one `StudentProfile` **or** one `FacultyProfile`, depending on `role`.
- A `Course` is offered by exactly one `Department` and aggregates many `Subjects` through a `CurriculumEntry`.
- A `Subject` may have many prerequisites (`SubjectPrerequisite` is a self-referencing join).
- A `Section` belongs to one `Subject` in one `Semester` and is taught by zero/one `FacultyProfile`. It has many `Schedule` slots and many `Enrollment`s.
- `Enrollment` is the central operational record between `Student` and `Section`, optionally producing one `Grade`.
- `Payment` is one per `(Student, Semester)`; each can accumulate many `PaymentTransaction`s.
- `Attendance` is unique on `(student, section, date)`.
- `AuditLog` references the acting user and a target `entity` / `entityId` for traceability.
