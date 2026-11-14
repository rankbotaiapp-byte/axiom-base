export async function getTenantLeads(shopSlug: string) {
  return [{ id: '1', name: 'Emergency Plumbing Lead', status: 'new', phone: '541-555-0199', timestamp: new Date().toISOString() }];
}
export async function createTenantLead(shopSlug: string, data: any) {
  return { success: true, leadId: 'lead_' + Date.now(), ...data };
}
export default getTenantLeads;
