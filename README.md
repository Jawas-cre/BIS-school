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

### For center admins — admin panel (`/admin`)
- **Overview**: invite code, active students, average test scores, score distribution, students who
  need attention, group table, latest results.
- **Invite codes**: student codes (optionally joining a group) and teacher codes with use limits,
  expiry dates and on/off switches.
- **My account**: name, login email and password.
- **Students**: searchable list filtered by group, with groups, average test score, accuracy, weekly
  activity and streak; per-student analytics (score trend, accuracy by subject, roadmap, activity,
  test history); create accounts, assign to several groups, reset passwords.
- **Groups**: subject, teacher, branch, schedule, members and roadmap unlocks per group.
- **Subjects**: add your own subjects (name, icon, color) and topics on top of the platform subjects.
- **Content**: questions, test builder (random picks from the bank by subject / topic / difficulty),
  per-subject roadmap with video lessons, vocabulary decks, library resources, announcements.
- **Staff** (teachers with their teacher IDs, other admins), branches, center profile and accent color
  (applied across the app), and the software version with its automatic updates.

### For teachers — teacher panel (`/teacher`)
- Every teacher gets a **teacher ID** (`T1001`, `T1002`, …) and can log in with it or with their email.
  It is shown in their panel, on *My account* and to admins on the Staff page.
- **My classes** (overview), **My groups** and **My students**: only the groups they teach and the
  students in them — analytics, members, and unlocking roadmap units for the whole group.
- The center's learning content: questions, tests, roadmap lessons, vocabulary, library and
  announcements.

### For the owner and the platform admin — `/platform`
Centers overview, universities, and platform-wide announcements. The person who installs BIS Learn on
a computer is its **owner**: a center admin who can also open these platform settings.

Platform content (subjects, questions, tests, roadmaps, decks, library) is shared with every center;
anything a center creates is visible only to that center.

### Who can open what

| Area | Student | Teacher | Center admin | Owner (installed the site) | Platform admin |
|---|---|---|---|---|---|
| Student app (`/dashboard`, …) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teacher panel (`/teacher`) — own groups and students, content | — | ✓ | — | — | — |
| Admin panel (`/admin`) — everything in the center | — | — | ✓ | ✓ | — |
| Platform settings (`/platform`) | — | — | — | ✓ | ✓ |

Students who sign up only ever see the student app; opening a panel's address sends them back to
their dashboard. Teachers opening an admin page land in their own panel.

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

### Easiest: double-click

1. Install **Node.js** (the "LTS" version) from [nodejs.org](https://nodejs.org) with the default options.
2. Unzip the whole project folder.
3. Double-click the start file inside it:
   - **Windows:** `START-HERE-Windows.bat`. If Windows shows "Windows protected your PC", click
     **More info → Run anyway**.
   - **macOS:** `START-HERE-Mac.command`. The first time, right-click it, choose **Open**, then **Open**
     again (macOS asks once for files downloaded from the internet).
4. The first time, the window asks for the **admin's email and password** (the password shows as
   `*****`; type it twice), your name and your center's name. That person is the owner: the admin who
   controls everything — center, teachers, students, invite codes and all settings. The learning
   content (subjects, questions, tests, lessons, vocabulary, library, universities) is included.
   To look around a sample center first instead, type `demo` as the email (demo password `password123`).
5. Wait while it prepares everything. The first start installs packages, creates the database and
   builds the site (a few minutes, needs internet). Your browser then opens **http://localhost:3000**
   by itself; log in with the email and password you just chose. Later starts take a few seconds.

Keep the black window open while you use the site; close it (or press `Ctrl + C`) to stop the site.
Double-clicking again while the site is already running just opens the browser. Your data is kept
between starts in `prisma/dev.db`; to start over (and get the questions again), close the site and
delete that file. Forgot the admin password? Open a terminal in the folder and run `npm run reset-password`.

### Automatic updates — no new zip needed

