export function triggerPlumberCampaign(niche: string) {
  return { success: true, niche, timestamp: new Date().toISOString() };
}
export default triggerPlumberCampaign;
