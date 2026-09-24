# BIS Prep — SAT platform for learning centers

A multi-center Digital SAT preparation platform. Each learning center gets its own private space
(students, groups, branches, teachers, content and brand color) on one shared platform, and every
student gets a complete prep toolkit.

## Features

### For students
- **Dashboard** — greeting with goal, latest score and exam countdown; score trajectory vs. goal;
  accuracy by SAT domain compared with the group; group standing; dream-university fit; practice
  heatmap with streaks; latest announcements.
- **Roadmap** — structured course (lesson notes + optional YouTube/Vimeo video) that unlocks one unit
  at a time; each unit ends with a 5-question quiz (60% to pass). Teachers can unlock units for a group.
- **Question Bank** — filter by section, domain, skill, difficulty and your status (new / correct /
  incorrect / saved); answer with instant feedback, step-by-step explanations, answer eliminator and
  bookmarks. Supports multiple-choice and student-produced (grid-in) answers with math rendering.
- **Mock Tests** — full-length (4 modules + 10-minute break), section and topic tests in a
  Bluebook-style runner: per-module timer, mark for review, question navigator, review page,
  reference sheet, autosave and server-side time limits. Score report with section scores, domain
  breakdown and a full question review.
- **Vocabulary** — spaced-repetition (Leitner) flashcards across platform and center decks.
- **Library** — official practice, books, guides and video courses, filterable and searchable.
- **Top Universities** — interactive map, SAT ranges, acceptance rates, tuition and aid, compared with
  your latest score; set your dream university.
- **What's New** — center and platform announcements.
- **AI Assistant** — streaming SAT tutor powered by Claude that knows the student's goal and weakest
  domains; saved conversations; “Ask AI” from any explanation; daily message limit.
- **Profile** — goal, exam date, dream university, password; streaks and XP.

### For learning centers (admins and teachers) — `/admin`
- Overview: invite code, active students, average scores, score distribution, students who need
  attention, group table, latest results.
- Students: search/filter, per-student analytics (score trend, domain accuracy, roadmap, activity,
  test history), create accounts, move between groups, reset passwords.
- Groups: teacher, branch, schedule, members, and roadmap unlocks per group.
- Content: your own questions, test builder (random picks from the bank by section/skill/difficulty),
  customizable roadmap with video lessons, vocabulary decks, library resources, announcements.
- Staff (teachers / admins), branches, center profile and accent color (applied across the app).

### For the platform owner — `/platform`
Centers overview, universities, and platform-wide announcements.

Features not included by request: support sessions, mentors, duels, question rush, placements,
last dances and competitions.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, `proxy.ts`)
- TypeScript, Tailwind CSS v4
- Prisma ORM (SQLite locally; PostgreSQL recommended in production)
- Cookie sessions signed with `jose`, passwords hashed with `bcryptjs`
- Recharts, Leaflet / OpenStreetMap, react-markdown + KaTeX
- `@anthropic-ai/sdk` for the AI Assistant

## Getting started

```bash
npm install
cp .env.example .env        # then set SESSION_SECRET (and ANTHROPIC_API_KEY for the assistant)
npm run db:push             # create the database schema
npm run db:seed             # platform content + a demo center
npm run dev                 # http://localhost:3000
```

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Student | `student@demo.uz` |
| Teacher | `teacher@demo.uz` |
| Center admin | `admin@demo.uz` (center invite code `DEMO24`) |
| Platform owner | `owner@bisprep.uz` |

New students can register at `/register` with the code `DEMO24`; new centers at `/register/center`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite, or a PostgreSQL URL |
| `SESSION_SECRET` | yes | 32+ random characters used to sign session cookies |
| `ANTHROPIC_API_KEY` | for AI | Enables the AI Assistant |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-opus-5` |
| `AI_DAILY_LIMIT` | no | Messages per student per day (default 60) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Reset and reseed demo data |
| `npm run db:reset` | Drop, recreate and reseed the database |

## Deploying

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` and set a
   PostgreSQL `DATABASE_URL`.
2. Set `SESSION_SECRET` (and `ANTHROPIC_API_KEY` if you use the assistant).
3. `npm run build`, `npx prisma db push`, optionally `npm run db:seed` for the platform content, then
   `npm start` (or deploy to any Node host such as Vercel, Railway or Render).

## Project structure

```
prisma/
  schema.prisma          data model (centers, users, groups, questions, tests, roadmap, …)
  seed/                  platform content: questions (original R&W + generated math), lessons,
                         vocabulary, library, universities, demo center with history
src/
  app/(auth)/            login, student and center registration
  app/onboarding/        goal setup after sign-up
  app/(app)/             student area (dashboard, roadmap, questions, tests, vocabulary, …)
  app/(exam)/            distraction-free test runner
  app/admin/             center admin and teacher panel
  app/platform/          platform owner panel
  app/api/assistant/     streaming AI tutor endpoint
  components/            UI kit, charts, app shell
  lib/                   auth/session, SAT taxonomy and scoring, stats, tests, AI config
  proxy.ts               optimistic auth redirect
```

## Content notes

All seeded questions, passages and lessons are original. Math questions are generated from templates
whose answer keys are computed from the same numbers they print. University figures are approximate
and should be refreshed each admissions cycle from official sources. SAT® is a trademark registered by
the College Board, which is not affiliated with and does not endorse this product.
