#!/bin/sh
set -eu
cd /var/www/html
mkdir -p storage/framework/cache/data storage/framework/sessions \
    storage/framework/views storage/framework/testing storage/logs bootstrap/cache
exec php vendor/bin/phpunit --do-not-cache-result "$@"
