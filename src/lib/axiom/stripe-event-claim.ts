/** Interpret INSERT … ON CONFLICT DO NOTHING RETURNING id. */
export function stripeEventClaimed(insertedIds: ReadonlyArray<{ id?: string } | null | undefined>, eventId: string): boolean {
  const want = eventId.trim();
  if (!want) return false;
  return insertedIds.some((row) => String(row?.id ?? "").trim() === want);
}
