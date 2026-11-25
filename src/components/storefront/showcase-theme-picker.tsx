"use client";

import { SHOWCASE_THEME_IDS, showcaseTheme, type ShowcaseThemeId } from "@/lib/axiom/outreach-desk";

export function ShowcaseThemePicker({
  value,
  onChange,
}: {
  value: ShowcaseThemeId;
  onChange: (id: ShowcaseThemeId) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-[#050507] p-4">
      <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#FFE500]">
        Neon ring & buttons
      </legend>
      <p className="mb-3 text-sm text-white/65">
        Preview the perimeter ring and sticky CALL / BOOK colors before you publish. Default is Yellow / Solar Gold + Electric Cyan.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SHOWCASE_THEME_IDS.map((id) => {
          const theme = showcaseTheme(id);
          const on = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`rounded-xl border p-3 text-left ${on ? "border-[#00ffcc]" : "border-white/10"}`}
              style={{ boxShadow: on ? `inset 0 0 0 1px ${theme.ring}` : undefined }}
            >
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white">{theme.label}</span>
              <span className="mt-2 flex gap-2">
                <i className="h-5 w-5 rounded-full" style={{ background: theme.ring }} />
                <i className="h-5 w-5 rounded-full" style={{ background: theme.ringHot }} />
                <i className="h-5 w-5 rounded-full" style={{ background: theme.call }} />
                <i className="h-5 w-5 rounded-full" style={{ background: theme.book }} />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
