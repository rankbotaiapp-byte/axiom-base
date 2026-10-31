import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import {
  CalendarCheck,
  Layers,
  LifeBuoy,
  MessageCircle,
  Phone,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { setAvatarHelpOpen } from "@/components/avatar-help-state";
import { HeroInteractiveButton } from "@/components/hero-interactive-buttons";
import {
  HERO_HUD_ACTIONS,
  HERO_HUD_ACTION_LABEL,
  responseFor,
  type HeroClickAnimation,
  type HeroHudAction,
  type HeroHudButton,
  type HeroHudConfig,
  type HeroHudIcon,
  type HeroHudLine,
  type HeroHudPlate,
} from "@/lib/axiom/hero-hud";

const ICONS: Record<HeroHudIcon, LucideIcon> = {
  zap: Zap,
  "calendar-check": CalendarCheck,
  layers: Layers,
  "life-buoy": LifeBuoy,
  phone: Phone,
  "message-circle": MessageCircle,
};

function buttonFace(button: HeroHudButton, extra: string, live: boolean) {
  const variant = button.variant || "neon-glass";
  const anim = live ? button.clickAnimation || "pulse-glow" : "";
  return ["hud-action", `is-${variant}`, extra, anim ? `is-anim-${anim}` : ""].filter(Boolean).join(" ");
}

function Burst({ animation }: { animation?: HeroClickAnimation }) {
  if (animation !== "particle-burst") return null;
  return (
    <span className="hud-burst" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className={`hud-spark is-${index}`} />
      ))}
    </span>
  );
}

type EditTarget =
  | { kind: "button"; id: string; x: number; y: number }
  | { kind: "line"; plateId: string; lineId: string; x: number; y: number };

