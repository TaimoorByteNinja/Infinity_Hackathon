# NovaWorks AI Project Manager — Meeting to Execution

**The Infinity Hack ’26** · Team: **`<YOUR TEAM NAME>`**

A simple project-management CRM for NovaWorks Technologies. The administrator pastes a meeting transcript, and AI creates the projects and tasks automatically: it assigns the supplied managers and developers and sets deadlines and estimated hours. Every user then sees only the work they are allowed to see.

> Simple login → Paste meeting → Create projects & tasks automatically → View saved projects and assigned tasks

| | |
|---|---|
| **Live demo** | `<LIVE LINK>` |
| **Demo video** | `<VIDEO LINK>` |
| **Architecture** | [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend (`frontend/`) | React 19, Vite, TypeScript, Tailwind CSS 4, **shadcn/ui** (preset `b1sAmVzcG`, Base UI), React Router |
| Backend (`backend/`) | Node.js, Express, TypeScript, Prisma ORM, bcrypt, JWT httpOnly-cookie sessions, Zod |
| AI (`ai/`) | Groq (default) or OpenRouter via OpenAI-compatible API · model `openai/gpt-oss-120b` with fallback · strict JSON-schema output |
| Database | PostgreSQL (Neon / Supabase / Aiven / local) |
| Serving | **One port** — Express serves `/api/*` and the frontend |

## Working features

- Simple login/logout using the 10 seeded demo accounts (no signup, reset or verification).
- **Admin:** all project cards, company stats, and **Create from Transcript**.
- **AI transcript conversion:**
  - Applies final decisions (revised dates, estimates and owners).
  - Ignores rejected features and assigns only people from the directory.
  - Validates the whole draft before saving. Unresolved fields are highlighted so the admin can correct them and revalidate.
  - Saves all records in one transaction, so a failure never leaves partial projects.
  - Shows loading, success and error states, and disables the button while processing (the server also rejects double submissions).
  - Optional *Replace existing projects with the same name*, for re-running a modified transcript.
- Projects list, plus a project detail page showing client, manager, deadline, scope and tasks.
- Task rows with title, description, assigned agent, deadline and estimated hours.
- **Manager:** only their projects. **Agent:** *My Tasks* with only their own assignments and related projects.
- **Access rules are enforced in the API**, not only in the UI. Direct requests for someone else's project return **403**.
- Read-only team directory.
- Data is saved in PostgreSQL and survives refreshes and restarts.
- Admin can delete a project (its tasks are deleted with it).

## Setup & run

**Requirements:** Node.js ≥ 20.11 and a PostgreSQL database.

```bash
# 1. Install all workspaces
npm install

# 2. Configure environment
cp .env.example .env        # then fill DATABASE_URL, AI_API_KEY, SESSION_SECRET

# 3. Database: generate client, apply migrations, seed the 10 demo users (safe to re-run)
npm run setup

# 4a. Development — API + frontend with hot reload on ONE port
npm run dev                 # http://localhost:3000

# 4b. Production
npm run build
NODE_ENV=production npm start   # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run setup` | `db:generate` + `db:migrate` + `db:seed` |
| `npm run db:migrate` | Apply Prisma migrations (`prisma migrate deploy`) |
| `npm run db:seed` | Upsert the 10 demo users by email (re-running never duplicates) |
| `npm run db:reset` | Drop all data, re-migrate, re-seed |
| `npm run typecheck` | Type-check `ai`, `backend` and `frontend` |

### Database options

- **Neon / Aiven / local PostgreSQL:** set `DATABASE_URL` and run `npm run setup`.
- **Supabase:** either
  - use Supabase's connection string as `DATABASE_URL` and run `npm run setup` (recommended), **or**
  - run `supabase db push` with [`supabase/migrations/20261117000000_init.sql`](supabase/migrations/20261117000000_init.sql), then load [`supabase/seed.sql`](supabase/seed.sql). After that, run `npx prisma migrate resolve --applied 20261117000000_init` in `backend/` so Prisma knows the schema already exists. The Supabase migration enables row-level security, so Supabase's public REST keys can't read the tables.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AI_PROVIDER` | | `groq` (default) or `openrouter` |
| `AI_API_KEY` | ✅ | Groq or OpenRouter API key |
| `AI_MODEL` | | Primary model (default `openai/gpt-oss-120b`) |
| `AI_FALLBACK_MODELS` | | Comma-separated fallbacks (default `openai/gpt-oss-20b`) |
| `AI_BASE_URL` | | Override the provider URL |
| `SESSION_SECRET` | ✅ prod | Long random string that signs the session cookie |
| `PORT` | | Single port for API + frontend (default `3000`) |
| `NODE_ENV` | | `development` or `production` |

Real keys go only in `.env`, which git ignores. See [`.env.example`](.env.example).

## Demo accounts

Password for every account: **`Demo123!`**

| Ref | Name | Email | Role |
|---|---|---|---|
| ADMIN | Admin | admin@novaworks.example | Administrator |
| PM01 | Ayesha Khan | ayesha@novaworks.example | Manager · Web PM |
| PM02 | Bilal Ahmed | bilal@novaworks.example | Manager · Mobile PM |
| PM03 | Hina Malik | hina@novaworks.example | Manager · AI PM |
| DEV01 | Ali Raza | ali@novaworks.example | Agent · Full-Stack |
| DEV02 | Hamza Shah | hamza@novaworks.example | Agent · Full-Stack |
| DEV03 | Sara Noor | sara@novaworks.example | Agent · App Developer |
| DEV04 | Usman Tariq | usman@novaworks.example | Agent · App Developer |
| DEV05 | Zain Abbas | zain@novaworks.example | Agent · AI Developer |
| DEV06 | Maryam Asif | maryam@novaworks.example | Agent · AI Developer |

## Transcript testing steps

1. Run `npm run db:seed`. It shows that the 10 accounts already exist; nobody signs up.
2. Log in as **admin@novaworks.example**, then go to **Create from Transcript** and **Load supplied meeting transcript**.
3. Click **Create from Transcript**. You should get **3 projects and 12 tasks**:

| Project | Manager | Deadline | Tasks | Hours |
|---|---|---|---|---|
| UrbanCart Website | Ayesha | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina | 2026-10-22 | 4 | 38 |

4. Open a project to see the client, manager, deadline and tasks with estimated hours.
5. Log in as **ayesha@**: you see only UrbanCart. Log in as **ali@**: you see only his 3 tasks and UrbanCart. Opening `/api/projects/<QuickServe id>` as Ali returns 403.
6. Log in as **hamza@**: you see 2 tasks, across UrbanCart and QuickServe.
7. Refresh. The data is still there.
8. **Changed-input test:** in the transcript, change QuickServe integration's final estimate to **12 hours** and the deadline to **23 October**. Tick *Replace existing projects with the same name* and convert again. Only that task changes, and QuickServe becomes 48 h.

**Correct handling of the transcript's traps (verified):**
- UrbanCart's deadline is 20 Oct, not 18.
- UrbanCart integration is due 19 Oct, not 17.
- QuickServe integration is 10 h, not 8.
- HelpDeskPro testing goes to Maryam, not Zain.
- Kamran is never added.
- No payment, inventory, maps or email tasks.

## API

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` · `/api/auth/logout` | public |
| GET | `/api/auth/me` | logged in |
| GET | `/api/users` | logged in (directory; no passwords) |
| GET | `/api/projects` · `/api/projects/:id` | scoped by role |
| DELETE | `/api/projects/:id` | admin |
| GET | `/api/tasks` | scoped by role |
| POST | `/api/transcripts` | admin: AI, then validate, then save, or **422** with issues |
| POST | `/api/transcripts/confirm` | admin: revalidate a corrected draft, then save |

## Deployment

The app runs as **one long-lived Node service** (API + frontend on one port), so it deploys to any Node host. The included [`render.yaml`](render.yaml) handles Render:

1. Create a hosted PostgreSQL database (Neon, Supabase or Aiven) and copy its connection string.
2. On Render: **New → Blueprint**, then pick this repository. Set `DATABASE_URL` and `AI_API_KEY`.
3. Build: `npm ci --include=dev && npm run build`. Start: `npm run db:migrate && npm run db:seed && npm start`.
4. Frontend, backend and database migrations all deploy as that one service, and the database is hosted separately.

| | |
|---|---|
| Deployment platform | `<Render / Railway / …>` |
| Database provider | `<Neon / Supabase / Aiven>` |

## Known limitations

- Editing saved projects or tasks is not implemented (it's optional). You can correct the AI draft before saving, and delete a project.
- Free AI tiers are rate-limited. The app waits and retries for short limits, but many conversions in a row may need a minute's pause.
- AI output can vary between runs. Strict schema output and validation catch structural errors. Wrong values the model gives with confidence are possible, and they show up in the review screens.
- No cost calculation, progress monitoring or user management, all out of scope by design.
