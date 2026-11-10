// Runtime white-labeling for showcase builds.
// The tenant page loads a build (same origin) in a full-screen frame and calls
// applyBranding() on its document once it has hydrated. Every occurrence of the
// demo brand name and phone is swapped for the tenant's, the logo is placed next
// to the first visible brand mark, and a MutationObserver keeps late-rendered
// content (modals, quote sheets, call overlays) branded too.

export type BrandSpec = { names: string[]; phones: string[]; logoSelector?: string };
export type TenantBrand = { business_name: string; phone: string; logo_url: string | null };

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"]);
const ATTRS = ["aria-label", "title", "alt", "placeholder"];

const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function prettyPhone(e164: string) {
  const d = e164.replace(/\D/g, "").slice(-10);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function buildReplacers(spec: BrandSpec, t: TenantBrand) {
  const reps: { re: RegExp; to: (m: string) => string }[] = [];

  // Brand names — longest first; keep the casing style of each occurrence.
  for (const name of [...spec.names].sort((a, b) => b.length - a.length)) {
    reps.push({
      re: new RegExp(`(?<![\\w-])${escapeRe(name)}(?![\\w-])`, "gi"), // whole words only
      to: (m) =>
        m === m.toUpperCase() && m !== m.toLowerCase()
          ? t.business_name.toUpperCase()
          : m === titleCase(m) && t.business_name === t.business_name.toLowerCase()
            ? titleCase(t.business_name)
            : t.business_name,
    });
  }

  // Phones — match any formatting of the demo digits.
  const pretty = prettyPhone(t.phone);
  for (const p of spec.phones) {
    const d = p.replace(/\D/g, "").slice(-10);
    if (d.length !== 10) continue;
    const re = new RegExp(
      `(?:\\+?1[\\s.-]?)?\\(?${d.slice(0, 3)}\\)?[\\s.-]?${d.slice(3, 6)}[\\s.-]?${d.slice(6)}`,
      "g",
    );
    reps.push({ re, to: (m) => (/^\+?1?\d{10}$/.test(m) ? t.phone : pretty) });
  }
  return reps;
}

export function applyBranding(doc: Document, spec: BrandSpec, t: TenantBrand): () => void {
  const win = doc.defaultView;
  if (!win || !doc.body) return () => {};
  const reps = buildReplacers(spec, t);
  const demoDigits = spec.phones.map((p) => p.replace(/\D/g, "").slice(-10));
  let logoPlaced = !t.logo_url;

  const swap = (s: string) => reps.reduce((acc, r) => acc.replace(r.re, r.to), s);

  const placeLogo = (textNode: Text) => {
    if (logoPlaced || !t.logo_url) return;
    const host = textNode.parentElement;
    if (!host || !host.getClientRects().length) return; // only visible marks
    const img = doc.createElement("img");
    img.src = t.logo_url;
    img.alt = "";
    img.setAttribute("data-axiom-logo", "");
    img.style.cssText =
      "display:inline-block;height:1.35em;width:auto;max-width:5.5em;object-fit:contain;vertical-align:middle;margin:0 .45em .1em 0;border-radius:.2em";
    host.insertBefore(img, textNode);
    logoPlaced = true;
  };

  const brandLower = t.business_name.toLowerCase();

  const processTree = (root: Node) => {
    const walker = doc.createTreeWalker(root, win.NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const tn = n as Text;
      const parent = tn.parentElement;
      if (!parent || SKIP.has(parent.tagName) || parent.isContentEditable) continue;
      const before = tn.nodeValue ?? "";
      const after = swap(before);
      if (after !== before) tn.nodeValue = after; // only write on change — avoids observer loops
      if (!logoPlaced && after.toLowerCase().includes(brandLower)) placeLogo(tn);
    }
    if (root.nodeType === 1) {
      const scope = root as Element;
      const TEL = 'a[href^="tel:"], a[href^="sms:"]';
      const anchors = [...scope.querySelectorAll<HTMLAnchorElement>(TEL)];
      if (scope.matches(TEL)) anchors.push(scope as HTMLAnchorElement);
      for (const a of anchors) {
        const href = a.getAttribute("href")!;
        const digits = href.replace(/\D/g, "").slice(-10);
        if (demoDigits.includes(digits)) a.setAttribute("href", `${href.startsWith("sms:") ? "sms:" : "tel:"}${t.phone}`);
      }
      for (const attr of ATTRS) {
        const nodes = [...scope.querySelectorAll(`[${attr}]`)];
        if (scope.hasAttribute(attr)) nodes.push(scope);
        for (const node of nodes) {
          const v = node.getAttribute(attr)!;
          const nv = swap(v);
          if (nv !== v) node.setAttribute(attr, nv);
        }
      }
    }
  };

  // Logo override target, if the build specifies one.
  if (spec.logoSelector && t.logo_url) {
    const target = doc.querySelector(spec.logoSelector);
    if (target) {
      const img = doc.createElement("img");
      img.src = t.logo_url;
      img.alt = t.business_name;
      img.setAttribute("data-axiom-logo", "");
      img.style.cssText = "height:1.35em;width:auto;max-width:5.5em;object-fit:contain;vertical-align:middle;margin-right:.45em";
      target.prepend(img);
      logoPlaced = true;
    }
  }

  doc.title = swap(doc.title);
  processTree(doc.body);

  // Keep late-rendered UI branded. Batched per frame; converges because swaps are idempotent.
  const pending = new Set<Node>();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    for (const node of pending) if (node.isConnected) processTree(node.nodeType === 3 ? node.parentNode ?? node : node);
    pending.clear();
    if (doc.title !== swap(doc.title)) doc.title = swap(doc.title);
  };
  const mo = new win.MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") pending.add(r.target);
      else if (r.type === "attributes") pending.add(r.target);
      else r.addedNodes.forEach((nd) => pending.add(nd));
    }
    if (!scheduled && pending.size) {
      scheduled = true;
      win.requestAnimationFrame(flush);
    }
  });
  mo.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href", ...ATTRS] });
  return () => mo.disconnect();
}
