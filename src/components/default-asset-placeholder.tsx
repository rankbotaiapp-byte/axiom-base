import { useState, type ReactNode } from "react";
import { DEFAULT_PREVIEW_LABEL, isCustomStorefrontAsset } from "@/lib/axiom/gallery";

export function DefaultAssetPlaceholder({
  compact = false,
  label = DEFAULT_PREVIEW_LABEL,
}: {
  compact?: boolean;
  label?: string;
}) {
  return (
    <div className={compact ? "default-asset is-compact" : "default-asset"} role="img" aria-label={label}>
      <span className="film-glow-ring" aria-hidden />
      <span className="film-bracket film-bracket-nw" aria-hidden />
      <span className="film-bracket film-bracket-ne" aria-hidden />
      <span className="film-bracket film-bracket-sw" aria-hidden />
      <span className="film-bracket film-bracket-se" aria-hidden />
      <p className="default-asset-badge">{label}</p>
    </div>
  );
}

export function DefaultAssetFrame({
  src,
  alt = "",
  compact = false,
  children,
}: {
  src?: string;
  alt?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const custom = isCustomStorefrontAsset(src ?? "");
  if (custom && src) {
    return (
      <div className={compact ? "default-asset-photo is-compact" : "default-asset-photo"}>
        <img src={src} alt={alt} />
        {children}
      </div>
    );
  }
  return (
    <div className={compact ? "default-asset-photo is-compact" : "default-asset-photo"}>
      <DefaultAssetPlaceholder compact={compact} />
      {children}
    </div>
  );
}

export function DefaultAssetDropzone({
  src,
  caption,
  compact = false,
  disabled = false,
  onFile,
}: {
  src?: string;
  caption: string;
  compact?: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const [hot, setHot] = useState(false);
  const custom = isCustomStorefrontAsset(src ?? "");
  return (
    <label
      className={`default-asset-slot${hot ? " is-hot" : ""}${custom ? "" : " is-default"}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setHot(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={(event) => {
        event.preventDefault();
        setHot(false);
        const file = event.dataTransfer.files?.[0];
        if (file && !disabled) onFile(file);
      }}
    >
      <DefaultAssetFrame src={src} alt={caption} compact={compact} />
      <span className="default-asset-caption">{caption}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
