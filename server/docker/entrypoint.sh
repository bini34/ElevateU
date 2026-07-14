#!/bin/sh
# Boots the app container: ensures writable runtime directories exist
# (they are gitignored), links public storage, then hands off to
# supervisord (php-fpm + reverb + queue worker).
set -e

cd /var/www/html

mkdir -p storage/framework/cache/data storage/framework/sessions \n         storage/framework/views storage/framework/testing \n         storage/logs bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache || true

if [ ! -e public/storage ]; then
    php artisan storage:link || true
fi

exec supervisord -n -c /etc/supervisor/supervisord.conf
