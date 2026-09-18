#!/bin/sh
set -eu
cd /var/www/html

if [ "${APP_ENV:-}" != "testing" ] || [ "${DB_DATABASE:-}" != "elevateu_audit" ]; then
    echo "The integration entrypoint requires the isolated elevateu_audit database." >&2
    exit 1
fi

mkdir -p storage/framework/cache/data storage/framework/sessions \
    storage/framework/views storage/framework/testing storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
if [ ! -e public/storage ]; then
    php artisan storage:link
fi
php artisan migrate --force --no-interaction
if [ ! -f storage/oauth-private.key ]; then
    php artisan passport:keys --no-interaction
fi
# MySQL uses tmpfs and may have restarted while the key volume survived.
php artisan passport:client --personal --name="ElevateU integration tests" --no-interaction
chown -R www-data:www-data storage bootstrap/cache
exec supervisord -n -c /etc/supervisor/supervisord.conf
