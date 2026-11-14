/** Synthetic caller id for a verified master-owner cookie. Not a database user. */
export const MASTER_OWNER_ID = "master-owner";

export const MASTER_COOKIE = "axiom_master";

/** Browser cap for a persistent cookie. Renewed on each desk open. */
export const MASTER_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export const MASTER_KEY_MIN = 16;
