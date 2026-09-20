#!/bin/sh
# Execute inside the disposable MySQL source container, not the PHP container.
set -eu
umask 077
[ "${ELEVATEU_REHEARSAL:-}" = 1 ] && [ "${MYSQL_DATABASE:-}" = elevateu_audit ] || {
    echo 'This helper only backs up the explicitly enabled synthetic audit database.' >&2
    exit 1
}
export MYSQL_PWD="${MYSQL_ROOT_PASSWORD:?Test database password required}"
backup=/tmp/elevateu-audit.sql
partial=/tmp/elevateu-audit.sql.partial
[ ! -e "$backup" ] && [ ! -e "$partial" ] || {
    echo 'Backup already exists; use a fresh disposable source container.' >&2
    exit 1
}
nontransactional=$(mysql -uroot -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='elevateu_audit' AND table_type='BASE TABLE' AND engine <> 'InnoDB'")
[ "$nontransactional" = 0 ] || { echo 'Non-InnoDB tables require a different consistency plan.' >&2; exit 1; }
trap 'rm -f /tmp/elevateu-audit.sql.partial' EXIT HUP INT TERM
mysqldump -uroot --single-transaction --quick --routines --triggers --events \
    --hex-blob --default-character-set=utf8mb4 --no-tablespaces --set-gtid-purged=OFF \
    --databases elevateu_audit > "$partial"
[ -s "$partial" ] || { echo 'Empty backup rejected.' >&2; exit 1; }
mv "$partial" "$backup"
sha256sum "$backup"
