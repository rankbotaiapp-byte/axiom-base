import type { GuidedFishingConfig } from './types';

/**
 * Default template content: "Rogue River Apex Guides".
 * Tenant overrides are deep-merged on top of this (arrays replace wholesale).
 *
 * NOTE: stats, bio and the license line are PLACEHOLDERS. A buyer must replace
 * them with their own real numbers and registration before going live.
 */
export const defaultGuidedFishingConfig: GuidedFishingConfig = {
  tenantId: 'rogue-river-apex-guides',
  business: {
    name: 'Rogue River Apex Guides',
    tagline: 'Private drift boat trips on the wild Rogue.',
    phone: '(541) 555-0142',
    email: 'trips@example.com',
    locationTags: ['Jackson County', 'Josephine County', 'Rogue River, OR'],
    serviceArea: 'Upper and middle Rogue River, Southern Oregon',
    licenseLine: 'Oregon State Marine Board registered outfitter & guide · Reg. # (add yours) · Fully insured',
  },
  hero: {
    eyebrow: 'Southern Oregon · Guided fly & gear trips',
    headline: 'The river does not hand out second chances. We put you on the first one.',
    subhead:
      'Steelhead, salmon and wild trout from a private drift boat, with a guide who reads this water every day of the season.',
    videoSrc: '/media/studio-references/gemini_generated_video_57642b5a.mp4',
    posterSrc: '/media/studio-references/hero-poster.jpg',
    primaryCta: 'Check dates',
    secondaryCta: 'Call the guide',
  },
  stats: [
    { value: '2', label: 'Anglers per boat, max' },
    { value: '100%', label: 'Gear, flies & tackle included' },
    { value: '3', label: 'Trip lengths, one river' },
    { value: 'Same day', label: 'Reply to every inquiry' },
  ],
  pricing: {
    eyebrow: 'Trips & rates',
    heading: 'Pick your water',
    subhead: 'Rates are per boat, not per person. Choose a trip, pick a date, and we hold it while we confirm conditions.',
    maxAnglers: 2,
    reserveCta: 'Hold this date',
    finePrint:
      'Oregon angling license and tags not included. Dates are requests until confirmed by your guide. Expedition pricing depends on route and party size.',
    tiers: [
      {
        id: 'half-day',
        name: 'Half-Day Float',
        price: 450,
        duration: '4–5 hours',
        blurb: 'The best stretch of the day, dawn or dusk. Ideal for a first trip.',
        includes: ['Drift boat & guide', 'Rods, reels, flies & tackle', 'Water & snacks'],
      },
      {
        id: 'full-day',
        name: 'Full-Day River Drift',
        price: 650,
        duration: '8–9 hours',
        blurb: 'Miles of river, every run fished properly, lunch on the bank.',
        includes: ['Everything in the half-day', 'Riverside lunch', 'Fish photos sent to your phone'],
        featured: true,
      },
      {
        id: 'expedition',
        name: 'Backcountry Wilderness Expedition',
        price: 1500,
        priceSuffix: '+',
        duration: 'Multi-day',
        blurb: 'Roadless canyon water, camp on the river, fish that rarely see a fly.',
        includes: ['Custom route & itinerary', 'Camp, meals & all gear', 'Shuttle logistics handled'],
      },
    ],
  },
  guide: {
    eyebrow: 'Your guide',
    heading: 'Knows this river run by run',
    name: 'Your Guide Name',
    bio: [
      'Replace this with the real story: how long you have guided the Rogue, what you fish for, and why people rebook.',
      'Short, specific and true beats polished. One paragraph on experience, one on how a day in the boat actually runs.',
    ],
    imageSrc: '/media/guide-bio.jpg',
    imageAlt: 'Fishing guide standing on a gravel bar beside a misty mountain river at sunrise',
  },
  fleet: {
    eyebrow: 'The boat',
    heading: 'Built for rock, rapids and long days',
    body: 'A welded-aluminum drift boat with padded swivel seats, dry storage and room for two anglers to cast without crossing lines. Stable in pushy water, quiet in the tailouts.',
    imageSrc: '/media/fleet-metal-boat.jpg',
    imageAlt: 'Guide rowing two anglers in an aluminum drift boat down a misty river',
  },
  gear: {
    eyebrow: 'The gear',
    heading: 'Show up with a license. We bring the rest.',
    body: 'Premium rods and reels matched to the season, and flies tied for this river — not pulled from a bin.',
    items: ['Fly and conventional setups', 'Hand-tied seasonal patterns', 'Polarized glasses to borrow', 'Waders on request'],
    imageSrc: '/media/gear-showcase.jpg',
    imageAlt: 'Fly reel, rod and a leather box of hand-tied flies on a weathered drift boat bench',
  },
  success: {
    eyebrow: 'On the water',
    heading: 'Handled wet, released strong',
    body: 'Wild fish go back. We keep them in the water, get the photo fast, and send it to your phone before you are off the river.',
    imageSrc: '/media/client-success.jpg',
    imageAlt: 'Angler kneeling in the river holding a wild trout just above the water',
  },
  lead: {
    eyebrow: 'Get on the calendar',
    heading: 'Tell us when. We will tell you what is running.',
    subhead: 'You get an instant confirmation, then a personal reply from your guide with conditions and open dates.',
    submitLabel: 'Send my request',
    smsConsentText:
      'Text me about this trip. I agree to receive automated booking texts at this number. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.',
    successTitle: 'Request received',
    successBody: 'Check your phone and inbox for a confirmation. Your guide will follow up personally with conditions and dates.',
    endpoint: '/api/axiom/leads',
  },
  seo: {
    title: 'Rogue River Apex Guides | Guided Drift Boat Fishing in Southern Oregon',
    description:
      'Private guided drift boat fishing on the Rogue River. Half-day floats, full-day drifts and backcountry expeditions in Jackson and Josephine County.',
  },
};
