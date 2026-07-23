# Welcome to BudgetBuddy 👋

A personal and group expense tracker: a React Native (Expo) app talking to a
Flask API, with real-time group updates over Socket.IO.

Track personal spending, set monthly limits, get reminders for recurring
subscriptions, and split shared expenses with a group — with balances that
update live on every member's phone.

![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white)

<a href ="https://docs.google.com/document/d/1CAI5PpDt-ZQlI6et1LIvM2t7ppMq_3EUZiu3UqgLrbA/edit?usp=sharing"> Click here for more information </a>

<div align="center">
   <img width="462" height="458" alt="image" src="https://github.com/user-attachments/assets/65177947-3a7e-4929-82e5-d3712407b24f" />
</div>

---

## 📥 Download

**[Download the latest APK from Releases →](https://github.com/tuanduong18/BudgetBuddy/releases/latest)**

Android only. Enable "Install from unknown sources" when prompted — the app is
distributed directly rather than through the Play Store.

No setup required: the app talks to the hosted API, so you only need to sign up
inside it. The backend sleeps when idle, so **the first request after a quiet
period can take around 50 seconds** — it is waking up, not broken.

| | |
| --- | --- |
| Current version | **1.1.0** (Expo SDK 57) |
| API | https://budgetbuddy-api-bc4e.onrender.com |
| API status | [/health](https://budgetbuddy-api-bc4e.onrender.com/health) · [/health/db](https://budgetbuddy-api-bc4e.onrender.com/health/db) |

---

## Deploying (Supabase + Render, free tier)

The stack is split deliberately:

| Piece | Where | Why |
| --- | --- | --- |
| Database | **Supabase** free Postgres | Render's free Postgres is **deleted after 30 days** — this is what took the previous deployment offline. Supabase free projects pause after inactivity but are restorable, not destroyed. |
| API | **Render** free web service (Docker) | Needs a long-lived process for WebSockets and the Postgres `LISTEN` thread. |
| App | **EAS Build** → Android APK | Free, installs directly on a phone, no Play Store account needed. |

### 1. Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string → URI**.
3. Choose the **Session pooler** entry. It looks like:

   ```
   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

> [!IMPORTANT]
> The port must be **5432** (session mode). Two wrong options look almost identical:
> - **Port 6543** (transaction pooler) multiplexes connections, so the `LISTEN`
>   registration is dropped. Everything appears to work, but group expenses stop
>   updating in real time, with no error anywhere.
> - **`db.<ref>.supabase.co`** (direct) is IPv6-only and unreachable from Render.
>
> The app prints a warning at boot if it detects port 6543.

### 2. Deploy the API

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo. It reads [render.yaml](render.yaml)
   and creates the service, generating `JWT_SECRET_KEY` and `SECRET_KEY` for you.
3. Set **`DATABASE_URL`** manually to the session-pooler URI from step 1.
4. Deploy. The container runs `init_db.py` on boot, so tables and triggers are
   created automatically — there is no manual database setup step.

The live deployment is at **https://budgetbuddy-api-bc4e.onrender.com**.

Verify:

```bash
curl https://budgetbuddy-api-bc4e.onrender.com/health      # {"status":"ok"}
curl https://budgetbuddy-api-bc4e.onrender.com/health/db   # {"status":"ok","database":"connected"}
```

If `/health` works but `/health/db` returns 503, `DATABASE_URL` is wrong — the
response body contains the connection error.

Render appends a random suffix when the service name is taken, so your
hostname will not match the `name:` in render.yaml. Whatever it is, it must
also be set as `EXPO_PUBLIC_API_BASE` before building the app.

### 3. Keep it awake

Free tiers idle out in two different ways, and one ping fixes both:

- Render spins the service down after **15 minutes** with no traffic (next
  request then takes ~50s to cold start).
- Supabase pauses the project after a period of **database** inactivity.

Point a free scheduler ([cron-job.org](https://cron-job.org), UptimeRobot) at
**`/health/db`** every 10 minutes. It must be `/health/db`, not `/health` —
only that route opens a database connection, which is what Supabase counts as
activity.

### 4. Get it onto an Android phone

The project runs on **Expo SDK 57**, which is what the current Expo Go from the
Play Store supports, so both routes below work.

**Option A — Expo Go (fastest, nothing to build):**

```bash
cd BudgetBuddy
npm install
npx expo start
```

Install Expo Go from the Play Store and scan the QR code. Your phone and
computer must be on the same network.

**Option B — standalone APK (share with anyone, no Expo Go needed):**

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The `preview` profile emits an **APK** (not an AAB), so the download link EAS
gives you installs straight onto a phone. `EXPO_PUBLIC_API_BASE` is already set
in [BudgetBuddy/eas.json](BudgetBuddy/eas.json) for every profile; Expo inlines
it at build time, so it cannot be changed after the build.

### 5. Cutting a release

1. **Decide whether a rebuild is even needed.** JS-only changes (screens,
   styling, the API URL, business logic) ship over the air in seconds:

   ```bash
   npx eas-cli@latest update --branch preview --message "what changed"
   ```

   A native rebuild is only required when adding or removing a native package,
   upgrading the Expo SDK, or changing `runtimeVersion`.

2. **Bump the version** in [BudgetBuddy/app.json](BudgetBuddy/app.json). Note
   that `runtimeVersion` is a literal string, not the `appVersion` policy, so
   it must be bumped **by hand** whenever the native layer changes. Forgetting
   means EAS serves the new JS bundle to an older incompatible binary, which
   crashes in a way that looks like a JavaScript bug.

3. **Build the APK:**

   ```bash
   cd BudgetBuddy
   npx eas-cli@latest build --platform android --profile preview
   ```

4. **Publish it.** Download the APK from the EAS build page, then create a
   GitHub release, tagging it to match the app version:

   ```bash
   gh release create v1.1.0 ./BudgetBuddy-1.1.0.apk \
     --title "BudgetBuddy 1.1.0" --notes "..."
   ```

   Or upload it through **Releases → Draft a new release** on GitHub. The
   Download link at the top of this file points at `/releases/latest`, so it
   picks up the newest release automatically.

---

## Running locally

### Option 1: Docker (recommended)

Starts Postgres and the API. The Expo dev server runs on your host, because
Metro needs to be reachable from your phone over the LAN.

```bash
docker compose up --build          # terminal 1: database + API on :5000

cd BudgetBuddy                     # terminal 2
cp .env.example .env               # then set EXPO_PUBLIC_API_BASE to your LAN IP
npm install
npx expo start
```

### Option 2: Manual

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env                          # then fill in DATABASE_URL
python init_db.py
python run.py
```

Requires a PostgreSQL instance you can reach. Python 3.11–3.14 are supported.

## Environment variables

- **Backend** — `backend/.env`, see [.env.example](.env.example).
- **Frontend** — `BudgetBuddy/.env`, see [BudgetBuddy/.env.example](BudgetBuddy/.env.example).
  Only `EXPO_PUBLIC_`-prefixed variables reach app code, and they are **inlined
  into the bundle at build time** — never put a secret there.

## Known constraints

- **Single worker.** The API must run with `-w 1`. Socket.IO has no message
  queue configured, and each extra worker would open a duplicate `LISTEN`
  connection. Scaling out requires adding Redis as a Socket.IO message queue.
- **Not serverless-compatible.** The API holds a dedicated Postgres `LISTEN`
  connection in a background thread and serves WebSockets, so it cannot run on
  Vercel, Netlify, or Lambda.
- **`eventlet` is in maintenance mode.** It still works and is pinned to a
  version supporting current Python, but upstream recommends migrating. The
  path is Flask-SocketIO's `gevent` or `threading` async mode — worth doing
  eventually, not required to run.
- **`components/` is unused Expo starter-template code.** None of the seven
  files there is imported by `app/`, and three of them reference `ThemedText` /
  `ThemedView`, which no longer exist — so `npx expo lint` reports errors for
  them. They are not bundled and do not affect the app. Deleting the folder
  would clear the lint errors.

## Dependency updates

[Dependabot](.github/dependabot.yml) is configured for weekly grouped PRs.
Expo-managed packages (`expo*`, `react-native*`, `react`) are **excluded on
purpose**: their versions are pinned by the SDK, and bumping one individually
produces a build that fails to link or crashes at runtime. Upgrade those with:

```bash
cd BudgetBuddy
npx expo install --fix     # aligns every package to the current SDK
npx expo-doctor            # reports remaining mismatches
```
