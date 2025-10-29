# Landing Page Variants (App)

Updated: 2025-10-02

This page documents the new role-based behavior of the application landing page at `/` within the app (app.kutsum.org).

## Overview

The landing page now renders three variants based on authentication state provided by `useAuth`:

- Anonymous: Users without any profile yet
- Guest/Student: Same variant for both guests and students
- Teacher: Dedicated teacher-facing landing

All variants are implemented in `app/frontend/src/app/page.tsx`.

## Auth contract

Source: `app/frontend/src/components/AuthProvider.tsx`
- `userState`: 'anonymous' | 'guest' | 'student' | 'teacher'
- `userProfile.username` optional string used for greeting
- `isLoading`: boolean for initial auth detection

## UI Variants

1) Anonymous
- Slogan: French baseline kept
- CTA: "Commencer sans compte" → `/login?mode=guest`
- Secondary: "Se connecter / Créer un compte" → `/login?mode=student`
- External links: `kutsum.org` and `docs.kutsum.org`

2) Guest & Student
- Slogan: "Keep Up The Speed, Unleash Mastery !"
- Greeting: "Bonjour {username}, ..."
- Quick links:
  - Rejoindre une activité → `/student/join`
  - Mes activités → `/my-tournaments`
  - Mon profil → `/profile`
  - Documentation → docs.kutsum.org

3) Teacher
- Slogan: "Keep Up The Speed, Unleash Mastery !" (same as students)
- Greeting: "Bonjour {username}, ..."
- Quick links:
  - Créer une activité → `/teacher/games/new`
  - Gérer mes activités → `/teacher/games`
  - (Removed previously listed `/teacher/quiz/use` as it doesn't exist)
  - Contribuer (questions sur GitHub) → repo
- Resources: docs.kutsum.org, kutsum.org

## Notes
- All variants preserve the development warning block used previously.
- No automatic redirect from `/` to other sections to let users choose from the landing.
- TypeScript checks pass for this file at the time of change.


