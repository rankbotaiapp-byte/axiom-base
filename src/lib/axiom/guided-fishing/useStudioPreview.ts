'use client';

import { useEffect, useState } from 'react';
import { deepMerge, setByPath } from './merge';
import type { GuidedFishingConfig } from './types';

/**
 * >>> AXIOM INTEGRATION POINT 2 of 3 <<<
 * Live-desk / studio preview bridge.
 *
 * The studio loads this page in an iframe (or with ?axiomPreview=1) and
 * drives it with postMessage, so edits show instantly without a save:
 *
 *   studio -> page  { type: 'axiom:studio:config', config: Partial<Config> }   replace overrides
 *   studio -> page  { type: 'axiom:studio:patch',  path: 'business.name', value: 'New Name' }
 *   page -> studio  { type: 'axiom:preview:ready', module, tenantId }
 *   page -> studio  { type: 'axiom:preview:focus-field', path }   (buyer clicked an editable element)
 *
 * Every editable element carries data-axiom-field="<dot.path>", so the studio
 * can jump straight to the matching input.
 *
 * Security: messages are only accepted from origins listed in
 * NEXT_PUBLIC_AXIOM_STUDIO_ORIGINS (comma separated). With none set, only
 * same-origin messages are accepted.
 */
const MODULE_ID = 'guided-fishing';

function allowedOrigins(): string[] {
  const configured = (process.env.NEXT_PUBLIC_AXIOM_STUDIO_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return configured.length ? configured : [window.location.origin];
}

export function useStudioPreview(initial: GuidedFishingConfig) {
  const [config, setConfig] = useState(initial);
  const [isPreview, setIsPreview] = useState(false);

  // New server data (e.g. after a studio save + revalidate) wins over stale preview state.
  useEffect(() => setConfig(initial), [initial]);

  useEffect(() => {
    const framed = window.parent !== window;
    const flagged = new URLSearchParams(window.location.search).has('axiomPreview');
    if (!framed && !flagged) return;

    const origins = allowedOrigins();
    setIsPreview(true);

    const onMessage = (event: MessageEvent) => {
      if (!origins.includes(event.origin)) return;
      const data = event.data as { type?: string; config?: unknown; path?: unknown; value?: unknown } | null;
      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'axiom:studio:config' && data.config && typeof data.config === 'object') {
        setConfig({ ...deepMerge(initial, data.config), tenantId: initial.tenantId });
      } else if (data.type === 'axiom:studio:patch' && typeof data.path === 'string' && data.path !== 'tenantId') {
        const { path, value } = data;
        setConfig((current) => setByPath(current, path, value));
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-axiom-field]');
      if (!target || !framed) return;
      event.preventDefault();
      event.stopPropagation();
      for (const origin of origins) {
        window.parent.postMessage({ type: 'axiom:preview:focus-field', path: target.dataset.axiomField }, origin);
      }
    };

    window.addEventListener('message', onMessage);
    document.addEventListener('click', onClick, true);
    if (framed) {
      for (const origin of origins) {
        window.parent.postMessage({ type: 'axiom:preview:ready', module: MODULE_ID, tenantId: initial.tenantId }, origin);
      }
    }
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('click', onClick, true);
    };
  }, [initial]);

  return { config, isPreview };
}

/** Spread onto any element whose text comes from config: <h1 {...field('hero.headline')}>. */
export const field = (path: string) => ({ 'data-axiom-field': path });
