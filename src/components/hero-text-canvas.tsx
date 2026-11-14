import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  defaultHeroLayout,
  type HeroLayerId,
  type HeroTextLayer,
  type HeroTextLayout,
} from "@/lib/axiom/hud";

const ORDER: HeroLayerId[] = ["headline", "subheadline", "cta_button"];

function clampPercent(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

function paintStyle(layer: HeroTextLayer): CSSProperties {
  const shimmer =
    layer.effect === "shimmer" && layer.colorMode === "solid"
      ? `linear-gradient(105deg, ${layer.solidColor} 0%, #ffffff 46%, ${layer.solidColor} 78%)`
      : "";
  const gradient = layer.colorMode === "gradient" ? layer.gradientCss : shimmer;
  const ink = { ["--hero-ink" as string]: layer.solidColor, fontFamily: `"${layer.fontFamily}", sans-serif` };
  if (!gradient) return { ...ink, color: layer.solidColor };
  return {
    ...ink,
    backgroundImage: gradient,
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

export function HeroTextCanvas({
  layers,
  fallbacks,
  editable = false,
  activeLayer = "headline",
  onActiveLayer,
  onLayerChange,
  bookHref,
}: {
  layers: HeroTextLayout;
  fallbacks: Record<HeroLayerId, string>;
  editable?: boolean;
  activeLayer?: HeroLayerId;
  onActiveLayer?: (id: HeroLayerId) => void;
  onLayerChange?: (id: HeroLayerId, layer: HeroTextLayer, persist: boolean) => void;
  bookHref?: string;
}) {
  const boundsRef = useRef<HTMLDivElement>(null);
  const layout = layers?.headline ? layers : defaultHeroLayout();

  return (
    <div ref={boundsRef} className="pointer-events-none absolute inset-0 z-20">
      {ORDER.map((id) => (
        <HeroLayerNode
          key={id}
          id={id}
          layer={layout[id]}
          fallback={fallbacks[id]}
          editable={editable}
          active={editable && activeLayer === id}
          boundsRef={boundsRef}
          bookHref={bookHref}
          onActive={() => onActiveLayer?.(id)}
          onChange={(layer, persist) => onLayerChange?.(id, layer, persist)}
        />
      ))}
    </div>
  );
}

function HeroLayerNode({
  id,
  layer,
  fallback,
  editable,
  active,
  boundsRef,
  bookHref,
  onActive,
  onChange,
}: {
  id: HeroLayerId;
  layer: HeroTextLayer;
  fallback: string;
  editable: boolean;
  active: boolean;
  boundsRef: { readonly current: HTMLDivElement | null };
  bookHref?: string;
  onActive: () => void;
  onChange: (layer: HeroTextLayer, persist: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const shown = layer.text || fallback || "\u00a0";
  const gradient = layer.colorMode === "gradient" || layer.effect === "shimmer";

  function moveBy(dx: number, dy: number) {
    onChange(
      {
        ...layer,
        position: {
          x: clampPercent(layer.position.x + dx),
          y: clampPercent(layer.position.y + dy),
        },
      },
      true,
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || editing) return;
    const step = event.shiftKey ? 5 : 1;
    const delta =
      event.key === "ArrowLeft"
        ? [-step, 0]
        : event.key === "ArrowRight"
          ? [step, 0]
          : event.key === "ArrowUp"
            ? [0, -step]
            : event.key === "ArrowDown"
              ? [0, step]
              : null;
    if (!delta) return;
    event.preventDefault();
    moveBy(delta[0], delta[1]);
  }

  const face = (
    <LayerFace
      id={id}
      shown={shown}
      editing={editing}
      editable={editable}
      ink={paintStyle(layer)}
      effect={layer.effect}
      mode={gradient ? "gradient" : "solid"}
      onEditStart={() => {
        if (!editable) return;
        onActive();
        setEditing(true);
      }}
      onCommit={(text) => {
        setEditing(false);
        const next = !layer.text && text === fallback.trim() ? "" : text;
        onChange({ ...layer, text: next }, true);
      }}
    />
  );

  return (
    <motion.div
      drag={editable && !editing}
      dragConstraints={boundsRef}
      dragElastic={0}
      dragMomentum={false}
      style={{
        x: dragX,
        y: dragY,
        left: `${layer.position.x}%`,
        top: `${layer.position.y}%`,
      }}
      className={cn(
        "hero-type absolute max-w-[min(40rem,88%)] outline-none",
        id === "headline" && "max-w-[min(16rem,42vw)] text-[clamp(1.2rem,2.4vw,1.7rem)] leading-[1.05]",
        id === "subheadline" && "max-w-[min(28rem,80%)] text-base leading-snug sm:text-lg",
        id === "cta_button" && "max-w-[16rem]",
        editable && "pointer-events-auto cursor-grab touch-none active:cursor-grabbing",
        !editable && id === "cta_button" && "pointer-events-auto",
        active && "rounded-md ring-1 ring-accent ring-offset-2 ring-offset-transparent",
      )}
      data-spatial={editable ? undefined : id === "headline" ? "headline" : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={id === "headline" ? "Headline" : id === "subheadline" ? "Subheadline" : "Call to action"}
      onPointerDown={onActive}
      onKeyDown={onKeyDown}
      onDragEnd={(_, info) => {
        const bounds = boundsRef.current?.getBoundingClientRect();
        dragX.set(0);
        dragY.set(0);
        if (!bounds || bounds.width < 1 || bounds.height < 1) return;
        onChange(
          {
            ...layer,
            position: {
              x: clampPercent(layer.position.x + (info.offset.x / bounds.width) * 100),
              y: clampPercent(layer.position.y + (info.offset.y / bounds.height) * 100),
            },
          },
          true,
        );
      }}
    >
      {id === "cta_button" ? (
        <CtaChrome href={editable ? undefined : bookHref}>{face}</CtaChrome>
      ) : (
        face
      )}
    </motion.div>
  );
}

function CtaChrome({ href, children }: { href?: string; children: ReactNode }) {
  const className = "glass-btn inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium";
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function LayerFace({
  id,
  shown,
  editing,
  editable,
  ink,
  effect,
  mode,
  onEditStart,
  onCommit,
}: {
  id: HeroLayerId;
  shown: string;
  editing: boolean;
  editable: boolean;
  ink: CSSProperties;
  effect: HeroTextLayer["effect"];
  mode: "solid" | "gradient";
  onEditStart: () => void;
  onCommit: (text: string) => void;
}) {
  const editorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!editing || !editorRef.current) return;
    const node = editorRef.current;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  if (!editing) {
    return (
      <span
        onClick={onEditStart}
        className="hero-type-ink block"
        style={ink}
        data-effect={effect}
        data-mode={mode}
      >
        {shown}
        {editable ? <span className="sr-only">. Double-click to edit the {id.replace("_", " ")}.</span> : null}
      </span>
    );
  }
  return (
    <span
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={id}
      className="hero-type-ink block min-w-[4rem] outline-none"
      style={ink}
      data-effect={effect}
      data-mode={mode}
      onBlur={(event) => {
        const text = (event.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
        onCommit(text);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {shown}
    </span>
  );
}
