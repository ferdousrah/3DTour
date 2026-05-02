#!/usr/bin/env sh
set -e

# Ensure expected directories exist on the persisted volume mount.
mkdir -p \
    storage/app/public/branding \
    storage/app/public/tours \
    storage/app/public/media \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Permissions (volume mount may have come back owned by root)
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rw storage bootstrap/cache 2>/dev/null || true

# Generate APP_KEY only if it's missing — first deploy convenience.
if [ -z "${APP_KEY:-}" ] || [ "${APP_KEY:-}" = "base64:" ]; then
    echo "[entrypoint] APP_KEY not set; generating an ephemeral one (set a real one in Coolify env vars)"
    php artisan key:generate --show > /tmp/key.txt
    export APP_KEY="$(cat /tmp/key.txt)"
fi

# DB migrations (idempotent; --force for non-interactive prod).
echo "[entrypoint] Running migrations…"
php artisan migrate --force --no-interaction

# storage:link is idempotent — recreate the symlink (it lives in the
# image under public/storage and points to storage/app/public).
php artisan storage:link --no-interaction || true

# Cache config / routes / views for production performance. Run AFTER
# env vars are available so the cached config has the real values.
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true

echo "[entrypoint] Boot complete; handing off to: $*"
exec "$@"
