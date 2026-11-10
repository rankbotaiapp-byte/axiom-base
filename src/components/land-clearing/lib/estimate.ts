import { estimator, type DensityKey, type ServiceKey, type TerrainKey } from '../config/site';

export type EstimateInput = {
  service: ServiceKey;
  acres: number;
  density: DensityKey;
  terrain: TerrainKey;
};

export type EstimateResult = {
  low: number;
  high: number;
  mid: number;
  days: number;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const svc = estimator.services[input.service];
  const den = estimator.density[input.density];
  const ter = estimator.terrain[input.terrain];

  const work = svc.perAcre * input.acres * den.mult * ter.mult;
  const mid = Math.max(estimator.minimumJob, work + estimator.mobilization);
  const low = roundTo(mid * (1 - estimator.spread), 50);
  const high = roundTo(mid * (1 + estimator.spread), 50);
  const days = Math.max(1, Math.ceil(input.acres / (den.acresPerDay * ter.speed)));

  return { low, high, mid, days };
}

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function describeEstimate(input: EstimateInput, result: EstimateResult) {
  return [
    `${estimator.services[input.service].label}`,
    `${input.acres} ac`,
    estimator.density[input.density].label,
    `${estimator.terrain[input.terrain].label} terrain`,
    `Est. ${usd(result.low)}–${usd(result.high)}`,
    `approx. ${result.days} day${result.days > 1 ? 's' : ''} on site`,
  ].join(' · ');
}
