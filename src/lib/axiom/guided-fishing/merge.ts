const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `patch` over `base`. Objects merge, arrays and primitives replace.
 * null/undefined in the patch are ignored so a half-filled studio form can
 * never blank out a required field.
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined || patch === null ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (BLOCKED_KEYS.has(key) || value === undefined || value === null) continue;
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : value;
  }
  return out as T;
}

/** Immutable set by dot path: setByPath(cfg, "pricing.tiers.1.price", 695). */
export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  if (keys.some((k) => k === '' || BLOCKED_KEYS.has(k))) return obj;

  const walk = (node: unknown, i: number): unknown => {
    if (i === keys.length) return value;
    const key = keys[i];
    if (Array.isArray(node)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index > node.length) return node;
      const copy = node.slice();
      copy[index] = walk(node[index], i + 1);
      return copy;
    }
    const source = isPlainObject(node) ? node : {};
    return { ...source, [key]: walk(source[key], i + 1) };
  };

  return walk(obj, 0) as T;
}
