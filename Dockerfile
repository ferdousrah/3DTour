# syntax=docker/dockerfile:1.6

# =====================================================================
# Stage 1 — Composer: production PHP dependencies only
# =====================================================================
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader

# =====================================================================
# Stage 2 — Node: Vite build of admin + public viewer assets
# =====================================================================
FROM node:20-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# Vite needs the full app for Ziggy route generation + tsconfig + Pages.
COPY --from=vendor /app/vendor /app/vendor
COPY . .
RUN npm run build

# =====================================================================
# Stage 3 — FrankenPHP runtime (Caddy + PHP, single binary)
# =====================================================================
FROM dunglas/frankenphp:1-php8.3 AS app

# PHP extensions we use:
#   pdo_mysql — DB driver
#   mbstring  — string handling
#   gd        — getimagesize() in MediaController
#   zip       — composer + future model uploads
#   exif/intl/bcmath/pcntl/opcache — Laravel + perf
RUN install-php-extensions \
        pdo_mysql \
        mbstring \
        gd \
        zip \
        exif \
        intl \
        bcmath \
        pcntl \
        opcache

# Composer binary — required for `dump-autoload` once the full app is in
# place so the optimized classmap covers App\* classes too, not just vendor.
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app

# Copy in composer-installed vendor and the Vite build artifacts
COPY --from=vendor /app/vendor /app/vendor
COPY --from=assets /app/public/build /app/public/build

# Copy the rest of the application
COPY . .

# Optimize Composer autoloader after full app is in place (allows the
# package:discover script to run with vendor + app present).
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Permissions for storage and bootstrap caches
RUN mkdir -p storage/framework/{cache,sessions,views} \
            storage/app/public \
            storage/logs \
            bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R ug+rw storage bootstrap/cache

# Caddyfile + entrypoint
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Production PHP ini
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && echo "memory_limit = 512M"            >> "$PHP_INI_DIR/conf.d/zz-app.ini" \
 && echo "post_max_size = 600M"           >> "$PHP_INI_DIR/conf.d/zz-app.ini" \
 && echo "upload_max_filesize = 600M"     >> "$PHP_INI_DIR/conf.d/zz-app.ini" \
 && echo "max_execution_time = 300"       >> "$PHP_INI_DIR/conf.d/zz-app.ini"

EXPOSE 8000

ENTRYPOINT ["entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
