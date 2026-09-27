#!/usr/bin/env bash
# Puts BIS Learn on the internet on a rented Ubuntu server, at your own domain with HTTPS.
#
#   curl -fsSL https://raw.githubusercontent.com/Jawas-cre/BIS-school/main/scripts/server-setup.sh -o setup.sh
#   sudo bash setup.sh yourdomain.uz
#
# Before running it, point the domain at the server: a DNS "A" record for the domain (and one for
# www, if you want it) with the server's IP address.
#
# What it does: installs Node.js and the Caddy web server (which gets and renews the HTTPS
# certificate), downloads BIS Learn into /opt/bis-learn, asks for the admin's email and password,
# builds the site and runs it as a service that starts with the server and updates itself from
# GitHub like the laptop version. The database is backed up every night to /var/backups/bis-learn.
# Running it again is safe: it keeps your data and only refreshes the settings (e.g. a new domain).
set -euo pipefail

REPO="${BIS_UPDATE_REPO:-Jawas-cre/BIS-school}"
BRANCH="${BIS_UPDATE_BRANCH:-main}"
APP=/opt/bis-learn
APP_USER=bislearn
PORT=3000

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run it with sudo: sudo bash setup.sh yourdomain.uz"
command -v apt-get >/dev/null || fail "This script is for Ubuntu (or Debian) servers."
# The admin password is typed here, so the script needs a real terminal (not curl ... | bash).
[ -t 0 ] || fail "Download the script first, then run it: sudo bash setup.sh yourdomain.uz"

DOMAIN="${1:-}"
[ -n "$DOMAIN" ] || read -rp "Your domain (for example brightfuture.uz): " DOMAIN
DOMAIN="$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]' | sed -E 's#^https?://##; s#/.*$##; s#^www\.##')"
[[ "$DOMAIN" =~ ^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$ ]] || fail "\"$DOMAIN\" doesn't look like a domain, e.g. brightfuture.uz"

say "1/6  Installing Node.js, the Caddy web server and backups…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https sqlite3
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi
if ! command -v caddy >/dev/null; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get install -y -q caddy
fi

# Building the site needs about 2 GB of memory; small servers get a swap file so the build doesn't run out.
if [ "$(swapon --noheadings | wc -l)" -eq 0 ] && [ "$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)" -lt 3500 ]; then
  say "     Adding 2 GB of swap for building…"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

say "2/6  Downloading BIS Learn…"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/$APP_USER --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP"
chown "$APP_USER:$APP_USER" "$APP"
as_app() { (cd "$APP" && sudo -u "$APP_USER" -H env BIS_SERVER=1 PORT=$PORT "$@"); }
if [ ! -f "$APP/package.json" ]; then
  # The same downloader the automatic updates use, so the server knows which version it has.
  curl -fsSL "https://raw.githubusercontent.com/$REPO/$BRANCH/scripts/update.mjs" -o "$APP/.bootstrap-update.mjs"
  chown "$APP_USER:$APP_USER" "$APP/.bootstrap-update.mjs"
  # shellcheck disable=SC2016 # JavaScript, not shell: ${...} is meant for Node.
  as_app node --input-type=module -e '
    const { findUpdate, install } = await import(process.cwd() + "/.bootstrap-update.mjs");
    const update = await findUpdate();
    if (!update) throw new Error("GitHub sent no version");
    install(update);
    console.log(`Downloaded version ${update.short}`);'
  rm -f "$APP/.bootstrap-update.mjs"
else
  echo "Already downloaded — keeping it (it updates itself)."
fi

say "3/6  Admin account, database and build (the first time takes a few minutes)…"
systemctl stop bis-learn 2>/dev/null || true
as_app node scripts/launch.mjs --prepare

say "4/6  Starting BIS Learn as a service…"
cat > /etc/systemd/system/bis-learn.service <<EOF
[Unit]
Description=BIS Learn
After=network-online.target
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP
Environment=BIS_SERVER=1
Environment=PORT=$PORT
ExecStart=$(command -v node) scripts/launch.mjs
Restart=always
RestartSec=10
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now bis-learn

say "5/6  HTTPS for $DOMAIN…"
SERVER_IP="$(curl -4 -fsS --max-time 10 https://api.ipify.org || true)"
resolves_here() { [ -n "$SERVER_IP" ] && getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$SERVER_IP"; }
if resolves_here "www.$DOMAIN"; then WWW=1; else WWW=0; fi
{
  echo "# Written by scripts/server-setup.sh"
  echo "$DOMAIN {"
  echo "	encode zstd gzip"
  echo "	reverse_proxy 127.0.0.1:$PORT"
  echo "}"
  if [ "$WWW" = 1 ]; then
    echo
    echo "www.$DOMAIN {"
    echo "	redir https://$DOMAIN{uri} permanent"
    echo "}"
  fi
} > /etc/caddy/Caddyfile
systemctl reload caddy 2>/dev/null || systemctl restart caddy

say "6/6  Nightly backups of the database…"
mkdir -p /var/backups/bis-learn
cat > /etc/cron.daily/bis-learn-backup <<EOF
#!/bin/sh
# Keeps the last 14 nightly copies of the BIS Learn database.
sqlite3 $APP/prisma/dev.db ".backup /var/backups/bis-learn/bis-learn-\$(date +%F).db"
find /var/backups/bis-learn -name 'bis-learn-*.db' -mtime +14 -delete
EOF
chmod 755 /etc/cron.daily/bis-learn-backup

echo
if resolves_here "$DOMAIN"; then
  say "✓ Done! Open https://$DOMAIN (the first visit can take a minute while the HTTPS certificate is issued)."
else
  say "✓ BIS Learn is running, but $DOMAIN doesn't point to this server (${SERVER_IP:-unknown IP}) yet."
  echo "  Add a DNS \"A\" record for $DOMAIN with the value ${SERVER_IP:-<the server IP>} where you bought the domain."
  echo "  Once it's there (usually minutes, sometimes a few hours), run this script again to finish HTTPS."
fi
[ "$WWW" = 1 ] || echo "  (To also use www.$DOMAIN, add an \"A\" record for www too, then run this script again.)"
echo
echo "  Useful commands:"
echo "    sudo systemctl status bis-learn      is it running?"
echo "    sudo journalctl -u bis-learn -f      what it's doing (updates, errors)"
echo "    sudo systemctl restart bis-learn     restart it"
echo "    cd $APP && sudo -u $APP_USER -H npm run reset-password    forgotten password"
