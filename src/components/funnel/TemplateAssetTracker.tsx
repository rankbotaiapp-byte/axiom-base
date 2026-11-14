import { inspectTemplateAssets, type TemplateAssetInput } from "@/lib/axiom/template-assets";
import "./funnel-layout.css";

export function TemplateAssetTracker(input: TemplateAssetInput) {
  const report = inspectTemplateAssets(input);
  return (
    <section className="asset-tracker" aria-label="Template asset checklist">
      <div className="asset-tracker__head">
        <p className="asset-tracker__kicker">Template slots</p>
        <p className="asset-tracker__count">
          {report.filled}/{report.total} filled
        </p>
      </div>
      <ul className="asset-tracker__list">
        {report.slots.map((slot) => (
          <li key={slot.id} className={slot.filled ? "is-filled" : "is-open"}>
            <span className="asset-tracker__mark" aria-hidden>
              {slot.filled ? "▣" : "▢"}
            </span>
            <div>
              <p>{slot.label}</p>
              <small>{slot.filled ? slot.detail : slot.generateHint}</small>
            </div>
          </li>
        ))}
      </ul>
      {report.ready ? (
        <p className="asset-tracker__ok">Template is conversion-ready.</p>
      ) : (
        <p className="asset-tracker__gap">Unfilled boxes need a new still or 3D loop before Autopilot ships.</p>
      )}
    </section>
  );
}
