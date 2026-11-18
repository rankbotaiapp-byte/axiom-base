export type OutreachRead = {
  headline: string;
  body: string;
  cta: string;
  prospects: number;
  updatedAt?: string;
  config?: any;
};

export async function getPlumberOutreachMetrics() {
  return { totalProspects: 1420, activeCampaigns: 3, conversionRate: "18.4%" };
}

export default getPlumberOutreachMetrics;
