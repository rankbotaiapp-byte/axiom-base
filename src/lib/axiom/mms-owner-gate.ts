import { nationalDigits } from "./axiom-business-number";

/** Owner notify / owner_phone lines only — public shop.phone is not an MMS media grant. */
export function mmsSenderMayUpdateProof(from: string, ownerPhones: Array<string | null | undefined>): boolean {
  const fromDigits = nationalDigits(from);
  if (fromDigits.length !== 10) return false;
  return ownerPhones.some((phone) => {
    const digits = nationalDigits(String(phone || ""));
    return digits.length === 10 && digits === fromDigits;
  });
}
