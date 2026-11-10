export const OPEN_CONCIERGE_EVENT = "hyper-moto:open-concierge";

/** Open the concierge panel from any CTA on the page. */
export function openConcierge(): void {
  window.dispatchEvent(new Event(OPEN_CONCIERGE_EVENT));
}
