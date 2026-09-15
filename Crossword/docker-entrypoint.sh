#!/bin/sh
set -e

# Named volumes often mount as root; SQLite must be writable by the app user.
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

exec gosu nextjs "$@"
