# Deploying GVPS

Two pieces, two hosts:

| Piece                | Where  | Address people use                         |
| -------------------- | ------ | ------------------------------------------ |
| `apps/web` (Next.js) | Vercel | the school's site and the staff app        |
| `apps/api` (NestJS)  | Render | not visited directly; the web app calls it |

The database is the same Neon project used in development, already migrated.
If you ever want a separate production database, see **A separate database**
at the end — do that before the first sign-in, not after.

---

## 1. The API on Render

New → **Web Service** → connect this GitHub repository.

| Setting           | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| Root Directory    | _leave empty_ (the repository root)                      |
| Runtime           | Node                                                     |
| Build Command     | `npm install --include=dev && npm run build -w apps/api` |
| Start Command     | `node apps/api/dist/main`                                |
| Health Check Path | `/health`                                                |

The build installs the whole workspace, generates the Prisma client (the API's
`postinstall` and `build` both run `prisma generate`) and compiles to
`apps/api/dist`.

`--include=dev` is not optional. `NODE_ENV=production` makes npm skip
devDependencies, and the build tools — the Nest CLI, the Prisma CLI, rimraf —
all live there. Without it the build fails with `rimraf: not found`.

### Environment variables

Add these under **Environment**. Copy the two database URLs from your local
`apps/api/.env` — they point at the same Neon database.

| Name                   | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`         | the pooled Neon string, ending `?sslmode=require&connect_timeout=15`  |
| `DIRECT_URL`           | same as `DATABASE_URL` for this project                               |
| `JWT_ACCESS_SECRET`    | the same secret as local, or a new one (a new one signs everyone out) |
| `JWT_ACCESS_TTL`       | `15m`                                                                 |
| `JWT_REFRESH_TTL_DAYS` | `30`                                                                  |
| `FRONTEND_ORIGIN`      | your Vercel address, e.g. `https://gvps.vercel.app` (see below)       |
| `NODE_VERSION`         | `22` (only if the build fails on a native module)                     |
| `NODE_ENV`             | `production`                                                          |

`NODE_ENV=production` is what switches the refresh cookies to cross-site mode
(`sameSite: "none"`, `secure`). Without it nobody can stay signed in, because
the web app and the API are on different domains.

`FRONTEND_ORIGIN` takes a comma-separated list, so preview deployments can be
allowed beside the live site:

```
https://gvps.vercel.app,https://gvps-git-main-yourname.vercel.app
```

Do **not** set `PORT`; Render sets it, and the API already reads it.

### After the first deploy

Open `https://<your-service>.onrender.com/health` — it should answer. Keep that
address; the web app needs it next.

---

## 2. The web app on Vercel

| Setting          | Value           |
| ---------------- | --------------- |
| Root Directory   | `apps/web`      |
| Framework Preset | Next.js         |
| Build Command    | (leave default) |
| Output Directory | **empty**       |

One environment variable, for Production and Preview:

```
NEXT_PUBLIC_API_URL = https://<your-service>.onrender.com
```

It is read when the site is built, so **redeploy after changing it**.

Then put that Vercel address into the API's `FRONTEND_ORIGIN` on Render and let
the API redeploy. The two must know each other, or the browser blocks every
request.

---

## 3. Check it works, in order

1. `https://<api>.onrender.com/health` answers.
2. The landing page opens on the Vercel address.
3. Sign in as superadmin. If sign-in returns you to the sign-in page, the
   cookie settings are the cause: check `NODE_ENV=production` and
   `FRONTEND_ORIGIN` on Render.
4. The Enquiries page loads, and an enquiry sent from the landing page appears
   in it.
5. Open the family portal at `/portal/login` with a parent's phone number.

---

## Things worth knowing

**Render's free instances sleep.** After about 15 minutes idle the service
stops, and the next request waits roughly a minute while it starts. The school
will see a slow first sign-in each morning. The cheapest paid instance removes
this.

**The enquiry spam limit is per instance.** It counts submissions in memory, so
it resets on restart, and two instances count separately. Fine for one small
instance; revisit if the API is ever scaled out.

**Photos on the landing page** are read from `apps/web/public/images` while the
site is built, so adding a photo needs a redeploy before it appears.

**Migrations.** The Neon database already has every migration. When you add one
later, apply it from your machine before deploying the code that needs it:

```
npm run migrate:deploy -w apps/api
```

**A separate database.** If you want production data kept apart from
development, create a second Neon database, put its URLs in Render, then run
from your machine with those URLs in `apps/api/.env`:

```
npm run migrate:deploy -w apps/api   # create the tables
npm run db:seed -w apps/api          # school + first superadmin
npm run db:seed:academic -w apps/api # classes, session, terms
```

The superadmin's email and password come from `INITIAL_SUPERADMIN_EMAIL` and
`INITIAL_SUPERADMIN_PASSWORD`. Change that password at first sign-in.
