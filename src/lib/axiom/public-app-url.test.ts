import assert from "node:assert/strict";
import test from "node:test";
import { normalizePublicOrigin, resolvePublicAppOrigin } from "./public-app-url.ts";

test("normalizePublicOrigin forces https for bare Vercel hosts", () => {
  assert.equal(normalizePublicOrigin("axiom.example"), "https://axiom.example");
  assert.equal(normalizePublicOrigin("https://axiom.example/path"), "https://axiom.example");
});

test("resolvePublicAppOrigin prefers NEXT_PUBLIC_APP_URL over VERCEL_URL", () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevVercel = process.env.VERCEL_URL;
  const prevNode = process.env.NODE_ENV;
  try {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.axiom.shop";
    process.env.VERCEL_URL = "ignored.vercel.app";
    assert.equal(resolvePublicAppOrigin("http://localhost:8080"), "https://app.axiom.shop");
  } finally {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
    if (prevVercel === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prevVercel;
    process.env.NODE_ENV = prevNode;
  }
});

test("resolvePublicAppOrigin uses HTTPS VERCEL_URL when app URL unset", () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevVite = process.env.VITE_APP_URL;
  const prevRaw = process.env.APP_URL;
  const prevVercel = process.env.VERCEL_URL;
  try {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VITE_APP_URL;
    delete process.env.APP_URL;
    process.env.VERCEL_URL = "canary-axiom.vercel.app";
    assert.equal(resolvePublicAppOrigin(null), "https://canary-axiom.vercel.app");
  } finally {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
    if (prevVite === undefined) delete process.env.VITE_APP_URL;
    else process.env.VITE_APP_URL = prevVite;
    if (prevRaw === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = prevRaw;
    if (prevVercel === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prevVercel;
  }
});
