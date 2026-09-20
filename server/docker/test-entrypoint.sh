#!/bin/sh
set -eu
cd /var/www/html

if [ "${APP_ENV:-}" != "testing" ] || [ "${DB_DATABASE:-}" != "elevateu_audit" ] || [ "${DB_HOST:-}" != "mysql" ] || [ -n "${DB_URL:-}" ]; then
    echo "The integration entrypoint requires the isolated elevateu_audit database." >&2
    exit 1
fi

mkdir -p storage/framework/cache/data storage/framework/sessions \
    storage/framework/views storage/framework/testing storage/logs bootstrap/cache
touch storage/logs/laravel.log
chown -R www-data:www-data storage bootstrap/cache
if [ ! -e public/storage ]; then
    php artisan storage:link
fi
php artisan migrate --force --no-interaction
if [ ! -f storage/oauth-private.key ]; then
    php artisan passport:keys --no-interaction
fi
# Provision only when absent, including after a tmpfs database restart. A
# restored database must not gain duplicate clients on every application boot.
php docker/ensure-test-client.php
chown -R www-data:www-data storage bootstrap/cache
exec supervisord -n -c /etc/supervisor/supervisord.conf
