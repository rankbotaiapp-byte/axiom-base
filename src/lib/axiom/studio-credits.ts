/** Initial pool granted once, when the $1 trial subscription is created. */
export const TRIAL_CREDIT_POOL = 50;
export const TRIAL_DAYS = 14;
export const TRIAL_MONTHLY_CENTS = 15_000;

export const STUDIO_TRIAL_PROMPT =
  "Start your $1 trial to unlock live studio generation. It runs 14 days, then $150 a month. This preview keeps the stock hero until then.";

export class StudioTrialRequiredError extends Error {
  readonly code = "trial_required";
  constructor(message = STUDIO_TRIAL_PROMPT) {
    super(message);
    this.name = "StudioTrialRequiredError";
  }
}

export function isStudioTrialRequired(err: unknown): err is StudioTrialRequiredError {
  return err instanceof StudioTrialRequiredError || (err instanceof Error && err.name === "StudioTrialRequiredError");
}
