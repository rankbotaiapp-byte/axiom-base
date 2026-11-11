import { useCallback, useEffect, useState } from "react";
import {
  companionStorageKey,
  isCompanionArchetypeId,
  pairCompanionArchetype,
  type CompanionArchetypeId,
} from "@/lib/axiom/companion-archetypes";

export function useCompanionArchetype(shopSlug: string, niche?: string | null) {
  const paired = pairCompanionArchetype(shopSlug, niche);
  const [archetypeId, setArchetypeId] = useState<CompanionArchetypeId>(paired);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(companionStorageKey(shopSlug));
      setArchetypeId(isCompanionArchetypeId(saved) ? saved : paired);
    } catch {
      setArchetypeId(paired);
    }
  }, [shopSlug, paired]);

  const choose = useCallback(
    (id: CompanionArchetypeId) => {
      setArchetypeId(id);
      try {
        localStorage.setItem(companionStorageKey(shopSlug), id);
      } catch {
        /* private mode */
      }
    },
    [shopSlug],
  );

  return { archetypeId, choose, paired };
}
