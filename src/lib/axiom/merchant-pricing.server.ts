export async function getMerchantPricingConfig(shopSlug: string) {
  return { tier: 'choose-your-price', minPrice: 1, defaultMonthly: 150 };
}
export default getMerchantPricingConfig;
