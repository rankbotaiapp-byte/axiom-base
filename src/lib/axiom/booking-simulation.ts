/**
 * Public intake never trusts a naked `isSimulated` flag.
 * Simulated rows are desk tests only (master session / bypass), never OUTREACH_MODE.
 * OUTREACH_MODE gates contractor outreach send — not whether a customer job is real.
 */
export function honorSimulatedBooking(input: { masterAttached: boolean; clientFlag: boolean }): boolean {
  return input.masterAttached === true && input.clientFlag === true;
}
