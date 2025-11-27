# AI Copilot Instructions - School Management Dashboard

## Project Overview

**ThaiLySorngSchool** is a **Next.js 14 full-stack school management system** using:
- **Frontend**: React 18 with TypeScript, TailwindCSS
- **Backend**: Next.js Server Actions (no separate API)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (role-based access via metadata)
- **Deployment**: Docker + Docker Compose

## Architecture Patterns

### Data Flow & State Management

1. **Server Actions** (`src/lib/actions.ts`) - All mutations via "use server" functions
   - Actions return `{ success: boolean; error: boolean; message?: string }`
   - Use `revalidatePath()` to refresh cached pages after mutations
   - Example: `createSubject`, `updateTeacher`, `deleteStudent`

2. **Prisma Queries** (`src/lib/prisma.ts`)
   - Single shared Prisma client instance for all database operations
   - Related data fetching via `include` or `select` in queries
   - Check for dependent data before deletion to prevent orphaned records

3. **Form Validation** (`src/lib/formValidationSchemas.ts`)
   - **Zod schemas** define form contracts and validation rules
   - Type inference: `type StudentSchema = z.infer<typeof studentSchema>`
   - Examples: `studentSchema`, `teacherSchema`, `classSchema`, `examSchema`

### Role-Based Access Control

- **Middleware** (`src/middleware.ts`) enforces routes via `routeAccessMap` in `src/lib/settings.ts`
- Roles: `admin`, `teacher`, `student` (stored in Clerk metadata)
- Routes pattern: `/admin/*`, `/teacher/*`, `/student/*`, and `/list/*` with role restrictions
- **Layout hierarchy**: Root layout wraps with `ClerkProvider`, dashboard layout adds sidebar navigation

### Form & Modal Pattern

1. **FormContainer** (`src/components/FormContainer.tsx`)
   - Server Component that fetches related data needed for forms
   - Passes `relatedData` (teachers, grades, subjects) to FormModal based on table type
   - Different queries per table: subject needs teachers, class needs grades + teachers

2. **FormModal** (`src/components/FormModal.tsx`)
   - Client Component managing modal UI, form submission, and delete actions
   - Dynamic imports for form components to reduce bundle size
   - Maps table types to delete action functions (deleteSubject, deleteTeacher, etc.)
   - Shows toast notifications via `react-toastify`

3. **Individual Forms** (e.g., `StudentForm.tsx`)
   - Use React Hook Form + Zod validation via `zodResolver`
   - Upload images via `next-cloudinary` CldUploadWidget
   - Call server actions via `useFormState()` hook
   - Redirect on success using `useRouter().push()`

### Component Conventions

- **"use client"** for interactive components (forms, modals, charts)
- **Server Components** (default) for page layouts and data fetching
- **Dynamic imports** in `FormModal` for form components to optimize code splitting
- **Table Component** (`Table.tsx`) - Generic, accepts columns config and render function
- **Charts**: Uses `recharts` for visualizations (AttendanceChart, FinanceChart, etc.)

## Database Schema Highlights

**Core Entities**:
- `Student` - Links to Class & Grade, has Attendance & Results
- `Teacher` - Links to Subjects & Lessons, can supervise Classes
- `Class` - Links to Grade, has Supervisor (Teacher), Lessons, Students
- `Lesson` - Links Class + Subject + Teacher, has Exams & Assignments
- `Exam` & `Assignment` - Both produce Results
- `Attendance` - Links Student + Lesson with date & presence
- `Event` & `Announcement` - Scoped to Class

**Cascade Safety**: Delete functions check for dependent records before removal

## Development Workflows

### Setup & Database

```bash
npm install
npm run dev                          # Start dev server on http://localhost:3000
npx prisma migrate dev --name {desc}  # Create migrations after schema changes
npx prisma studio                    # Open DB GUI at http://localhost:5555
```

### Docker

```bash
docker-compose up                   # Postgres + Next.js (sets up migrations)
```

### Key Dependencies

- `@clerk/nextjs` - Auth provider
- `@prisma/client` + `prisma` - ORM
- `react-hook-form` + `@hookform/resolvers` - Form handling
- `zod` - Validation
- `recharts` - Charts
- `react-big-calendar` - Calendar UI
- `next-cloudinary` - Image uploads

## Common Tasks

### Adding a New CRUD Entity

1. Define Prisma model in `schema.prisma` → `npx prisma migrate dev --name add_model`
2. Create Zod schema in `formValidationSchemas.ts`
3. Add server actions in `actions.ts` (create, update, delete)
4. Create form component in `components/forms/{Entity}Form.tsx`
5. Add entry to `deleteActionMap` in `FormModal.tsx`
6. Add form type case in `FormContainer.tsx` for related data fetching
7. Create list page in `app/(dashboard)/list/{entity}/page.tsx`
8. Update `routeAccessMap` in `settings.ts` for access control

### Updating Data Display

- **List pages** fetch data with filters & pagination (ITEM_PER_PAGE = 10 in settings.ts)
- **Revalidate after mutations**: `revalidatePath("/list/{entity}")` in server actions
- **Toast feedback**: Import `toast` from `react-toastify`, call `toast.success()` or `toast.error()`

### Image Handling

- Cloudinary integration via `next-cloudinary` CldUploadWidget
- Remote patterns in `next.config.mjs` allow `res.cloudinary.com` and `images.pexels.com`
- Store image URLs as strings in database

### Authentication & Authorization

- Clerk manages user creation and sign-in (page at `app/[[...sign-in]]/page.tsx`)
- Roles assigned in Clerk dashboard dashboard → User metadata `{ role: "admin" | "teacher" | "student" }`
- Middleware redirects unauthorized access to user's role dashboard

## Code Patterns to Follow

✅ **DO**:
- Use `revalidatePath()` after server action mutations
- Check related records in delete operations
- Return typed action responses for toast handling
- Import Prisma from `@/lib/prisma` (singleton)
- Use Zod validation for all forms

❌ **DON'T**:
- Create multiple Prisma client instances
- Fetch unrelated data in queries (use `select` to minimize)
- Skip delete validation - leads to orphaned records
- Mix server and client concerns - clear separation via "use client"

## File Structure Reference

- `src/lib/actions.ts` - Server actions (mutations)
- `src/lib/data.ts` - Temporary mock data (legacy, being replaced by DB)
- `src/lib/prisma.ts` - Singleton Prisma client
- `src/lib/settings.ts` - Constants (ITEM_PER_PAGE, routeAccessMap)
- `src/middleware.ts` - Role-based route protection
- `src/components/FormContainer.tsx` - Related data fetching (server)
- `src/components/FormModal.tsx` - Modal UI & delete handler (client)
- `src/components/forms/` - Individual form implementations
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration history
