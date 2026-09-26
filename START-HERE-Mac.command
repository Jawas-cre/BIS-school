#!/bin/bash
# Double-click to start BIS Learn on this Mac (first time: right-click the file and choose Open).
cd "$(dirname "$0")" || exit 1

finish() {
  echo
  read -r -p "Press Enter to close this window. "
  exit "$1"
}

echo
echo "  =================================================="
echo "    BIS Learn - starting on this computer"
echo "  =================================================="
echo

if [ ! -f package.json ] || [ ! -f scripts/launch.mjs ]; then
  echo "Could not find the project files next to this file."
  echo "Unzip the whole bis-learn folder first, then double-click START-HERE-Mac.command inside it."
  finish 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed on this computer."
  echo "  1. Go to https://nodejs.org and download the LTS version."
  echo "  2. Install it with the default options."
  echo "  3. Double-click this file again."
  finish 1
fi

if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)"; then
  echo "Your Node.js version is $(node -v), which is too old. Version 20.9 or newer is needed."
  echo "Download the LTS version from https://nodejs.org, install it, then double-click this file again."
  finish 1
fi

node scripts/launch.mjs
code=$?
if [ "$code" -eq 10 ]; then
  echo
  echo "The site was already running, so it was opened in your browser."
  sleep 3
  exit 0
fi
if [ "$code" -eq 0 ]; then
  echo
  echo "The site has stopped."
  finish 0
fi
echo
echo "The site could not start. Read the message above, fix it and double-click this file again."
finish 1
