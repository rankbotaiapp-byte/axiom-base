import "./companion-hud.css";

/** Tactical corner crosshairs + atmospheric wash over storefront and admin. */
export function ObsidianHudChrome() {
  return (
    <div className="obsidian-hud-chrome" aria-hidden>
      <div className="obsidian-hud-chrome__smoke" />
      <span className="obsidian-hud-chrome__bracket obsidian-hud-chrome__bracket--tl" />
      <span className="obsidian-hud-chrome__bracket obsidian-hud-chrome__bracket--tr" />
      <span className="obsidian-hud-chrome__bracket obsidian-hud-chrome__bracket--bl" />
      <span className="obsidian-hud-chrome__bracket obsidian-hud-chrome__bracket--br" />
    </div>
  );
}