While the start-here window is open, BIS Learn checks GitHub every 5 minutes (and at every start) for a
newer version on the `main` branch of [Jawas-cre/BIS-school](https://github.com/Jawas-cre/BIS-school).
When there is one, it downloads it, rebuilds the site and starts it again — anyone opening the site
meanwhile sees an "updating" page that reloads by itself. Then **refresh the browser** to see the
changes. Nothing to install: it works with the zip copy, without Git.

- Your data stays: the database (`prisma/dev.db`), `.env`, and the start-here files are never replaced.
- If a new version can't be built, the previous one is put back and keeps running.
- *Center settings → Software version* shows the version the computer runs and when it was installed.
- Changes reach the computers once they are **merged into `main`** on GitHub.
- Only people who can merge into `main` on GitHub decide what the computers run.
- To turn updates off, set `BIS_UPDATES="off"` in the `.env` file. A folder made with `git clone` is
  not updated automatically — use `git pull` there.
- Maintainers: build the zip with `npm run zip`; it records the version, so computers only install
  newer ones.

### Accounts, passwords and invite codes
- **The admin chooses their own password** in the start-here window on the first start (or on the
  setup page in the browser), and can change their name, login email and password any time under
  **My account** (bottom of the sidebar). Teachers and the platform admin have the same page; students
  change theirs under **Profile**.
- **Teachers log in with their teacher ID** (e.g. `T1001`) or their email. They get the ID when they
  sign up with a teacher code or when an admin adds them on the Staff page.
- **Invite codes** (admin panel → *Invite codes*, center admins only): create a **student code** —
  optionally tied to a group, so new students join it automatically — or a **teacher code**. Each code
  can have a note, a maximum number of uses and a last valid day, and can be switched off or deleted.
  People open **/register**, enter the code and choose their own password: students go to their
  dashboard, teachers to the teacher panel. The center's general student code (no group, no limit) is
  shown on the same page.
- Admins can still create accounts directly (Students and Staff pages) and set or generate the password.
- Demo codes: `DEMO24` (students), `MATH9A` (students, joins *Mathematics · Grade 9 A*), `TEACH24` (teachers).

### With the terminal

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
| Teachers | `teacher@demo.uz`, `teacher2@demo.uz`, `teacher3@demo.uz` (teacher IDs `T1001`–`T1003`) |
| Center admin | `admin@demo.uz` (center invite code `DEMO24`) |
| Platform admin | `owner@bislearn.uz` |

New students can register at `/register` with the code `DEMO24`; new centers at `/register/center`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite, or a PostgreSQL URL |
| `SESSION_SECRET` | yes | 32+ random characters used to sign session cookies |
| `ANTHROPIC_API_KEY` | for AI | Enables the AI Assistant |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-opus-5` |
| `AI_DAILY_LIMIT` | no | Messages per student per day (default 60) |
| `BIS_UPDATES` | no | `off` stops automatic updates of zip copies (default on) |

## Scripts

| Command | What it does |
|---|---|
| `START-HERE-Windows.bat` / `START-HERE-Mac.command` | Double-click launcher: admin account, install, set up, build, start, open the browser, update automatically |
| `npm run setup` | First-time setup: `.env`, database and demo data |
| `npm run reset-password` | Set a new password for an account (asks for the email or teacher ID) |
| `npm run zip` | Make `bis-learn.zip` for laptops, stamped with its version for the updater |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (Webpack; checked on Windows by `.github/workflows/windows.yml`) / server |
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
  app/admin/             center admin panel (its staff pages are shared with the teacher panel)
  app/teacher/           teacher panel: layout plus re-exports of the shared staff pages
  app/platform/          platform settings (platform admin and the owner)
  app/api/assistant/     streaming AI tutor endpoint
  components/            UI kit, charts, app shell
  lib/                   auth/session, subjects, quiz grading, stats, tests, AI config
  lib/i18n/              English / Uzbek text (messages/*.ts), language cookie, formatters
  proxy.ts               optimistic auth redirect
scripts/
  launch.mjs             the start-here launcher: first-start admin account, build, run, auto-update
  update.mjs             automatic updates from GitHub for zip copies
  owner.mjs              creates the owner account; `npm run reset-password`
  setup.mjs, make-zip.mjs
```

## Content notes

All seeded questions, passages and lessons are original. Math and science questions are generated
from templates whose answer keys are computed from the same numbers they print. University figures
are approximate and should be refreshed each admissions cycle from official sources.
