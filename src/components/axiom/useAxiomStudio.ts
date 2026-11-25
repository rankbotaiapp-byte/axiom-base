"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { SAMPLE_BUSINESS, SAMPLE_PHOTOS, mockStudioApi, ACCENTS } from "./studioPresets";
import { leadSlugFrom } from "@/lib/axiom/funnel";
import type { InlayPresetId, MotionPresetId } from "@/lib/axiom/storefront-themes";
import { animateRecreatedBackground, readCachedStudioPhotos, rememberStudioPhoto, remakeUploadedPhoto } from "./studioRemake";
import type {
  AccentKey,
  AxiomStudioApi,
  OnboardPayload,
  ShowcaseThemeId,
  SlotId,
  SlotMap,
  StudioMode,
  StudioPhoto,
  StudioState,
} from "./types";

export const MAX_PHOTOS = 3;
const EMPTY_SLOTS: SlotMap = { hero: null, proof: null, services: null };

/** Autopilot: best-effort mapping by upload order, reusing photos when < 3. */
export function autoAssign(photos: StudioPhoto[]): SlotMap {
  const [a, b, c] = photos.map((p) => p.id);
  return { hero: a ?? null, proof: b ?? a ?? null, services: c ?? b ?? a ?? null };
}

type Action =
  | { type: "field"; key: "businessName" | "niche"; value: string }
  | { type: "accent"; value: AccentKey }
  | { type: "showcaseTheme"; value: ShowcaseThemeId }
  | { type: "heroMotion"; value: boolean }
  | { type: "mode"; value: StudioMode }
  | { type: "addPhotos"; photos: StudioPhoto[] }
  | { type: "removePhoto"; id: string }
  | { type: "assign"; slot: SlotId; photoId: string | null }
  | { type: "status"; value: StudioState["status"]; error?: string }
  | { type: "enhanced"; results: Array<{ id: string; url: string; inlay?: string }> }
  | { type: "background"; id: string; videoUrl: string; motion?: string }
  | { type: "loadSample" }
  | {
      type: "prefill";
      businessName: string;
      niche: string;
      mode: StudioMode;
      accent: AccentKey;
      showcaseThemeId?: ShowcaseThemeId;
      photos: StudioPhoto[];
      manualSlots: SlotMap;
    };

const initialState: StudioState = {
  businessName: "",
  niche: "",
  mode: "autopilot",
  photos: [],
  manualSlots: EMPTY_SLOTS,
  accent: "cyan",
  showcaseThemeId: "solar_gold",
  heroMotion: true,
  status: "idle",
};

function reducer(s: StudioState, a: Action): StudioState {
  switch (a.type) {
    case "field":
      return { ...s, [a.key]: a.value };
    case "accent":
      return { ...s, accent: a.value };
    case "showcaseTheme":
      return { ...s, showcaseThemeId: a.value };
    case "heroMotion":
      return { ...s, heroMotion: a.value };
    case "mode":
      // Seed manual mode from the current autopilot layout so nothing goes blank.
      return a.value === "manual" && s.mode !== "manual"
        ? { ...s, mode: a.value, manualSlots: autoAssign(s.photos) }
        : { ...s, mode: a.value };
    case "addPhotos": {
      const photos = [...s.photos, ...a.photos].slice(0, MAX_PHOTOS);
      const manualSlots = { ...s.manualSlots };
      // Fill any empty manual slots with the new photos.
      (Object.keys(manualSlots) as SlotId[]).forEach((k) => {
        if (!manualSlots[k]) manualSlots[k] = autoAssign(photos)[k];
      });
      return { ...s, photos, manualSlots, status: "idle" };
    }
    case "removePhoto": {
      const photos = s.photos.filter((p) => p.id !== a.id);
      const manualSlots = { ...s.manualSlots };
      (Object.keys(manualSlots) as SlotId[]).forEach((k) => {
        if (manualSlots[k] === a.id) manualSlots[k] = autoAssign(photos)[k];
      });
      return { ...s, photos, manualSlots };
    }
    case "assign":
      return { ...s, manualSlots: { ...s.manualSlots, [a.slot]: a.photoId } };
    case "status":
      return { ...s, status: a.value, error: a.error };
    case "enhanced":
      return {
        ...s,
        status: "ready",
        photos: s.photos.map((p) => {
          const hit = a.results.find((r) => r.id === p.id);
          return hit ? { ...p, url: hit.url, enhanced: true, inlay: hit.inlay, backgroundVideo: undefined, motion: undefined } : p;
        }),
      };
    case "background":
      return {
        ...s,
        status: "ready",
        error: undefined,
        photos: s.photos.map((p) => (p.id === a.id ? { ...p, backgroundVideo: a.videoUrl, motion: a.motion } : p)),
      };
    case "loadSample":
      return {
        ...s,
        businessName: s.businessName || SAMPLE_BUSINESS.businessName,
        niche: s.niche || SAMPLE_BUSINESS.niche,
        photos: SAMPLE_PHOTOS,
        manualSlots: autoAssign(SAMPLE_PHOTOS),
        status: "idle",
      };
    case "prefill":
      return {
        ...s,
        businessName: a.businessName || s.businessName,
        niche: a.niche || s.niche,
        mode: a.mode,
        accent: a.accent,
        showcaseThemeId: a.showcaseThemeId || s.showcaseThemeId,
        photos: a.photos.length ? a.photos : s.photos,
        manualSlots: a.photos.length ? a.manualSlots : s.manualSlots,
      };
  }
}