export function HeroHud({
  hud,
  title,
  telemetry = [],
  bookHref,
  interactive = true,
  showButtons = true,
  showPlates = true,
  editable = false,
  chrome = true,
  buoyant = false,
  previewId = "",
  onMove,
  onChange,
  onSelect,
  beforeAction,
}: {
  hud: HeroHudConfig;
  title?: string;
  telemetry?: readonly string[];
  bookHref?: string;
  interactive?: boolean;
  showButtons?: boolean;
  showPlates?: boolean;
  editable?: boolean;
  chrome?: boolean;
  /** Visitor buttons can be nudged around the otter loop like floating debris. */
  buoyant?: boolean;
  /** Plays one button's click animation without running its action. */
  previewId?: string;
  onMove?: (id: string, x: number, y: number) => void;
  /** Live typing passes false. Blur, Enter, and a finished drag pass true so the shop can persist. */
  onChange?: (next: HeroHudConfig, commit?: boolean) => void;
  onSelect?: (id: string) => void;
  /** Plays a transition, then runs the saved response. */
  beforeAction?: (button: HeroHudButton, proceed: () => void) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const [sheet, setSheet] = useState<HeroHudButton | null>(null);
  const [playing, setPlaying] = useState("");
  const playTimer = useRef<number | null>(null);
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [labelEdit, setLabelEdit] = useState<string | null>(null);
  const plate = hud.title || title || "";
  const lines = telemetry.filter(Boolean).slice(0, 3);

  function percent(target: HTMLElement) {
    const parent = frame.current?.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    if (!parent || parent.width < 1 || parent.height < 1) return null;
    const x = ((box.left + box.width / 2 - parent.left) / parent.width) * 100;
    const y = ((box.top + box.height / 2 - parent.top) / parent.height) * 100;
    return {
      x: Math.min(92, Math.max(8, Math.round(x))),
      y: Math.min(92, Math.max(8, Math.round(y))),
    };
  }

  useEffect(() => () => {
    if (playTimer.current) window.clearTimeout(playTimer.current);
  }, []);

  function execute(button: HeroHudButton) {
    if (button.action === "help" || button.action === "chat") {
      setAvatarHelpOpen(true);
      return;
    }
    const response = button.response || responseFor(button.action);
    if (response === "scrollTo") {
      const target = button.href.startsWith("#") ? button.href : "";
      document.querySelector(target || ".film-plate.is-services, .film-services, #services")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (response === "externalUrl") {
      const dial = button.href.startsWith("tel:") ? button.href : button.phone ? `tel:${button.phone}` : "";
      if (dial) {
        window.location.href = dial;
        return;
      }
      if (button.href && !button.href.startsWith("#")) window.location.href = button.href;
      return;
    }
    if (response === "apiTrigger") {
      const target = button.href.startsWith("/") ? button.href : bookHref;
      if (target) window.location.href = target;
      return;
    }
    setSheet(button);
  }

  function run(button: HeroHudButton) {
    if (!interactive || editable) return;
    if (beforeAction) {
      beforeAction(button, () => execute(button));
      return;
    }
    execute(button);
  }

  function place(id: string, target: HTMLElement, kind: "button" | "plate") {
    const next = percent(target);
    if (!next) return;
    if (kind === "button") {
      onMove?.(id, next.x, next.y);
      onChange?.({
        ...hud,
        buttons: hud.buttons.map((button) => (button.id === id ? { ...button, x: next.x, y: next.y } : button)),
      }, true);
      return;
    }
    onChange?.({
      ...hud,
      plates: hud.plates.map((item) => (item.id === id ? { ...item, x: next.x, y: next.y } : item)),
    }, true);
  }

  function openButton(button: HeroHudButton) {
    if (!editable) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPlaying(button.id);
      if (playTimer.current) window.clearTimeout(playTimer.current);
      playTimer.current = window.setTimeout(() => {
        setPlaying("");
        run(button);
      }, reduce ? 0 : 680);
      return;
    }
    if (dragged.current) return;
    setSheet(null);
    setEdit({ kind: "button", id: button.id, x: button.x, y: button.y });
    onSelect?.(button.id);
  }

  function openLine(item: HeroHudPlate, line: HeroHudLine) {
    if (!editable) {
      if (line.href) window.location.href = line.href;
      return;
    }
    if (dragged.current) return;
    setEdit({ kind: "line", plateId: item.id, lineId: line.id, x: item.x, y: item.y });
  }

  function patchButton(id: string, patch: Partial<HeroHudButton>, commit = false) {
    onChange?.({
      ...hud,
      buttons: hud.buttons.map((button) => (button.id === id ? { ...button, ...patch } : button)),
    }, commit);
  }

  function patchLine(plateId: string, lineId: string, patch: Partial<HeroHudLine>, commit = false) {
    onChange?.({
      ...hud,
      plates: hud.plates.map((item) =>
        item.id === plateId
          ? { ...item, lines: item.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)) }
          : item,
      ),
    }, commit);
  }

  return (
    <div ref={frame} className={editable ? "hud-frame is-editing" : "hud-frame"}>
      <span className="hud-vignette" aria-hidden />
      {chrome ? (
        <>
          <span className="film-bracket film-bracket-nw" aria-hidden />
          <span className="film-bracket film-bracket-ne" aria-hidden />
          <span className="film-bracket film-bracket-sw" aria-hidden />
          <span className="film-bracket film-bracket-se" aria-hidden />
        </>
      ) : null}
      {lines.length > 0 ? (
        <aside className="hud-telemetry" aria-label="Telemetry">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </aside>
      ) : null}
      {plate ? <p className="hud-title">{plate}</p> : null}
      {showPlates
        ? hud.plates.map((item) => (
            <Plate
              key={item.id}
              plate={item}
              frame={frame}
              editable={editable}
              activeLine={edit?.kind === "line" && edit.plateId === item.id ? edit.lineId : ""}
              dragged={dragged}
              onOpen={(line) => openLine(item, line)}
              onText={(lineId, text, commit) => patchLine(item.id, lineId, { text }, commit)}
              onDrop={(target) => place(item.id, target, "plate")}
            />
          ))
        : null}
      {showButtons ? (
        <ul className="hud-perimeter">
          {hud.buttons.map((button) => {
            const Icon = ICONS[button.icon];
            const picked = edit?.kind === "button" && edit.id === button.id;
            const label = (
              <InlineLabel
                value={button.label}
                editing={picked}
                nested
                maxLength={28}
                className="hud-inline-label"
                onEdit={() => openButton(button)}
                onEditing={(on) => setLabelEdit(on ? button.id : null)}
                onType={(text) => patchButton(button.id, { label: text })}
                onCommit={(text) => patchButton(button.id, { label: text }, true)}
              />
            );
            const mark = (
              <>
                <Icon aria-hidden className="size-4" />
                {label}
              </>
            );
            if (editable) {
              return (
                <li key={button.id}>
                  <motion.div
                    role="group"
                    aria-label={button.label}
                    tabIndex={0}
                    className={buttonFace(button, picked ? "is-picked" : "", playing === button.id || previewId === button.id)}
                    style={{ left: `${button.x}%`, top: `${button.y}%` }}
                    drag={labelEdit !== button.id}
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={frame}
                    onDragStart={() => {
                      dragged.current = false;
                    }}
                    onDrag={(_event, info) => {
                      if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) dragged.current = true;
                    }}
                    onDragEnd={(event) => {
                      place(button.id, event.currentTarget as HTMLElement, "button");
                    }}
                    onClick={() => openButton(button)}
                    onKeyDown={(event) => {
                      if (picked) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openButton(button);
                      }
                    }}
                  >
                    {mark}
                    {playing === button.id || previewId === button.id ? <Burst animation={button.clickAnimation} /> : null}
                  </motion.div>
                  {picked ? (
                    <ActionMenu
                      button={button}
                      onAction={(action) => patchButton(button.id, { action, response: responseFor(action) }, true)}
                      onPhone={(phone, commit) => patchButton(button.id, { phone }, commit)}
                      onHref={(href, commit) => patchButton(button.id, { href }, commit)}
                    />
                  ) : null}
                </li>
              );
            }
            return (
              <li key={button.id}>
                <HeroInteractiveButton
                  button={button}
                  className={buttonFace(button, "", previewId === button.id)}
                  buoyant={buoyant}
                  constraints={frame}
                  onActivate={run}
                >
                  {mark}
                </HeroInteractiveButton>
              </li>
            );
          })}
        </ul>
      ) : null}
      {sheet && !editable ? (
        <div className="hud-sheet" role="dialog" aria-modal="true" aria-labelledby="hud-sheet-title">
          <p id="hud-sheet-title" className="hud-title">
            {HERO_HUD_ACTION_LABEL[sheet.action]}
          </p>
          <p className="hud-sheet-copy">{sheet.successMessage || sheet.label}</p>
          {bookHref || sheet.href ? (
            <a className="hud-action hud-sheet-go" href={sheet.href || bookHref}>
              Continue
            </a>
          ) : null}
          <button type="button" className="hud-sheet-close" onClick={() => setSheet(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ActionMenu({
  button,
  onAction,
  onPhone,
  onHref,
}: {
  button: HeroHudButton;
  onAction: (action: HeroHudAction) => void;
  onPhone: (phone: string, commit: boolean) => void;
  onHref: (href: string, commit: boolean) => void;
}) {
  return (
    <div
      className="hud-action-menu"
      style={{
        left: `${button.x}%`,
        top: `${button.y}%`,
        transform: `translate(${button.x > 55 ? "calc(-100% - 0.45rem)" : "0.45rem"}, ${button.y > 68 ? "calc(-100% - 0.45rem)" : "1.9rem"})`,
      }}
    >
      <label className="motion-label" htmlFor={`hud-action-${button.id}`}>
        Action
      </label>
      <select
        id={`hud-action-${button.id}`}
        className="film-select"
        value={button.action}
        onChange={(event) => onAction(event.target.value as HeroHudAction)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {HERO_HUD_ACTIONS.map((action) => (
          <option key={action} value={action}>
            {HERO_HUD_ACTION_LABEL[action]}
          </option>
        ))}
      </select>
      {button.action === "phone" ? (
        <input
          className="film-inline-field"
          inputMode="tel"
          aria-label="Phone number"
          placeholder="5415550100"
          value={button.phone}
          onChange={(event) => onPhone(event.target.value, false)}
          onBlur={(event) => onPhone(event.target.value, true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        />
      ) : null}
      {button.action === "url" || button.action === "checkout" ? (
        <input
          className="film-inline-field"
          aria-label={button.action === "url" ? "Link" : "Checkout link"}
          placeholder={button.action === "url" ? "https://" : "/shop/book"}
          value={button.href}
          onChange={(event) => onHref(event.target.value, false)}
          onBlur={(event) => onHref(event.target.value, true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        />
      ) : null}
    </div>
  );
}

function Plate({
  plate,
  frame,
  editable,
  activeLine,
  dragged,
  onOpen,
  onText,
  onDrop,
}: {
  plate: HeroHudPlate;
  frame: { current: HTMLDivElement | null };
  editable: boolean;
  activeLine: string;
  dragged: { current: boolean };
  onOpen: (line: HeroHudLine) => void;
  onText: (lineId: string, text: string, commit: boolean) => void;
  onDrop: (target: HTMLElement) => void;
}) {
  const identity = plate.id === "plate_identity";
  const body = identity ? (
    <IdentityLines plate={plate} editable={editable} activeLine={activeLine} onOpen={onOpen} onText={onText} />
  ) : (
    <ServiceLines plate={plate} editable={editable} activeLine={activeLine} onOpen={onOpen} onText={onText} />
  );
  if (!editable) {
    return (
      <div className="film-plate-anchor" style={{ left: `${plate.x}%`, top: `${plate.y}%` }}>
        <div
          id={identity ? "identity" : plate.id === "plate_services" ? "services" : plate.id.replace(/^plate_/, "")}
          className={identity ? "film-plate is-identity" : "film-plate is-services"}
        >
          {body}
        </div>
      </div>
    );
  }
  return (
    <motion.div
      className="film-plate-anchor"
      style={{ left: `${plate.x}%`, top: `${plate.y}%` }}
      drag={editable && !activeLine}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={frame}
      onDragStart={() => {
        dragged.current = false;
      }}
      onDrag={(_event, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) dragged.current = true;
      }}
      onDragEnd={(event) => onDrop(event.currentTarget as HTMLElement)}
    >
      <div
        id={identity ? "identity" : plate.id === "plate_services" ? "services" : plate.id.replace(/^plate_/, "")}
        className={identity ? "film-plate is-identity" : "film-plate is-services"}
      >
        {body}
      </div>
    </motion.div>
  );
}

function IdentityLines({
  plate,
  editable,
  activeLine,
  onOpen,
  onText,
}: {
  plate: HeroHudPlate;
  editable: boolean;
  activeLine: string;
  onOpen: (line: HeroHudLine) => void;
  onText: (lineId: string, text: string, commit: boolean) => void;
}) {
  return (
    <>
      {plate.lines.map((line) => {
        if (!line.text && !editable) return null;
        const className = line.id === "line_name" ? "film-plate-name" : line.id === "line_city" ? "film-city" : "film-plate-copy";
        return (
          <LineButton
            key={line.id}
            line={line}
            editable={editable}
            active={activeLine === line.id}
            className={className}
            heading={line.id === "line_name"}
            maxLength={line.id === "line_name" ? 42 : 80}
            onOpen={onOpen}
            onText={onText}
          />
        );
      })}
    </>
  );
}

function ServiceLines({
  plate,
  editable,
  activeLine,
  onOpen,
  onText,
}: {
  plate: HeroHudPlate;
  editable: boolean;
  activeLine: string;
  onOpen: (line: HeroHudLine) => void;
  onText: (lineId: string, text: string, commit: boolean) => void;
}) {
  const cards: HeroHudLine[][] = [];
  let current: HeroHudLine[] = [];
  for (const line of plate.lines) {
    if (line.id.endsWith("_title") && current.length > 0) {
      cards.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) cards.push(current);
  return (
    <ul className="film-service-stack" aria-label="Services">
      {cards.map((card) => (
        <li key={card[0]?.id} className="film-service">
          {card.map((line) =>
            !line.text && !editable ? null : (
              <LineButton
                key={line.id}
                line={line}
                editable={editable}
                active={activeLine === line.id}
                className={line.id.endsWith("_title") ? "film-service-title" : line.id.endsWith("_price") ? "film-service-price" : "film-service-detail"}
                onOpen={onOpen}
                onText={onText}
              />
            ),
          )}
        </li>
      ))}
    </ul>
  );
}

function LineButton({
  line,
  editable,
  className,
  heading = false,
  maxLength = 80,
  onOpen,
  onText,
}: {
  line: HeroHudLine;
  editable: boolean;
  active: boolean;
  className: string;
  heading?: boolean;
  maxLength?: number;
  onOpen: (line: HeroHudLine) => void;
  onText: (lineId: string, text: string, commit: boolean) => void;
}) {
  const text = line.text || "Add text";
  if (!editable) {
    if (heading) return <h1 className={className}>{text}</h1>;
    if (line.href) {
      return (
        <a className={className} href={line.href}>
          {text}
        </a>
      );
    }
    return heading ? <h1 className={className}>{text}</h1> : <p className={className}>{text}</p>;
  }
  return (
    <InlineLabel
      value={line.text}
      maxLength={maxLength}
      className={className}
      heading={heading}
      onEdit={() => onOpen(line)}
      onType={(value) => onText(line.id, value, false)}
      onCommit={(value) => onText(line.id, value, true)}
    />
  );
}

export function InlineLabel({
  value,
  editing,
  maxLength,
  className,
  heading = false,
  nested = false,
  onEdit,
  onEditing,
  onType,
  onCommit,
}: {
  value: string;
  editing?: boolean;
  maxLength: number;
  className?: string;
  heading?: boolean;
  nested?: boolean;
  onEdit?: () => void;
  onEditing?: (on: boolean) => void;
  onType: (value: string) => void;
  onCommit: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const armed = useRef(false);
  const live = editing || open;

  useEffect(() => {
    if (!live) {
      armed.current = false;
      return;
    }
    if (armed.current) return;
    armed.current = true;
    field.current?.focus();
  }, [live]);

  function start() {
    setOpen(true);
    onEditing?.(true);
    onEdit?.();
  }

  function finish(next: string) {
    setOpen(false);
    onEditing?.(false);
    onCommit(next);
  }

  if (live) {
    return (
      <input
        ref={field}
        className={className ? `film-inline-field ${className}` : "film-inline-field"}
        value={value}
        maxLength={maxLength}
        aria-label="Edit text"
        onChange={(event) => onType(event.target.value)}
        onBlur={(event) => finish(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      />
    );
  }

  const shown = value || "Add text";
  if (heading) {
    return (
      <h1 className={className}>
        <button type="button" className="film-plate-hit" onClick={start}>
          {shown}
        </button>
      </h1>
    );
  }
  if (nested) {
    return <span className={className ? `film-plate-hit ${className}` : "film-plate-hit"}>{shown}</span>;
  }
  return (
    <button type="button" className={className ? `film-plate-hit ${className}` : "film-plate-hit"} onClick={start}>
      {shown}
    </button>
  );
}
