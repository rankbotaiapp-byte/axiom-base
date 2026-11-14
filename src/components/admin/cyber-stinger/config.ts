/**
 * CyberStinger — page config.
 * Everything a client-specific rebrand would touch lives here, Axiom-style.
 */

export const CYBER_STINGER = {
  brand: 'CyberStinger',
  division: 'Axiom // Security Division',

  media: {
    /** 16:9 loop — desktop / landscape */
    loop: '/media/cyber-stinger-loop.mp4',
    poster: '/media/cyber-stinger-poster.jpg',
    /** 3:4 loop — phones held upright */
    portraitLoop: '/media/cyber-stinger-portrait.mp4',
    portraitPoster: '/media/cyber-stinger-portrait-poster.jpg',
    /** When to switch to the portrait cut */
    portraitQuery: '(orientation: portrait) and (max-width: 900px)',
  },

  /** Lead capture. Swap for your own form / Supabase server fn per client. */
  leadEndpoint: 'https://formspree.io/f/xykrkdky',

  /** Shown as a tag on the telemetry panel so a prospect never mistakes demo data for a live feed. */
  telemetryLabel: 'Demo feed',
} as const

export const INTENTS = ['demo', 'deploy', 'contact'] as const
export type Intent = (typeof INTENTS)[number]

export const INTENT_COPY: Record<
  Intent,
  { cta: string; title: string; blurb: string; submit: string }
> = {
  demo: {
    cta: 'Request Fleet Demo',
    title: 'Request a fleet demo',
    blurb:
      'A live walkthrough of the CyberStinger swarm on a perimeter like yours. 30 minutes, no slides.',
    submit: 'Request demo',
  },
  deploy: {
    cta: 'Deploy Autonomous Protocol',
    title: 'Scope a deployment',
    blurb:
      'Tell us about the site. We will map coverage, node count and charging pads, then send a deployment plan.',
    submit: 'Start scoping',
  },
  contact: {
    cta: 'Contact Security Operations',
    title: 'Contact security operations',
    blurb: 'Questions about an existing fleet, integrations or compliance. A human replies.',
    submit: 'Send message',
  },
}