let uid = 0;
const nextId = () => `p${Date.now().toString(36)}${(uid++).toString(36)}`;

export function useAxiomStudio(_api: AxiomStudioApi = mockStudioApi) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const businessName = (params.get("biz") || params.get("business") || "").trim();
    const niche = (params.get("niche") || params.get("trade") || "").trim();
    const mode: StudioMode = params.get("mode") === "manual" ? "manual" : "autopilot";
    const accentRaw = params.get("accent");
    const accent: AccentKey = accentRaw === "amber" || accentRaw === "magenta" ? accentRaw : "cyan";
    const themeRaw = params.get("theme");
    const showcaseThemeId: ShowcaseThemeId =
      themeRaw === "pure_cyan" || themeRaw === "emergency_amber" || themeRaw === "cobalt_ice" || themeRaw === "solar_gold"
        ? themeRaw
        : "solar_gold";
    const loadSamples = params.get("sample") === "1" || params.get("utm_source") === "desk";
    if (!businessName && !niche && !loadSamples) return;
    const name = businessName || (loadSamples ? SAMPLE_BUSINESS.businessName : "");
    const trade = niche || (loadSamples ? SAMPLE_BUSINESS.niche : "");
    const cached = name ? readCachedStudioPhotos(leadSlugFrom(name, trade || "shop")) : [];
    const photos = cached.length ? cached : loadSamples ? SAMPLE_PHOTOS : [];
    dispatch({
      type: "prefill",
      businessName,
      niche,
      mode,
      accent,
      showcaseThemeId,
      photos,
      manualSlots: photos.length ? autoAssign(photos) : EMPTY_SLOTS,
    });
  }, []);

  // Revoke object URLs for uploads that leave state, and all on unmount.
  const liveUrls = useRef(new Set<string>());
  useEffect(() => {
    const current = new Set(state.photos.filter((p) => p.source === "upload").map((p) => p.url));
    liveUrls.current.forEach((u) => {
      if (!current.has(u)) URL.revokeObjectURL(u);
    });
    liveUrls.current = current;
  }, [state.photos]);
  useEffect(() => () => liveUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const room = MAX_PHOTOS - state.photos.length;
      const files = Array.from(list)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, Math.max(0, room));
      if (!files.length) return;
      dispatch({
        type: "addPhotos",
        photos: files.map((file) => ({
          id: nextId(),
          url: URL.createObjectURL(file),
          name: file.name,
          source: "upload",
          file,
        })),
      });
    },
    [state.photos.length]
  );

  const shopSlug = leadSlugFrom(state.businessName || "shop", state.niche || "shop");

  const enhance = useCallback(async (inlay: InlayPresetId = "surface", logoUrl?: string) => {
    const uploads = state.photos.filter((photo) => photo.file);
    if (!uploads.length) {
      dispatch({
        type: "status",
        value: "error",
        error: "Upload a photo to remake. Studio does not substitute a library plate.",
      });
      return;
    }
    dispatch({ type: "status", value: "enhancing" });
    try {
      const results: Array<{ id: string; url: string; inlay?: string }> = [];
      for (const photo of uploads) {
        const url = await remakeUploadedPhoto({
          file: photo.file as File,
          shopSlug,
          niche: state.niche || "contractor",
          shopName: state.businessName || "Shop",
          brandColor: ACCENTS[state.accent].hex,
          slotLabel: photo.name,
          inlay,
          logoUrl,
        });
        rememberStudioPhoto(shopSlug, { id: photo.id, name: photo.name, url, inlay });
        results.push({ id: photo.id, url, inlay });
      }
      dispatch({ type: "enhanced", results });
    } catch (e) {
      dispatch({ type: "status", value: "error", error: e instanceof Error ? e.message : "Remake failed" });
    }
  }, [shopSlug, state.accent, state.businessName, state.niche, state.photos]);

  const animateBackground = useCallback(
    async (photoId: string, motion: MotionPresetId = "smoke") => {
      const photo = state.photos.find((item) => item.id === photoId);
      if (!photo || !/^https:\/\//i.test(photo.url)) {
        dispatch({
          type: "status",
          value: "error",
          error: "Remake the uploaded photo first, then animate its background.",
        });
        return;
      }
      dispatch({ type: "status", value: "enhancing" });
      try {
        const videoUrl = await animateRecreatedBackground({
          imageUrl: photo.url,
          shopSlug,
          niche: state.niche || "contractor",
          shopName: state.businessName || "Shop",
          brandColor: ACCENTS[state.accent].hex,
          motion,
        });
        dispatch({ type: "background", id: photo.id, videoUrl, motion });
      } catch (e) {
        dispatch({ type: "status", value: "error", error: e instanceof Error ? e.message : "Background motion failed" });
      }
    },
    [shopSlug, state.accent, state.businessName, state.niche, state.photos],
  );

  const slots = useMemo<SlotMap>(
    () => (state.mode === "autopilot" ? autoAssign(state.photos) : state.manualSlots),
    [state.mode, state.photos, state.manualSlots]
  );

  const photoById = useCallback(
    (id: string | null) => (id ? state.photos.find((p) => p.id === id) ?? null : null),
    [state.photos]
  );

  const canCheckout = state.businessName.trim().length > 1 && state.photos.length > 0;

  const buildPayload = useCallback(
    (): OnboardPayload => ({
      businessName: state.businessName.trim(),
      niche: state.niche.trim(),
      mode: state.mode,
      accent: state.accent,
      showcaseThemeId: state.showcaseThemeId,
      heroMotion: state.heroMotion,
      slots,
      photos: state.photos.map((p) => ({
        id: p.id,
        name: p.name,
        source: p.source,
        url: /^https:\/\//i.test(p.url) || p.source === "sample" ? p.url : undefined,
      })),
      createdAt: new Date().toISOString(),
    }),
    [state, slots]
  );

  return {
    state,
    slots,
    photoById,
    canCheckout,
    buildPayload,
    addFiles,
    enhance,
    animateBackground,
    loadSample: () => dispatch({ type: "loadSample" }),
    removePhoto: (id: string) => dispatch({ type: "removePhoto", id }),
    setField: (key: "businessName" | "niche", value: string) => dispatch({ type: "field", key, value }),
    setMode: (value: StudioMode) => dispatch({ type: "mode", value }),
    setAccent: (value: AccentKey) => dispatch({ type: "accent", value }),
    setShowcaseTheme: (value: ShowcaseThemeId) => dispatch({ type: "showcaseTheme", value }),
    setHeroMotion: (value: boolean) => dispatch({ type: "heroMotion", value }),
    assignSlot: (slot: SlotId, photoId: string | null) => dispatch({ type: "assign", slot, photoId }),
  };
}

export const ONBOARD_STORAGE_KEY = "axiom:onboard";

export function onboardHref(p: OnboardPayload, base = "/onboard") {
  const q = new URLSearchParams({
    biz: p.businessName,
    niche: p.niche,
    mode: p.mode,
    accent: p.accent,
    theme: p.showcaseThemeId || "solar_gold",
    slots: (Object.keys(p.slots) as SlotId[]).map((k) => `${k}:${p.slots[k] ?? ""}`).join(","),
  });
  return `${base}?${q.toString()}`;
}
