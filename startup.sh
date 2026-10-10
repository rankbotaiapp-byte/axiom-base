#!/bin/sh
set -eu
cd /workspace
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
# Vite uses strictPort. A second `npm run dev` while 8080 is held dies inside
# vite/dist/node/chunks with EADDRINUSE instead of serving the app.
if node --input-type=module -e "
import net from 'node:net';
const socket = net.connect({ port: 8080, host: '127.0.0.1' });
const done = (code) => { socket.destroy(); process.exit(code); };
socket.setTimeout(800, () => done(1));
socket.once('connect', () => done(0));
socket.once('error', () => done(1));
"; then
  echo "8080 is already in use; not starting a second dev server" >&2
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
