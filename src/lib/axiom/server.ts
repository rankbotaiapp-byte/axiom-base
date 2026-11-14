import { createServerFn } from "@tanstack/react-start";

function stubFn<T extends Record<string, unknown> | unknown = Record<string, unknown>>(result?: unknown) {
  return createServerFn({ method: "POST" })
    .validator((d: T) => d)
    .handler(async ({ data }) => (result !== undefined ? result : data));
}

function stubGet<T = unknown>(result: unknown) {
  return createServerFn({ method: "GET" })
    .validator((d: T) => d)
    .handler(async () => result);
}

export async function getAxiomServerStatus() {
  return { online: true, timestamp: new Date().toISOString() };
}

export async function verifyTenantSession(shopSlug: string) {
  return { valid: true, shopSlug, role: "admin" };
}

export const getOperatorData = createServerFn({ method: "GET" })
  .validator((d: string | { slug: string }) => d)
  .handler(async ({ data }) => {
    const slug = typeof data === "string" ? data : data.slug;
    return {
      mode: "preview" as const,
      shop: {
        id: `shop_${slug}`,
        slug,
        name: slug,
        niche: "contractor",
        customNiche: "",
        tagline: "",
        description: "",
        ringColor: "#00f2fe",
        heroImageUrl: "",
        heroVideoUrl: "",
        isShowcase: true,
        ownerUserId: null,
        onboardingStep: "complete",
        onboarding: { hero: true, service: true, employee: true, testBooked: true },
        hours: {},
        address: "",
        acceptsCard: false,
        worksAlone: false,
        dashboardOverride: false,
        dashboardConfig: {},
        themeProfile: {},
        neonAccent: "#00f2fe",
        glowEnabled: true,
        layout: [],
        tradeProfile: { hud: { layers: {}, headline: "" } },
        createdAt: new Date().toISOString(),
      },
      appointments: [],
      billing: null,
      services: [],
      employees: [],
      notices: [],
      notifyEmail: "",
      notifyPhone: "",
      notifySmsEnabled: false,
      notifyEmailEnabled: false,
      notificationPhone: "",
      notificationEmail: "",
      payments: {},
    };
  });

export const listMyShops = stubGet([]);
export const listShowcaseShops = stubGet([]);
export const updateShopBrand = stubFn();
export const revalidateStorefront = stubFn({ ok: true });
export const saveTradeProfile = stubFn();
export const updateNotifyChannels = stubFn();
export const setShopNiche = stubFn();
export const setShopIntro = stubFn();
export const inviteEmployee = stubFn();
export const updateEmployee = stubFn();
export const removeEmployee = stubFn();
export const beginStripeConnect = stubFn({ url: "/admin" });
export const refreshStripeConnect = stubFn({ ok: true });
export const generateBrandedAsset = stubFn({ url: "/media/hero-poster.jpg" });
export const lockTenantBrand = stubFn();
export const orchestrateFinalWebBuild = stubFn({ ok: true });
export const listShopEvents = stubGet([]);
export const confirmLatestAudit = stubFn({ ok: true });
export const acceptBooking = stubFn({ ok: true });
export const listShopPortfolio = stubGet([]);
export const addPortfolioItem = stubFn({ ok: true });
export const removePortfolioItem = stubFn({ ok: true });
export const setShopRingColor = stubFn();
export const createShopFromNiche = stubFn({ slug: "demo" });
export const submitAudit = stubFn({ ok: true });
export const getPortfolio = stubGet([]);
export const listStaffPortfolio = stubGet([]);
export const setEmployeeAvailability = stubFn();
export const moderatePortfolioItem = stubFn();
export const updateStaffAvatar = stubFn();
export const runShopAutopilotTick = stubFn({ ok: true });
export const setAutopilotActive = stubFn();
export const listAppointmentRequests = stubGet([]);
export const reviewAppointmentRequest = stubFn();
export const todayFunnelPost = stubGet(null);
export const getShopAccess = stubGet({ mode: "preview" });
export const claimInvite = stubFn();
export const getInvitePreview = stubGet({});
export const setEmployeeDashboard = stubFn();
export const setShopDashboard = stubFn();
export const readMotionStudio = stubGet({});
export const saveRenderWallet = stubFn();
export const startAiCreditPack = stubFn({ url: "/" });
export const startRenderCardSetup = stubFn({ url: "/" });
export const getAuditStatus = stubGet({ status: "idle" });

export default getAxiomServerStatus;
