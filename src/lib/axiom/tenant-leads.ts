export function formatLeadPhone(phone: string) {
  return phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '--') : '';
}
export default formatLeadPhone;
