#!/bin/bash
# AlgoLadder setup: takes the Supabase connection string (or bare password)
# from the clipboard, writes it into .env.local, then migrates and seeds.
set -e
cd "$(dirname "$0")"

CLIP="$(pbpaste | tr -d '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

if [ -z "$CLIP" ] || [ "${#CLIP}" -gt 300 ] || [[ "$CLIP" == *" "* ]]; then
  echo "!! Clipboard does not look right (length ${#CLIP})."
  echo "!! In Supabase, click the copy icon on the Connection string box, then run this again."
  exit 1
fi

CLIP="$CLIP" python3 - <<'PY'
import os, re, sys, urllib.parse

clip = os.environ["CLIP"]
host = "@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
prefix = "postgresql://postgres.bhrviuypjkfimgclpatp:"

if clip.startswith("postgres"):
    m = re.match(r"postgres(?:ql)?://[^:]+:(.*)@", clip)
    if not m:
        sys.exit("!! Could not read a password out of that connection string.")
    pw = m.group(1)
else:
    pw = clip

if "YOUR-PASSWORD" in pw or not pw:
    sys.exit("!! That still has the [YOUR-PASSWORD] placeholder in it.")

if re.fullmatch(r"(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+", pw) is None:
    pw = urllib.parse.quote(pw, safe="")

s = open(".env.local").read()
s = re.sub(r"^DATABASE_URL=.*$", "DATABASE_URL=" + prefix + pw + host, s, flags=re.M)
open(".env.local", "w").write(s)
print("  .env.local updated (password length %d)" % len(pw))
PY

echo ""
echo "==> Creating tables..."
npm run db:migrate
echo ""
echo "==> Loading 474 problems..."
npm run db:seed
echo ""
echo "==> Done. Now run:  npm run dev"
