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
- **Assignments** — homework from teachers (a test, a roadmap unit or practice questions on a topic)
  with a due day; it ticks itself off when the student does the work. The menu shows how many are open.
- **Journal** — attendance (present, late, absent, excused) and grades (1–5) from every lesson.
- **Mastery** — Khan Academy–style levels per topic (Not started → Attempted → Familiar → Proficient →
  Mastered) from the latest 10 answers, shown in the Question Bank and as "% mastery" on the dashboard.
- **What's New** — center and platform announcements.
- **AI Assistant** — streaming tutor that knows the student's subjects, goal and weakest topics; saved
  conversations; "Ask AI" from any explanation; daily message limit. Runs on Claude with an API key,
  or free through [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (see *Free AI tutor* below).
- **Profile** — grade, goal, exam date, dream university, password; streaks and XP.

### For center admins — admin panel (`/admin`)
- **Overview**: invite code, active students, average test scores, score distribution, students who
  need attention, group table, latest results.
- **Applications**: free trial lesson requests from the center's website — call back from the list,
  mark each as new, contacted, enrolled or closed, add a note, and create the student's account in one
  click. The menu shows how many new ones are waiting.
- **Website**: edit the center's public website — headline, introduction, phone, Telegram and
  Instagram, courses with prices, student results, questions and answers, and a short introduction
  for each teacher. Branches come from Center settings.
- **Invite codes**: student codes (optionally joining a group) and teacher codes with use limits,
  expiry dates and on/off switches.
- **My account**: name, login email and password.
- **Students**: searchable list filtered by group, with groups, average test score, accuracy, weekly
  activity and streak; per-student analytics (score trend, accuracy by subject, roadmap, activity,
  test history); create accounts, assign to several groups, reset passwords.
- **Groups**: subject, teacher, branch, schedule, members and roadmap unlocks per group; the lesson
  **journal** (attendance and grades for any day), **assignments** with due days and who has done
  them, and the class **mastery** grid (every student × every topic).
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
- For each of their groups: the lesson journal (attendance and grades), assignments with due days, and
  the class mastery grid.
- The center's learning content: questions, tests, roadmap lessons, vocabulary, library and
  announcements.

### For the owner and the platform admin — `/platform`
Centers overview, universities, platform-wide announcements, and the **AI tutor** settings (Claude
with an API key, OmniRoute for free, or off — with a *Test connection* button). The person who
installs BIS Learn on a computer is its **owner**: a center admin who can also open these platform
settings.

### The center's website
Every center has a public website at `/c/<center>` (for the demo: `/c/bright-future`), and on a copy
set up with the start-here file (it has an owner) it is also the **home page**. Visitors need no
account. It shows the headline, the center's numbers (students, teachers, courses, branches), courses
with prices, why study here, teachers with their subjects, student results, branches with map and
phone links, questions and answers, and a **free trial lesson** form — requests land in the admin
panel under *Applications*. It uses the center's accent color, English/Uzbek and light/dark mode.

Platform content (subjects, questions, tests, roadmaps, decks, library) is shared with every center;
anything a center creates is visible only to that center.

### CD IELTS mock (`/mock`)
A separate app for computer-delivered IELTS mock exams, with its own address, look and accounts —
candidates never see BIS Learn menus. Open `/mock` (or `/mock?c=<center>`; on your own copy the
center is picked for you).

- **Candidates** register with their name, phone and a PIN, or the center adds them and hands over a
  6-digit **candidate number** and PIN. They log in with either the number or the phone. After 10
  wrong PINs in 15 minutes the account is locked until the time passes or staff give a new PIN.
- **The exam screen** works like the real computer-delivered test: confirm your details, a sound
  check, then **Listening** (about 30 minutes, the recording plays once, then 2 minutes to check),
  **Reading** (60 minutes, passage and questions side by side, highlight words in the passage) and
  **Writing** (60 minutes, word counter). A timer, question navigator, "Review" flags, text size
  and contrast settings, hide screen and help. Answers save every few seconds; closing the browser
  or a power cut doesn't lose them, and the time keeps running on the server like a real exam.
  When a section's time is up it is handed in automatically.
- **Results** — Listening and Reading are marked at once with the official band tables (Academic
  or General Training). The AI tutor (if one is set up under `/platform/ai`) gives a Writing
  estimate for each criterion; an examiner confirms or changes it, adds the **Speaking** marks after
  the face-to-face interview, and releases the full report. The candidate then sees all four bands,
  the overall band, feedback, and their Listening/Reading answers next to the correct ones (with the
  transcript).
- **Staff area** (`/mock/admin`, also in the admin and teacher menus as *CD IELTS mock*): *Results*
  (to mark / all), *Tests* and *Candidates*. Teachers can mark, edit tests and add candidates;
  deleting tests and candidates is for center admins.
- **Tests** are written in a simple text format with a live preview (*How to write questions* in the
  editor has the full example): `## Questions 1–5` starts a group, `[answer|other answer]` is a gap,
  `? question` with `A. option *` is multiple choice (two `*` = choose TWO), `? statement = TRUE`
  is TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN, `Options:` with `? item = B` is matching. Each
  Listening part takes an uploaded **recording** (MP3, M4A, WAV, …) or a **script** that the
  computer reads aloud in different voices; Writing Task 1 takes a picture of the chart.
  *Add the sample test* adds a complete original Academic test (40 + 40 questions and two Writing
  tasks) whose Listening is read by the computer voice.
- Uploaded recordings and pictures are stored in the `data/` folder next to the database; updates
  keep it, and on a server it is backed up every night with the database.

### CD IELTS Mock on its own — `cd-ielts-mock.zip`
The same CD mock also comes as **its own site**, for a center that only wants the mock (or wants it
apart from BIS Learn): `npm run zip -- --mock` makes `cd-ielts-mock.zip`.

- Unzip it and double-click `START-HERE-CD-Mock-Windows.bat` (or `START-HERE-CD-Mock-Mac.command`).
  The first start asks for the admin's email and password like BIS Learn's, then opens
  **http://localhost:3100**, so it can run next to BIS Learn (port 3000) on the same computer.
- It has its own folder, database, accounts and updates. The home page is the candidate site;
  BIS Learn's pages don't exist there. Staff use **Staff sign-in** (`/mock/staff`, linked at the
  bottom of the candidate page) with their email or teacher ID.
- Its staff area adds **Staff** (admins add examiners and admins) and **Settings** (own account and
  password, the center's name and color, and — for the owner — the AI that estimates Writing).
- It is the BIS Learn program started with `BIS_APP=mock` (kept in its `.env`), so it updates itself
  from the same GitHub branch and gets every improvement to the mock.

### Who can open what

| Area | Student | Teacher | Center admin | Owner (installed the site) | Platform admin |
|---|---|---|---|---|---|
| Center website (`/c/<center>`; `/` on your own copy) — also for visitors without an account | ✓ | ✓ | ✓ | ✓ | ✓ |
| Student app (`/dashboard`, …) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teacher panel (`/teacher`) — own groups and students, content | — | ✓ | — | — | — |
| Admin panel (`/admin`) — everything in the center, including Applications and Website | — | — | ✓ | ✓ | — |
| Platform settings (`/platform`) | — | — | — | ✓ | ✓ |
| CD IELTS mock staff area (`/mock/admin`) — marking, tests, candidates | — | ✓ | ✓ | ✓ | — |

CD mock candidates (`/mock`) have their own accounts and only see their own tests and reports.

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
- `@anthropic-ai/sdk` for the AI Assistant — Claude directly, or any Anthropic-compatible gateway such
  as OmniRoute

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

### Use it on your phone

While the site runs on the computer, phones and tablets on the **same Wi-Fi** can open it too:

1. The start-here window prints the address for phones (for example `http://192.168.1.23:3000`), and
   the admin **Overview** shows it with a **QR code** — point the phone's camera at it.
2. The first time, Windows may ask whether Node.js may use the network: click **Allow access**
   (private networks). If you clicked Cancel, allow it under *Windows Security → Firewall → Allow an
   app through firewall → Node.js*.
3. To use it like an app, add it to the home screen: **iPhone** — Safari → Share → *Add to Home
   Screen* (opens full screen with the BIS Learn icon); **Android** — Chrome → ⋮ → *Add to Home screen*.

The computer has to stay on with the start-here window open. Phones on other networks (mobile data,
students at home) can't reach it — for that the site has to be online; see *Deploying* below.

### Free AI tutor with OmniRoute

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) (MIT license) is a free, open-source AI gateway
that runs on your computer and passes questions on to free AI models. BIS Learn can use it instead of
a paid Claude API key:

1. In a terminal (Windows: `Win + R`, type `cmd`, Enter): `npm install -g omniroute`, then start it
   with `omniroute` and keep that window open. Optionally open **http://localhost:20128**, its
   dashboard, to add more free AI providers.
2. In BIS Learn: *Platform settings → AI tutor* → choose **OmniRoute (free)** → **Save** → **Test
   connection**. The address (`http://localhost:20128`) and the model (`auto`, which lets OmniRoute
   pick a free model) are filled in; add an API key only if you created one in OmniRoute.

Keep OmniRoute running while students use the AI Assistant. With a Claude API key instead, choose
**Claude** on the same page (or put `ANTHROPIC_API_KEY` in `.env`).

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
- **New centers:** on a site set up with the start-here file (it has an owner), `/register/center` is
  closed, so a shared link only lets people in with your invite codes. Set `BIS_CENTER_SIGNUP="on"` in
  `.env` to allow other centers to sign up. An online platform without an owner stays open.
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

CD IELTS mock candidates (`/mock?c=bright-future`, PIN `1234`): `100001` Aziza Karimova and `100002`
Dilshod Yusupov, who has a finished test waiting for marking.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite, or a PostgreSQL URL |
| `SESSION_SECRET` | yes | 32+ random characters used to sign session cookies |
| `ANTHROPIC_API_KEY` | for AI | Enables the AI Assistant with Claude (or set a key or OmniRoute under *Platform settings → AI tutor*) |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-opus-5` |
| `AI_DAILY_LIMIT` | no | Messages per student per day (default 60) |
| `BIS_UPDATES` | no | `off` stops automatic updates of zip copies (default on) |
| `BIS_CENTER_SIGNUP` | no | `on` lets new centers sign up at `/register/center` on a site with an owner (default off) |

## Scripts

| Command | What it does |
|---|---|
| `START-HERE-Windows.bat` / `START-HERE-Mac.command` | Double-click launcher: admin account, install, set up, build, start, open the browser, update automatically |
| `npm run setup` | First-time setup: `.env`, database and demo data |
| `npm run reset-password` | Set a new password for an account (asks for the email or teacher ID) |
| `npm run zip` | Make `bis-learn.zip` for laptops, stamped with its version for the updater |
| `npm run zip -- --mock` | Make `cd-ielts-mock.zip`: the CD IELTS mock as its own site (`START-HERE-CD-Mock-*`, port 3100) |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (Webpack; checked on Windows by `.github/workflows/windows.yml`) / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Reset and reseed demo data |
| `npm run db:reset` | Drop, recreate and reseed the database |

## Deploying

### On your own domain with a small server (recommended)

Everyone — parents, students, teachers — opens the site at your address, from anywhere, with HTTPS.
It costs a domain (about $10–15 a year) and a small server (about $5–7 a month).

1. **Buy a domain**, e.g. `brightfuture.uz` (registrars listed on cctld.uz) or a `.com`
   (Cloudflare Registrar, Namecheap).
2. **Rent a server** with **Ubuntu** and **2 GB of memory** (Hetzner, DigitalOcean or any other).
   You get its IP address and a password.
3. **Point the domain at the server**: in your domain's DNS settings add an `A` record for `@` with
   the server's IP (and one for `www` if you want `www.yourdomain.uz` too).
4. **Log in to the server** (Windows: open *cmd* and type `ssh root@<server IP>`) and run:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/Jawas-cre/BIS-school/main/scripts/server-setup.sh -o setup.sh
   sudo bash setup.sh yourdomain.uz
   ```

   It asks for the admin's email and password, like the start-here file, and takes about ten
   minutes. Then open `https://yourdomain.uz`: the home page is your center's website, and everyone
   logs in from the same address.

The server runs BIS Learn as a service: it starts by itself after a reboot, updates itself from
GitHub like the laptop version, and keeps a copy of the database every night (the last 14, in
`/var/backups/bis-learn`). The site only listens on the server itself; the Caddy web server in front
of it serves your domain and renews the HTTPS certificate. Running the script again is safe (for
example with a new domain): your data stays.

**Moving your laptop's data to the server** (optional, once, before people start using the server):
copy the laptop's `prisma/dev.db` to the server (e.g. with WinSCP), then on the server run
`sudo systemctl stop bis-learn`, put the file at `/opt/bis-learn/prisma/dev.db`, run
`sudo chown bislearn:bislearn /opt/bis-learn/prisma/dev.db` and `sudo systemctl start bis-learn`.
Everyone logs in again with their usual email and password.

Handy commands on the server: `sudo systemctl status bis-learn` (is it running?),
`sudo journalctl -u bis-learn -f` (what it's doing), `sudo systemctl restart bis-learn`.

The free OmniRoute AI tutor runs on the computer that runs BIS Learn, so on a server either install
OmniRoute there too or choose *Claude (API key)* under *Platform settings → AI tutor*.

### Other hosts

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
  app/(app)/             student area (dashboard, assignments, journal, roadmap, questions, tests, …)
  app/c/                 each center's public website and its trial lesson form
  app/mock/              CD IELTS mock: candidate site, exam, reports, and the staff area (admin/)
  app/api/mock/          exam saving and timing, uploads, recordings and pictures
  app/(exam)/            distraction-free test runner
  app/admin/             center admin panel (its staff pages are shared with the teacher panel)
  app/teacher/           teacher panel: layout plus re-exports of the shared staff pages
  app/platform/          platform settings (platform admin and the owner), including the AI tutor
  app/api/assistant/     streaming AI tutor endpoint
  components/            UI kit, charts, app shell
  lib/                   auth/session, subjects, quiz grading, stats, tests, journal, assignments,
                         mastery, website, AI settings
  lib/mock/              CD mock: question format, band scores, AI Writing estimate, sample test
  lib/app-mode.ts        BIS_APP="mock": the program runs as the CD mock site on its own
  lib/i18n/              English / Uzbek text (messages/*.ts), language cookie, formatters
  proxy.ts               optimistic auth redirect
scripts/
  launch.mjs             the start-here launcher: first-start admin account, build, run, auto-update
                         (also the service on an internet server, with BIS_SERVER=1)
  server-setup.sh        puts BIS Learn on a rented Ubuntu server at your domain with HTTPS
  update.mjs             automatic updates from GitHub for zip copies
  owner.mjs              creates the owner account; `npm run reset-password`
  setup.mjs, make-zip.mjs (also the CD mock zip; its start files are in cd-mock/)
```

## Content notes

All seeded questions, passages and lessons are original, and so is the CD IELTS sample test
(passages, recordings' scripts, questions and the Writing chart); it is not taken from any
published IELTS material. Math and science questions are generated
from templates whose answer keys are computed from the same numbers they print. University figures
are approximate and should be refreshed each admissions cycle from official sources.
