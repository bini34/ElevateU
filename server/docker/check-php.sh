#!/bin/sh
set -eu
cd /var/www/html
find app bootstrap config database routes tests -name '*.php' -print0 | xargs -0 -n 1 php -l
