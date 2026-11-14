/**
 * Drone Hub config — swap these values per client (same pattern as the
 * AXIOM config-driven engine). Nothing in DroneHub.tsx is client-specific.
 */
import type { HubMode } from './droneScene'

export type CommandMode = Exclude<HubMode, 'standby'>

export interface DroneHubConfig {
  brand: string
  unitName: string
  headline: string
  subhead: string
  videoSrc: string
  posterSrc: string
  /** Where every booking CTA goes (e.g. "/book/<slug>" on AXIOM Halo). */
  bookingHref: string
  credentials: string[]
  coords: string
  commands: Record<
    CommandMode,
    {
      label: string
      sub: string
      hotkey: string
      prompt: { title: string; body: string; cta: string }
    }
  >
  diagnosticLog: string[]
  waypoints: Array<{ id: string; name: string; dist: string }>
}

export const DEFAULT_DRONE_HUB_CONFIG: DroneHubConfig = {
  brand: 'AXIOM',
  unitName: 'RAVEN ND-7',
  headline: 'Drone Operations Hub',
  subhead:
    'Thermal inspection, terrain mapping and search support across the Rogue Valley. Every flight is planned, flown and reported by a certified pilot.',
  videoSrc: '/media/drone-loop.mp4',
  posterSrc: '/media/drone-poster.jpg',
  bookingHref: '/book/drone-ops',
  credentials: ['FAA Part 107 certified', 'Fully insured', 'Thermal · Mapping · Inspection', 'Reports in 48 hrs'],
  coords: '42.43°N  123.17°W',
  commands: {
    diagnostic: {
      label: 'Launch Diagnostic',
      sub: 'Pre-flight systems check',
      hotkey: '1',
      prompt: {
        title: 'All systems green.',
        body: 'This unit is cleared for flight. Pick a date and we will run your inspection this week.',
        cta: 'Book a flight',
      },
    },
    thermal: {
      label: 'Thermal Scan',
      sub: 'Radiometric IR overlay',
      hotkey: '2',
      prompt: {
        title: 'Heat loss shows up from the air.',
        body: 'Roofs, solar arrays and electrical panels: we find the hot spots before they become repair bills.',
        cta: 'Book a thermal inspection',
      },
    },
    route: {
      label: 'Deploy Route',
      sub: 'Autonomous survey path',
      hotkey: '3',
      prompt: {
        title: 'Route locked: 5 waypoints, 4.8 km.',
        body: 'We map acreage, timber and job sites with survey-grade imagery, delivered as a ready-to-use map.',
        cta: 'Schedule a survey',
      },
    },
  },
  diagnosticLog: [
    'POWER BUS ........ 24.8V  OK',
    'ESC ARRAY ×4 ..... NOMINAL',
    'IMU / GYRO ....... CALIBRATED',
    'GNSS ............. 14 SATS',
    'GIMBAL · EO/IR ... ONLINE',
    'ALL SYSTEMS GREEN · READY',
  ],
  waypoints: [
    { id: 'WP-01', name: 'Launch pad', dist: '0.0 km' },
    { id: 'WP-02', name: 'Ridge Alpha', dist: '1.2 km' },
    { id: 'WP-03', name: 'Timber line', dist: '2.3 km' },
    { id: 'WP-04', name: 'North face', dist: '3.6 km' },
    { id: 'WP-05', name: 'Return', dist: '4.8 km' },
  ],
}
