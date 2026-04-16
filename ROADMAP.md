# Yoom AI — Remaining Features Roadmap

## ✅ 1. Notification System
When a lecturer goes live, all students in the same university and department receive an instant in-app notification so they never miss a live lecture.

**Implemented:**
- `notifications` table in Supabase (see SETUP.md and SUPABASE_SCHEMA.sql)
- `inngest/notify-lecture-live.ts` — background job that fans out notifications to all students in the same university/department when a lecture goes live
- `hooks/useNotifications.ts` — real-time hook using Supabase live subscription
- `components/NotificationBell.tsx` — bell icon with unread badge and dropdown in the Navbar
- `app/api/notifications/route.ts` — GET (list) and PATCH (mark read) endpoints
- Instant meetings now pass `is_live: true` to `/api/lectures` to trigger the event

---

## ✅ 2. Student Attendance Reports
A dedicated page for lecturers to view who attended each of their lectures — showing student names, join time, leave time, and total duration present. Exportable as CSV.

**Implemented:**
- `app/api/attendance/report/route.ts` — fetches attendance records enriched with student names from `platform_users`
- `app/(root)/(home)/attendance/[lectureId]/page.tsx` — full attendance report page with table and Export CSV button

---

## ✅ 3. Course Enrollment
Adds an explicit "Enroll" button so students choose which courses they follow, and lecturers can see their enrolled student list.

**Implemented:**
- `course_enrollments` table in Supabase (see SETUP.md and SUPABASE_SCHEMA.sql)
- `app/api/enrollments/route.ts` — GET (check enrollment / list students), POST (enroll), DELETE (unenroll)
- `components/courses/EnrollButton.tsx` — Enroll/Leave toggle shown on course cards for students

---

## ✅ 4. Lecture Search
A search bar on the home page and recordings page that lets students and lecturers find past lectures by title, course name, or keyword.

**Implemented:**
- `app/api/lectures/search/route.ts` — full-text search endpoint filtered by university
- `components/LectureSearch.tsx` — debounced search input with live dropdown results
- Added to both the home page and the recordings page

---

## 5. GitHub Push
The project still needs to be pushed to the GitHub repository (https://github.com/Conquer-ai-gif/Grid).
To do this, generate a Classic Personal Access Token at github.com/settings/tokens/new,
tick the "repo" checkbox (full access), then share the token to complete the push.
