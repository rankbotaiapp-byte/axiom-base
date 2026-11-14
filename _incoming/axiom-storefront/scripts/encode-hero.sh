#!/usr/bin/env bash
# Encodes the master hero clip into web-ready assets.
# Usage: bash scripts/encode-hero.sh path/to/master.mp4 [freezeSeconds]
set -euo pipefail
SRC="${1:?master video path}"
FREEZE="${2:-2.30}"
OUT="public/media"
mkdir -p "$OUT"
# H.264 (universal), faststart for instant playback, no audio (autoplay-safe)
ffmpeg -y -v error -i "$SRC" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -vf "scale=1280:-2" "$OUT/hero-1280.mp4"
ffmpeg -y -v error -i "$SRC" -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -vf "scale=854:-2" "$OUT/hero-854.mp4"
# VP9 for Chrome/Android (smaller)
ffmpeg -y -v error -i "$SRC" -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -vf "scale=1280:-2" "$OUT/hero-1280.webm"
ffmpeg -y -v error -i "$SRC" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -vf "scale=854:-2" "$OUT/hero-854.webm"
# Poster (first frame) and full-res freeze frame for the WebGL orbit
ffmpeg -y -v error -ss 0 -i "$SRC" -frames:v 1 -q:v 3 "$OUT/hero-poster.jpg"
ffmpeg -y -v error -ss "$FREEZE" -i "$SRC" -frames:v 1 -q:v 2 "$OUT/hero-freeze.jpg"
ls -la "$OUT"
