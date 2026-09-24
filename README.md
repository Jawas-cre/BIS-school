# BIS Learn — the learning platform for learning centers

A multi-center learning platform for any subject a learning center teaches — mathematics, languages,
sciences, history, computer science and more. Each center gets its own private space (students,
groups, branches, teachers, subjects, content and brand color) on one shared platform, and every
student gets the same toolkit for every subject they study.

## Features

### For students
- **Dashboard** — greeting with goal, latest test result and exam countdown; "My subjects" with
  roadmap progress and accuracy per subject; test score trend; accuracy by subject compared with
  classmates; groups and schedules; dream university; practice heatmap with streaks; latest news.
- **Roadmap** — a course per subject (lesson notes + optional YouTube/Vimeo video) that unlocks one
  unit at a time; each unit ends with a short quiz (60% to pass). Teachers can unlock units for a group.
- **Question Bank** — filter by subject, topic, difficulty and your status (new / correct / incorrect /
  saved); instant feedback, step-by-step explanations, answer eliminator and bookmarks. Supports
  multiple-choice and typed answers (numbers, fractions or words) with math rendering.
- **Mock Tests** — exams, practice tests and topic quizzes in a distraction-free runner: timed
  sections, mark for review, question navigator, review page, autosave and server-side time limits.
  Results page with percentage score, per-section and per-topic breakdown and a full question review.
- **Vocabulary** — spaced-repetition (Leitner) flashcards: language words, science terms and more.
- **Library** — books, guides, courses and videos tagged by subject; filter by type and search.
- **Top Universities** — interactive map with requirements, acceptance rates, tuition and aid; set
  your dream university.
- **What's New** — center and platform announcements.
- **AI Assistant** — streaming tutor powered by Claude that knows the student's subjects, goal and
  weakest topics; saved conversations; "Ask AI" from any explanation; daily message limit.
- **Profile** — grade, goal, exam date, dream university, password; streaks and XP.

### For learning centers (admins and teachers) — `/admin`
- **Overview**: invite code, active students, average test scores, score distribution, students who
  need attention, group table, latest results.
- **Students**: searchable list filtered by group, with groups, average test score, accuracy, weekly
  activity and streak; per-student analytics (score trend, accuracy by subject, roadmap, activity,
  test history); create accounts, assign to several groups, reset passwords.
- **Groups**: subject, teacher, branch, schedule, members and roadmap unlocks per group.
- **Subjects**: add your own subjects (name, icon, color) and topics on top of the platform subjects.
- **Content**: questions, test builder (random picks from the bank by subject / topic / difficulty),
  per-subject roadmap with video lessons, vocabulary decks, library resources, announcements.
- Staff (teachers / admins), branches, center profile and accent color (applied across the app).

### For the platform owner — `/platform`
Centers overview, universities, and platform-wide announcements.

Platform content (subjects, questions, tests, roadmaps, decks, library) is shared with every center;
anything a center creates is visible only to that center.

### Who can open what

| Area | Student | Teacher | Center admin | Platform owner |
|---|---|---|---|---|
| Student app (`/dashboard`, …) | ✓ | ✓ | ✓ | ✓ |
| Center panel (`/admin`) | — | ✓ (except Staff, Center settings, deleting students or groups and resetting passwords) | ✓ | — |
| Platform panel (`/platform`) | — | — | — | ✓ |

Every page and server action checks the role on the server, so hiding a link is never the only protection.

### Everywhere
- **English / Oʻzbekcha** — switch the interface language from the globe menu in the header (also on
  the login and landing pages). The choice is saved per device; first-time visitors get Uzbek when
  their browser prefers it. The AI Assistant answers in Uzbek for students using the Uzbek interface.
  Content your center writes (questions, lessons, news) is shown as written.
- **Light / Dark / Match device** — pick a color mode from the header; "Match device" follows the phone
  or computer setting and switches automatically when it changes.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, `proxy.ts`)
- TypeScript, Tailwind CSS v4
- Prisma ORM (SQLite locally; PostgreSQL recommended in production)
- Cookie sessions signed with `jose`, passwords hashed with `bcryptjs`
- Recharts, Leaflet / OpenStreetMap, react-markdown + KaTeX
- `@anthropic-ai/sdk` for the AI Assistant

## Run it on your laptop

1. Install **Node.js 20 or newer** (the "LTS" version) from [nodejs.org](https://nodejs.org).
2. Unzip the project (or `git clone` it) and open a terminal in the project folder:
   - **Windows:** open the folder in File Explorer, click the address bar, type `cmd` and press Enter.
   - **macOS:** open Terminal, type `cd ` (with a space), drag the folder into the window and press Enter.
3. Run these three commands (the first one needs an internet connection and takes a few minutes):

   ```bash
   npm install
   npm run setup
   npm run dev
   ```

4. Open **http://localhost:3000** in your browser and log in with one of the demo accounts below.

`npm run setup` creates the `.env` file with a random session secret, creates the local SQLite
database and loads the demo data. Running it again keeps your data; `npm run setup -- --reset` wipes
the database and reloads the demo. Stop the app with `Ctrl + C`. To enable the AI Assistant, put your
key in `.env` as `ANTHROPIC_API_KEY="…"` and restart `npm run dev`.

## Getting started (manual)

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
| Student (Mathematics, English, Physics) | `student@demo.uz` |
| Teachers | `teacher@demo.uz`, `teacher2@demo.uz`, `teacher3@demo.uz` |
| Center admin | `admin@demo.uz` (center invite code `DEMO24`) |
| Platform owner | `owner@bislearn.uz` |

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
| `npm run setup` | First-time setup: `.env`, database and demo data |
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
  schema.prisma          data model (centers, users, groups, subjects, questions, tests, roadmap, …)
  seed/                  platform content: subjects and topics, generated questions, lessons,
                         vocabulary, library, universities, demo center with history
src/
  app/(auth)/            login, student and center registration
  app/onboarding/        grade, goal and group setup after sign-up
  app/(app)/             student area (dashboard, roadmap, questions, tests, vocabulary, …)
  app/(exam)/            distraction-free test runner
  app/admin/             center admin and teacher panel
  app/platform/          platform owner panel
  app/api/assistant/     streaming AI tutor endpoint
  components/            UI kit, charts, app shell
  lib/                   auth/session, subjects, quiz grading, stats, tests, AI config
  lib/i18n/              English / Uzbek text (messages/*.ts), language cookie, formatters
  proxy.ts               optimistic auth redirect
```

## Content notes

All seeded questions, passages and lessons are original. Math and science questions are generated
from templates whose answer keys are computed from the same numbers they print. University figures
are approximate and should be refreshed each admissions cycle from official sources.
