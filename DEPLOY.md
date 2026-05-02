# Deploying to Coolify

This app ships with everything Coolify needs: `Dockerfile`, `.dockerignore`,
`docker/Caddyfile`, `docker/entrypoint.sh`. The build is **multi-stage**
(Composer → Vite → FrankenPHP) and runs as a single container per replica.

## 1. Push the code

```bash
git remote add origin git@github.com:<you>/3d-tour-platform.git
git push -u origin main
```

Coolify can pull from GitHub / GitLab / a self-hosted Git server, or take a
zip upload.

## 2. Provision a MySQL service in Coolify

In your Coolify project: **+ New Resource → Databases → MySQL 8**.

Coolify will give you (and inject as env vars on linked apps) something like:

| Var                | Source                                |
|--------------------|---------------------------------------|
| `MYSQL_DATABASE`   | DB name (set this — e.g. `tour_3d`)   |
| `MYSQL_USER`       | DB user                               |
| `MYSQL_PASSWORD`   | DB user password                      |
| `MYSQL_HOST`       | internal hostname (e.g. `mysql-xxx`)  |

Note the host — you'll plug it into `DB_HOST` below.

## 3. Create the application

**+ New Resource → Application → Public Repository** (or your private repo).

- **Build pack**: `Dockerfile`
- **Dockerfile location**: `Dockerfile` (root)
- **Branch**: `main`
- **Port exposed**: `8000`
- **Healthcheck**: `GET /up` (Laravel 11 ships this)

## 4. Environment variables

In the application's **Environment Variables** tab, set these (the ones marked
**req** must be set):

```ini
# Application
APP_NAME="3D Tour Platform"
APP_ENV=production                    # req
APP_DEBUG=false                       # req
APP_URL=https://tours.example.com     # req — your real public HTTPS URL
APP_KEY=base64:GENERATE_THIS          # req — see step 5
APP_TIMEZONE=UTC

# Database — point at the MySQL service Coolify provisioned
DB_CONNECTION=mysql                   # req
DB_HOST=mysql-xxxxx                   # req — the internal host from step 2
DB_PORT=3306
DB_DATABASE=tour_3d                   # req
DB_USERNAME=tour_user                 # req
DB_PASSWORD=…                         # req

# Sessions / cache / queue (DB-backed; no Redis required)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true            # because Coolify gives you HTTPS
CACHE_STORE=database
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=log

# Storage — keep on local disk; mount a Coolify volume (step 6)
FILESYSTEM_DISK=public

# Logs go to stderr so Coolify captures them in its log tab
LOG_CHANNEL=stderr
LOG_LEVEL=info

# Mail — replace with your real SMTP provider
MAIL_MAILER=smtp
MAIL_HOST=smtp.postmarkapp.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"

# Analytics IP-hash salt — REQUIRED per FR-100 (long random string)
ANALYTICS_IP_HASH_SALT=               # req — see step 5
TOUR_VIEW_COOLDOWN_SECONDS=1800

# Optional — enables the editor's ✨ Suggest button (Gemini AI proposes
# waypoints + hotspots from the model's mesh names). Free tier is generous
# (1500 req/day on gemini-2.5-flash). Leave blank to hide the feature.
# Get a key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=

# Tour limits (Application-level cap; PHP ini already allows 600 MB)
TOUR_MODEL_MAX_SIZE=524288000         # 500 MB
TOUR_PUBLIC_SLUG_LENGTH=8
SLUG_REDIRECT_DAYS=30
```

## 5. Generate APP_KEY and ANALYTICS_IP_HASH_SALT

Locally (or via Coolify's **Run command** terminal once the container is up):

```bash
php artisan key:generate --show          # copy into APP_KEY
openssl rand -hex 32                     # copy into ANALYTICS_IP_HASH_SALT
```

## 6. Persistent volume for uploaded files

Uploaded GLB models and media library files live under
`storage/app/public/`. Without a volume, redeploys would wipe them.

In Coolify's app settings → **Persistent Storage → Add Volume Mount**:

| Field            | Value                              |
|------------------|------------------------------------|
| Name             | `Public storage` (any label)       |
| Source Path      | `/data/3dtour/storage_public`      |
| Destination Path | `/app/storage/app/public`          |

Coolify uses **bind mounts** here — the Source Path must be an absolute path
on the VPS host (starts with `/`, no spaces). Coolify auto-creates the host
directory on first deploy.

**Permissions gotcha:** if uploads fail with "Permission denied" after the
first deploy, the host dir was created as `root:root`. SSH in and fix:

```bash
sudo chown -R 33:33 /data/3dtour/storage_public   # uid 33 = www-data
```

That keeps user-uploaded GLBs (which can run hundreds of MB each) outside the
container layer.

## 7. Deploy

Click **Deploy**. Coolify will:

1. Clone the repo
2. Build the Dockerfile (≈3–5 min first time; cached layers after)
3. Start the container
4. The entrypoint runs `migrate --force`, `storage:link`, and caches
   config/routes/views before FrankenPHP starts serving on `:8000`
5. Coolify routes HTTPS traffic to `:8000` via Traefik

Watch the **Logs** tab for the `[entrypoint]` lines — should end with
`Boot complete; handing off to:`. If `migrate` fails, check `DB_HOST`.

## 8. Bootstrap the first admin

Once the app is up, open Coolify's **Terminal** for the application and run:

```bash
php artisan db:seed --class=DatabaseSeeder --force
```

That creates `admin@local.test` / `ChangeMe!2026`. Log in, go to
**Profile**, change the password immediately. Then go to **Users** to invite
your real team and remove the default admin.

## 9. Custom domain + HTTPS

In Coolify's app **Domains**, add `tours.example.com`. Coolify provisions
TLS via Let's Encrypt automatically (DNS A record pointing at the VPS must
already be in place).

Update `APP_URL` env var to match (`https://tours.example.com`) and redeploy
so the Inertia / queue / OG meta URLs all line up.

## 10. Migrating data from your local XAMPP DB (optional)

If you want to keep the demo tours / hotspots / waypoints / sample uploads
you've been editing locally, dump and load:

```bash
# On your dev box (Windows / XAMPP):
F:\xampp\mysql\bin\mysqldump.exe -u root tour_3d > tour_3d.sql

# Copy that file to the VPS, then in the Coolify MySQL terminal:
mysql -u tour_user -p tour_3d < tour_3d.sql
```

For the uploaded GLB files in `storage/app/public/tours/`, scp those to the
VPS volume mount path Coolify shows you, e.g.:

```bash
scp -r storage/app/public/tours/* root@vps:/data/coolify/applications/<app-id>/storage/tours/
```

## Sanity checklist after first deploy

- [ ] `https://tours.example.com/` redirects to `/login`
- [ ] Login works with the seeded admin
- [ ] `/admin/tours` lists the seeded tours
- [ ] Upload a fresh GLB → shows the model in the editor
- [ ] Open a tour publicly → 3D model renders
- [ ] Browser DevTools → Network → no mixed-content (http://) requests
- [ ] `https://tours.example.com/up` returns 200

## Updating

`git push origin main` → Coolify auto-deploys (if you enabled webhook deploys)
or click **Deploy** manually. The build cache makes subsequent deploys fast
(~30 s) unless you change `composer.lock` or `package-lock.json`.

Migrations run automatically on every deploy via the entrypoint, so adding
new migrations is "git push, done."
