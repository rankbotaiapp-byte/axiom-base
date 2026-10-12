import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, S as Navigate, T as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as createServerFn } from "./ssr.mjs";
import { n as formatMoney } from "./utils-BkNFIPfO.mjs";
import { n as isShopNiche } from "./types-B1NDqvg3.mjs";
import { i as NICHE_ORDER, n as NICHES } from "./niches-Dq_P6CLw.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { a as nicheLabel, o as sortLeads } from "./directory-LRUyGbzu.mjs";
import { I as createSsrRpc } from "./server-CiF75qCF.mjs";
import { T as renderOutreachMessage, c as isEmailReady, d as leadChannelTags, f as leadPublicTags, g as outreachStrategy, h as outreachPublicTokens, n as OUTREACH_STRATEGIES, u as isSmsReady } from "./funnel-DCLKTLeU.mjs";
import { C as Mail, G as ArrowUpRight, P as Copy, _ as Radio, f as Smartphone } from "../_libs/lucide-react.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bh_x61Ff.mjs";
import { d as Wordmark } from "./shop-chrome-Dr8FTvy_.mjs";
import { t as Button } from "./button-QyBk8FCQ.mjs";
import { n as Label, t as Input } from "./input-X7WHkqCl.mjs";
import { d as sendWindowBlurb, f as timingProfileFor, r as nextSendInstant, t as formatSendSlot } from "./outreach-queue-DUpdF-PE.mjs";
import { _ as recordMasterDeskOpen, d as listOutreachFunnels, f as listPlatformPulse, h as previewOutreach, i as createOutreachFunnel, l as getMasterDesk, m as preloadRegionalRoster, s as generateRegionalFunnel, t as addPreloadedLeads, u as launchOutreachBatch } from "./master-DEaTtFOs.mjs";
import { n as readFeedback, t as pulseHaptic } from "./feedback-CaqQu69G.mjs";
import { t as FeedbackToggles } from "./feedback-toggles-DWpUoHKs.mjs";
import { n as HOME_REGION_LABEL, t as HOME_REGION_COUNTIES } from "./regional-roster-BfxQXRAf.mjs";
import { r as pitchHref } from "./pricing-BxirjfBG.mjs";
import { SWEEP_PER_COUNTY } from "./registry-sweep-D2T9j1xV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/master-admin-BvQVGBdT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Rows staged and promoted in one transaction.
* 1,000 rows × 14 columns stays under Postgres' 65,535-parameter limit.
*/
var IMPORT_BATCH = 1e3;
var HEADER_KEYS = {
	name: "name",
	business: "name",
	businessname: "name",
	city: "city",
	county: "county",
	trade: "trade",
	niche: "trade",
	tradetype: "trade",
	email: "email",
	contactemail: "email",
	phone: "phone",
	contactphone: "phone",
	telephone: "phone",
	website: "website",
	url: "website",
	site: "website",
	phoneline: "phoneLine",
	line: "phoneLine"
};
function headerKey(cell) {
	return HEADER_KEYS[cell.trim().toLowerCase().replace(/[\s_-]+/g, "")] ?? null;
}
function blankState() {
	return {
		row: [],
		cell: "",
		quoted: false,
		heldQuote: false,
		header: null,
		headed: null,
		line: 1,
		pending: [],
		stripBom: true
	};
}
/**
* Incremental CSV reader. `push` accepts a slice of a file; a quoted field
* can span slices. Completed batches leave the reader so a county file is
* not kept as one array.
*/
function createLeadCsvReader(size = IMPORT_BATCH) {
	const state = blankState();
	const batchSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : size === Infinity ? Number.POSITIVE_INFINITY : IMPORT_BATCH;
	return {
		push(text) {
			return consumeCsv(state, text, batchSize);
		},
		finish() {
			return finishCsv(state, batchSize);
		}
	};
}
/** Quoted CSV, one batch at a time. A header row is used when two or more cells name known columns. */
function* leadCsvChunks(text, size = IMPORT_BATCH) {
	const reader = createLeadCsvReader(size);
	for (const batch of reader.push(text.replace(/^\uFEFF/, "").trim())) yield batch;
	const tail = reader.finish();
	if (tail.length > 0) yield tail;
}
var importBulkLeads = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const csv = typeof input?.csv === "string" ? input.csv : "";
	const leads = Array.isArray(input?.leads) ? input.leads : [];
	if (!csv.trim() && leads.length === 0) throw new Error("Add a CSV or a list of businesses");
	return {
		csv,
		leads
	};
}).handler(createSsrRpc("9b3f2539fb5ca19bc4bb704461db11a7eb5410ae35c8fdf12dee420be9f8253f"));
/** Stage one batch of the statewide filing sweep. The caller advances `offset`. */
var importRegistrySweep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const offset = Number(input?.offset ?? 0);
	if (!Number.isFinite(offset) || offset < 0) throw new Error("Sweep offset is not usable");
	return { offset: Math.floor(offset) };
}).handler(createSsrRpc("062ec43077c61b4e853c93f445a3eca84f8ebd2249364864881a9554f91c12fa"));
function consumeCsv(state, text, batchSize) {
	let source = text;
	if (state.stripBom) {
		source = source.replace(/^\uFEFF/, "");
		state.stripBom = false;
	}
	const batches = [];
	if (state.heldQuote) {
		state.heldQuote = false;
		if (source.startsWith("\"")) {
			state.cell += "\"";
			source = source.slice(1);
		} else state.quoted = false;
	}
	for (let i = 0; i < source.length; i += 1) {
		const ch = source[i];
		if (state.quoted) {
			if (ch === "\"") {
				if (i + 1 >= source.length) {
					state.heldQuote = true;
					continue;
				}
				if (source[i + 1] === "\"") {
					state.cell += "\"";
					i += 1;
				} else state.quoted = false;
			} else state.cell += ch;
			continue;
		}
		if (ch === "\"") {
			state.quoted = true;
			continue;
		}
		if (ch === ",") {
			state.row.push(state.cell);
			state.cell = "";
			continue;
		}
		if (ch === "\n") {
			state.row.push(state.cell);
			acceptRow(state, state.row, batches, batchSize);
			state.row = [];
			state.cell = "";
			continue;
		}
		if (ch === "\r") continue;
		state.cell += ch;
	}
	return batches;
}
function finishCsv(state, batchSize) {
	if (state.heldQuote) {
		state.heldQuote = false;
		state.quoted = false;
	}
	const batches = [];
	if (state.cell.length > 0 || state.row.length > 0) {
		state.row.push(state.cell);
		acceptRow(state, state.row, batches, batchSize);
		state.row = [];
		state.cell = "";
	}
	if (state.pending.length > 0) {
		const tail = state.pending;
		state.pending = [];
		return batches.flat().concat(tail);
	}
	return batches.flat();
}
function acceptRow(state, cells, batches, batchSize) {
	if (state.headed === null) {
		const header = cells.map(headerKey);
		state.headed = header.filter(Boolean).length >= 2;
		state.header = state.headed ? header : null;
		state.line = state.headed ? 2 : 1;
		if (state.headed) return;
	}
	const line = state.line;
	state.line += 1;
	if (cells.every((cell) => cell.trim() === "")) return;
	const input = { line };
	if (state.headed && state.header) cells.forEach((cell, column) => {
		const key = state.header?.[column];
		if (key) input[key] = cell.trim();
	});
	else {
		input.name = cells[0]?.trim() ?? "";
		input.city = cells[1]?.trim() ?? "";
		input.county = cells[2]?.trim() ?? "";
		input.trade = cells[3]?.trim() ?? "";
		input.email = cells[4]?.trim() ?? "";
		input.phone = cells[5]?.trim() ?? "";
		input.website = cells[6]?.trim() ?? "";
	}
	state.pending.push(input);
	if (state.pending.length >= batchSize) {
		batches.push(state.pending);
		state.pending = [];
	}
}
function MasterAdminPage() {
	const { user, isPending } = useCurrentUserState();
	const [desk, setDesk] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const userId = user?.id;
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		let cancelled = false;
		const load = () => {
			getMasterDesk().then((next) => {
				if (!cancelled) {
					setError(null);
					setDesk(next);
				}
			}).catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Forbidden");
			});
		};
		load();
		const id = window.setInterval(load, 8e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [isPending, userId]);
	if (isPending || user && !desk && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-48 animate-pulse rounded-full bg-fg/8" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/login",
		search: { next: "/master-admin" }
	});
	if (error || !desk) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Locked, { message: error ?? "Forbidden" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskView, {
		desk,
		query,
		onQuery: setQuery,
		onRefresh: () => {
			getMasterDesk().then(setDesk).catch(() => void 0);
		}
	});
}
function Locked({ message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-8 font-display text-4xl",
					children: "This desk is locked."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: message === "Master admin is not configured" ? "Set MASTER_ADMIN_EMAIL to the platform owner's sign-in email, then restart the app." : "Only the platform owner account can open the master desk."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-6 inline-block text-sm text-muted underline-offset-4 hover:underline",
					children: "Back to Axiom"
				})
			]
		})
	});
}
function DeskView({ desk, query, onQuery, onRefresh }) {
	const [regionQuery, setRegionQuery] = (0, import_react.useState)("");
	const needle = query.trim().toLowerCase();
	const regionNeedle = regionQuery.trim().toLowerCase();
	const regions = (0, import_react.useMemo)(() => {
		if (!regionNeedle) return desk.attribution;
		return desk.attribution.filter((row) => [
			row.county,
			row.tradeType,
			row.tradeLabel
		].join(" ").toLowerCase().includes(regionNeedle));
	}, [desk.attribution, regionNeedle]);
	const shops = (0, import_react.useMemo)(() => {
		if (!needle) return desk.shops;
		return desk.shops.filter((shop) => [
			shop.name,
			shop.slug,
			shop.niche,
			shop.status,
			shop.ownerEmail
		].join(" ").toLowerCase().includes(needle));
	}, [desk.shops, needle]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg px-5 py-6 sm:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs uppercase tracking-[0.22em] text-muted",
						children: "Master desk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl leading-none sm:text-5xl",
						children: "Every shop, one wire."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
						className: "size-4 text-accent",
						"aria-hidden": true
					}), "Refreshes while this page is open"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Active shops",
						value: desk.kpis.activeShops.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Bookings processed",
						value: desk.kpis.bookings.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue captured",
						value: formatMoney(desk.kpis.revenueCents)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformWire, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandStrip, { desk }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Activations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: "A finished checkout leaves simulation and is logged here as live."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: desk.activations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-4 py-6 text-sm text-muted",
							children: "No territory has gone live yet."
						}) : desk.activations.map((activation) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [activation.businessName, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [" · ", activation.planName]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [
									"Live · ",
									activation.amountCents === 0 ? "$0 today" : formatMoney(activation.amountCents),
									" ·",
									" ",
									when(activation.createdAt)
								]
							})]
						}, activation.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Tenants"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (event) => onQuery(event.target.value),
						placeholder: "Search name, trade, status",
						"aria-label": "Search shops",
						className: "w-full sm:max-w-xs"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
					children: shops.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-4 py-6 text-sm text-muted",
						children: "No shops match."
					}) : shops.map((shop) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium",
								children: shop.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-sm text-muted",
								children: [
									shop.niche,
									" · ",
									shop.status,
									shop.ownerEmail ? ` · ${shop.ownerEmail}` : ""
								]
							})]
						}), shop.showcase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/$shopSlug/admin",
							params: { shopSlug: shop.slug },
							className: "inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm text-muted hover:text-fg",
							children: ["Preview ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
								className: "size-4",
								"aria-hidden": true
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/$shopSlug/admin",
							params: { shopSlug: shop.slug },
							search: { desk: "master" },
							onClick: () => {
								recordMasterDeskOpen({ data: shop.slug }).catch(() => void 0);
							},
							className: "inline-flex h-11 items-center gap-1 rounded-xl bg-fg px-3 text-sm font-medium text-bg",
							children: ["Open desk ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
								className: "size-4",
								"aria-hidden": true
							})]
						})]
					}, shop.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Live wire"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 max-h-[28rem] space-y-2 overflow-auto",
					children: desk.events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted",
						children: "No shop events yet."
					}) : desk.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-xl bg-surface px-3 py-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: event.shopName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								event.type.split("_").join(" "),
								" · ",
								when(event.createdAt)
							]
						})]
					}, event.id))
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutreachEngine, {
				onLaunched: onRefresh,
				mode: desk.outreach.mode,
				intervalSeconds: desk.outreach.intervalSeconds,
				chunkSize: desk.outreach.chunkSize,
				trades: desk.attribution
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BulkIngest, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrategicFunnel, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelTool, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Attribution"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: "Visits record the lead slug, county, and utm source. A shop created from that link marks the business claimed."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: regionQuery,
						onChange: (event) => setRegionQuery(event.target.value),
						placeholder: "Search county or trade",
						"aria-label": "Search regions",
						className: "mt-4 max-w-sm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-6 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
							children: regions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "px-4 py-6 text-sm text-muted",
								children: "No regional lists yet."
							}) : regions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 px-4 py-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									row.county,
									" · ",
									row.tradeLabel || NICHES[row.tradeType]?.label || row.tradeType
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [
										row.hits,
										" visits · ",
										row.claimed,
										"/",
										row.leads,
										" claimed"
									]
								})]
							}, `${row.county}-${row.tradeType}`))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: desk.hits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted",
								children: "No visits yet."
							}) : desk.hits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-xl bg-surface px-3 py-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: hit.leadSlug || "unscoped visit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted",
									children: [
										hit.county || "no county",
										" · ",
										hit.utmSource || "no source",
										hit.becameShop ? " · became a shop" : "",
										" · ",
										when(hit.createdAt)
									]
								})]
							}, hit.id))
						})]
					})
				]
			})
		]
	});
}
function contactLine(lead) {
	const parts = [lead.contactPhone, lead.contactEmail].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : "No contact on file";
}
function TradeSelect({ value, onChange, allowAll = false, extra = [] }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const needle = query.trim().toLowerCase();
	const options = [...NICHE_ORDER.map((niche) => ({
		value: niche,
		label: NICHES[niche].label
	})), ...extra.filter((item) => !isShopNiche(item.value))].filter((item) => !needle || item.label.toLowerCase().includes(needle) || item.value.includes(needle));
	const selected = value === "all" || options.some((item) => item.value === value) ? value : allowAll ? "all" : value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: query,
			onChange: (event) => setQuery(event.target.value),
			placeholder: "Search trades",
			"aria-label": "Search trades"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			value: selected,
			onChange: (event) => onChange(event.target.value),
			className: "h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
			"aria-label": "Trade",
			children: [
				allowAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "all",
					children: "All trades"
				}) : null,
				options.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: item.value,
					children: item.label
				}, item.value)),
				selected !== "all" && !options.some((item) => item.value === selected) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: selected,
					children: nicheLabel(selected)
				}) : null
			]
		})]
	});
}
var draftClass = "w-full rounded-xl bg-surface px-3 py-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] outline-none focus:shadow-[0_0_0_2px_var(--color-accent)]";
var selectClass = "h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]";
function OutreachEngine({ onLaunched, mode, intervalSeconds, chunkSize, trades }) {
	const opening = outreachStrategy("done-for-you");
	const [county, setCounty] = (0, import_react.useState)("");
	const [trade, setTrade] = (0, import_react.useState)("location");
	const [leadQuery, setLeadQuery] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("name");
	const [strategy, setStrategy] = (0, import_react.useState)(opening.id);
	const [text, setText] = (0, import_react.useState)(opening.text);
	const [emailSubject, setEmailSubject] = (0, import_react.useState)(opening.emailSubject);
	const [emailBody, setEmailBody] = (0, import_react.useState)(opening.emailBody);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [smartTiming, setSmartTiming] = (0, import_react.useState)(false);
	const leads = preview?.leads ?? [];
	const countyKey = county.trim().toLowerCase();
	const tradeOptions = trades.filter((item) => !countyKey || item.county.toLowerCase() === countyKey).map((item) => ({
		value: item.tradeType,
		label: item.tradeLabel || nicheLabel(item.tradeType)
	}));
	const visibleLeads = sortLeads(leads.filter((lead) => {
		const needle = leadQuery.trim().toLowerCase();
		if (!needle) return true;
		return [
			lead.businessName,
			lead.city,
			lead.tradeLabel,
			lead.county
		].join(" ").toLowerCase().includes(needle);
	}), sort);
	const active = leads.find((lead) => lead.leadSlug === selected) ?? leads.find((lead) => !lead.claimed) ?? leads[0];
	const unclaimed = leads.filter((lead) => !lead.claimed);
	const smsReady = unclaimed.filter((lead) => isSmsReady(lead.phoneLine)).length;
	const emailReady = unclaimed.filter((lead) => isEmailReady(lead.contactEmail)).length;
	const activeLoops = leads.reduce((count, lead) => count + (lead.followUps ?? []).filter((loop) => loop.status === "active").length, 0);
	const phrases = active ? outreachPublicTokens(active, active.businessName) : {
		owner: "{owner}",
		reviews: "{reviews}",
		website: "{website}",
		line: "{line}"
	};
	const tokens = {
		business: active?.businessName ?? "{business}",
		url: active?.url ?? "{url}",
		city: active?.city ?? "{city}",
		county: active?.county || county || "{county}",
		trade: trade === "all" ? active?.tradeLabel || "{trade}" : tradeOptions.find((item) => item.value === trade)?.label || nicheLabel(trade),
		...phrases
	};
	const timingMode = smartTiming ? "smart" : "immediate";
	const timingProfile = trade === "all" ? "mixed" : timingProfileFor(trade);
	const nextWindow = nextSendInstant(/* @__PURE__ */ new Date(), timingMode, timingProfile === "mixed" ? "general" : timingProfile);
	const windowOpen = nextWindow.getTime() <= Date.now() + 3e4;
	const renderedText = renderOutreachMessage(text, tokens);
	const renderedEmail = `${renderOutreachMessage(emailSubject, tokens)}\n\n${renderOutreachMessage(emailBody, tokens)}`;
	function applyStrategy(id) {
		const next = outreachStrategy(id);
		setStrategy(next.id);
		setText(next.text);
		setEmailSubject(next.emailSubject);
		setEmailBody(next.emailBody);
	}
	async function preload() {
		setBusy("preload");
		setNote(null);
		try {
			const result = await preloadRegionalRoster();
			setCounty(result.county);
			setTrade("all");
			const next = await previewOutreach({ data: {
				county: result.county,
				tradeType: "all"
			} });
			setPreview(next);
			setSelected(next.leads.find((lead) => !lead.claimed)?.leadSlug ?? next.leads[0]?.leadSlug ?? "");
			setNote(`Preloaded ${result.inserted} new businesses across ${result.counties.join(", ")}. ${result.skipped} were already on file. ${result.total} leads, ${result.niches} trades. Showing ${result.county}.`);
		} catch (err) {
			setNote(err instanceof Error ? err.message : "Could not preload the region");
		} finally {
			setBusy(null);
		}
	}
	async function load() {
		setBusy("load");
		setNote(null);
		try {
			const next = await previewOutreach({ data: {
				county,
				tradeType: trade
			} });
			setPreview(next);
			setSelected(next.leads.find((lead) => !lead.claimed)?.leadSlug ?? next.leads[0]?.leadSlug ?? "");
			if (next.leads.length === 0) setNote("No businesses saved for that county and trade.");
		} catch (err) {
			setNote(err instanceof Error ? err.message : "Could not load leads");
		} finally {
			setBusy(null);
		}
	}
	async function launch(channel) {
		setBusy(channel);
		setNote(null);
		try {
			const result = await launchOutreachBatch({ data: {
				county,
				tradeType: trade,
				strategy,
				text,
				emailSubject,
				emailBody,
				channel,
				timing: smartTiming ? "smart" : "immediate"
			} });
			const next = await previewOutreach({ data: {
				county,
				tradeType: trade
			} });
			setPreview(next);
			const hook = outreachStrategy(result.strategy).label;
			const kind = result.channel === "sms" ? "SMS-ready" : "email-ready";
			const skipped = result.skippedClicked > 0 ? ` ${result.skippedClicked} already opened their link and were left out.` : "";
			const looping = result.alreadyLooping > 0 ? ` ${result.alreadyLooping} already had an active loop.` : "";
			const loops = result.enrolled === 1 ? "1 nurture loop" : `${result.enrolled} nurture loops`;
			const chunks = result.chunks === 1 ? "1 chunk" : `${result.chunks} chunks`;
			const safety = result.mode === "live" ? "Live mode. Twilio and Resend were present, and each chunk sends on its own timer." : "Simulation mode. Each chunk is written to the live wire. No email or SMS is sent.";
			const heldUntil = result.firstAt ? new Date(result.firstAt) : null;
			const held = heldUntil != null && heldUntil.getTime() > Date.now() + 5e3;
			const first = result.released > 0 ? "The first chunk is on the wire." : held && heldUntil ? `Dispatch stays queued until ${formatSendSlot(heldUntil)}.` : "The first chunk waits for the current trickle gap.";
			const hours = result.timing === "smart" ? "Smart timing holds each trade for its own hours." : "Weekday hours hold the queue until Monday–Thursday, 8:00 AM–7:00 PM Pacific.";
			setNote(`Queued ${result.leadCount} ${kind} in ${result.county} with ${hook}. ${loops} scheduled through Day 6. ${chunks}, ${result.intervalSeconds} seconds apart. ${safety} ${hours} ${first}${skipped}${looping}`);
			onLaunched();
		} catch (err) {
			setNote(err instanceof Error ? err.message : "Could not log the batch");
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.22em] text-muted",
				children: "Outreach"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl leading-none",
				children: "Autonomous outreach campaign engine"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-sm text-muted",
				children: "Pick a county, a trade, and a hook. Each lead's owner, reviews, website, and phone line fill the text and the email."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: mode === "live" ? `Live mode. Chunks of ${chunkSize} leave ${intervalSeconds} seconds apart, and only after Twilio and Resend are configured.` : `Simulation mode. Chunks of ${chunkSize} are logged ${intervalSeconds} seconds apart. Providers are not called.`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: "County or region",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: county,
							onChange: (event) => setCounty(event.target.value),
							placeholder: "Jackson County",
							list: "home-region-counties"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "home-region-counties",
							children: HOME_REGION_COUNTIES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: name }, name))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Trade",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeSelect, {
							value: trade,
							onChange: setTrade,
							allowAll: true,
							extra: tradeOptions
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							disabled: busy !== null,
							onClick: () => void load(),
							children: busy === "load" ? "Loading" : "Load leads"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							disabled: busy !== null,
							onClick: () => void preload(),
							children: busy === "preload" ? "Preloading" : `Preload ${HOME_REGION_LABEL}`
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-[1fr_12rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: leadQuery,
					onChange: (event) => setLeadQuery(event.target.value),
					placeholder: "Search name, city, or trade",
					"aria-label": "Search leads"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: sort,
					onChange: (event) => setSort(event.target.value),
					className: selectClass,
					"aria-label": "Sort leads",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "name",
							children: "Sort by name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "city",
							children: "Sort by city"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "trade",
							children: "Sort by trade"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] gap-3 px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted md:grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Business" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "City" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Funnel" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Contact" })
					]
				}), leads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-6 text-sm text-muted",
					children: "Load a county and trade to see the businesses on file."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line",
					children: visibleLeads.map((lead) => {
						const on = lead.leadSlug === active?.leadSlug;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "px-4 py-3",
							style: on ? { boxShadow: "inset 2px 0 0 var(--color-accent)" } : void 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSelected(lead.leadSlug),
								className: "grid w-full gap-1 text-left md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] md:gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-medium",
										children: [
											lead.businessName,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 text-muted",
												children: lead.tradeLabel
											}),
											lead.claimed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 text-muted",
												children: "Claimed"
											}) : null
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted",
										children: lead.city
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "break-all text-sm text-muted",
										children: lead.url
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "break-all text-sm text-muted",
										children: contactLine(lead)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex flex-wrap gap-1 md:col-span-4",
										children: [leadChannelTags(lead).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full px-2 py-0.5 text-xs text-fg shadow-[0_0_0_1px_var(--color-accent)]",
											children: tag
										}, tag)), leadPublicTags(lead).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full px-2 py-0.5 text-xs text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.12)]",
											children: tag
										}, tag))]
									}),
									(lead.followUps ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid gap-2 md:col-span-4",
										children: (lead.followUps ?? []).map((loop) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "grid gap-1 rounded-xl bg-bg px-3 py-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs uppercase tracking-[0.16em] text-muted",
													children: loopTitle(loop)
												}),
												loop.status === "stopped" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm text-muted",
													children: "Opened the booking link. Later touches are off."
												}) : null,
												loop.touches.map((touch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-baseline justify-between gap-3 text-sm",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: touch.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "shrink-0 text-muted",
														children: touchWhen(touch)
													})]
												}, touch.day))
											]
										}, loop.id))
									}) : null
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: pitchHref(lead),
									target: "_blank",
									rel: "noreferrer",
									className: "inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-accent px-5 text-[15px] font-medium text-bg sm:w-auto",
									children: "🎩 In-Person Magic Trick"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs uppercase tracking-[0.16em] text-muted",
									children: lead.accountMode === "live" ? "Live" : "Simulation"
								})]
							})]
						}, lead.leadSlug);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-3",
				children: OUTREACH_STRATEGIES.map((item) => {
					const on = item.id === strategy;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": on,
						onClick: () => applyStrategy(item.id),
						className: "rounded-2xl bg-surface px-4 py-3 text-left",
						style: { boxShadow: on ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: item.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: item.line
						})]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-faint",
				children: "Use {business}, {owner}, {city}, {county}, {trade}, {reviews}, {website}, {line}, and {url}."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Text",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: text,
							onChange: (event) => setText(event.target.value),
							rows: 4,
							className: draftClass
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DraftPreview, {
						label: active ? `Text · ${active.businessName}` : "Text preview",
						body: renderedText
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid content-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email subject",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: emailSubject,
								onChange: (event) => setEmailSubject(event.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: emailBody,
								onChange: (event) => setEmailBody(event.target.value),
								rows: 6,
								className: draftClass
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DraftPreview, {
							label: active ? `Email · ${active.businessName}` : "Email preview",
							body: renderedEmail
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.16em] text-muted",
								children: "SMS-ready"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-display text-4xl leading-none",
								children: preview ? smsReady : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Unclaimed mobile lines"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.16em] text-muted",
								children: "Email-ready"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-display text-4xl leading-none",
								children: preview ? emailReady : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Unclaimed addresses that parse"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.16em] text-muted",
								children: "Active loops"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-display text-4xl leading-none",
								children: preview ? activeLoops : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Day 0 leaves with its chunk"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-pressed": smartTiming,
				onClick: () => setSmartTiming((on) => !on),
				className: "mt-4 w-full rounded-2xl bg-surface px-4 py-4 text-left",
				style: { boxShadow: smartTiming ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-muted",
						children: "Smart Timing Mode"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm font-medium",
						children: smartTiming ? "On" : "Off"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: sendWindowBlurb(timingMode, timingProfile)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-fg",
						children: smartTiming && trade === "all" ? "A mixed list holds each business for its own window." : windowOpen ? "The window is open. Chunks can leave on the trickle timer." : `Next window opens ${formatSendSlot(nextWindow)}.`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					disabled: busy !== null || emailReady === 0,
					onClick: () => void launch("email"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
						className: "size-4",
						"aria-hidden": true
					}), busy === "email" ? "Queuing" : "Launch Email Batch"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "secondary",
					disabled: busy !== null || smsReady === 0,
					onClick: () => void launch("sms"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
						className: "size-4",
						"aria-hidden": true
					}), busy === "sms" ? "Queuing" : "Launch SMS Batch"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: preview == null ? "Load a county to sort the list into channels." : "A mobile line is SMS-ready. A real address is email-ready. A launch queues chunks instead of sending the list at once. Day 3 and Day 6 wait for the same hours as the batch. Only the private link in the message stops that lead. Simulation only writes the live wire."
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: note
			}) : null
		]
	});
}
function loopTitle(loop) {
	const channel = loop.channel === "sms" ? "SMS" : "Email";
	const status = loop.status === "stopped" ? "Stopped" : loop.status === "complete" ? "Complete" : "Active";
	const hook = loop.strategy ? outreachStrategy(loop.strategy).label : "";
	return `${channel} nurture · ${status}${hook ? ` · ${hook}` : ""}`;
}
function touchWhen(touch) {
	if (touch.status === "sent") return "Sent";
	if (touch.status === "skipped") return "Skipped";
	const date = new Date(touch.scheduledAt);
	if (Number.isNaN(date.getTime())) return "Scheduled";
	return `Scheduled ${date.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	})}`;
}
function DraftPreview({ label, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1.5 text-xs font-medium tracking-wide text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
		className: "min-h-28 whitespace-pre-wrap rounded-xl bg-surface px-3 py-3 font-sans text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: body
	})] });
}
function emptyImport() {
	return {
		leads: [],
		invalid: [],
		invalidCount: 0,
		merged: 0,
		inserted: 0,
		updated: 0,
		unchanged: 0
	};
}
function foldImport(into, next) {
	into.inserted += next.inserted;
	into.updated += next.updated;
	into.unchanged += next.unchanged;
	into.merged += next.merged;
	into.invalidCount += next.invalidCount ?? next.invalid.length;
	for (const row of next.invalid) if (into.invalid.length < 40) into.invalid.push(row);
}
function snapshotImport(totals) {
	return {
		...totals,
		leads: [],
		invalid: [...totals.invalid]
	};
}
async function sendImportBatch(chunk, totals, batch, setProgress, setResult) {
	setProgress(`Staging batch ${batch.toLocaleString()} · ${IMPORT_BATCH.toLocaleString()} rows at a time`);
	foldImport(totals, await importBulkLeads({ data: { leads: chunk } }));
	setResult(snapshotImport(totals));
}
async function importText(body, totals, setProgress, setResult) {
	let batch = 0;
	for (const chunk of leadCsvChunks(body)) {
		batch += 1;
		await sendImportBatch(chunk, totals, batch, setProgress, setResult);
	}
}
async function importFile(file, totals, setProgress, setResult) {
	const reader = file.stream().getReader();
	const decoder = new TextDecoder();
	const parser = createLeadCsvReader();
	let batch = 0;
	for (;;) {
		const { value, done } = await reader.read();
		const piece = decoder.decode(value ?? /* @__PURE__ */ new Uint8Array(), { stream: !done });
		for (const chunk of parser.push(piece)) {
			batch += 1;
			await sendImportBatch(chunk, totals, batch, setProgress, setResult);
		}
		if (done) break;
	}
	const tail = parser.finish();
	if (tail.length > 0) {
		batch += 1;
		await sendImportBatch(tail, totals, batch, setProgress, setResult);
	}
}
function fileSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
function BulkIngest() {
	const [csv, setCsv] = (0, import_react.useState)("");
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [fileBytes, setFileBytes] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	async function loadFile(file) {
		if (!file) return;
		const name = file.name.toLowerCase();
		const textType = file.type === "" || file.type.startsWith("text/") || file.type.includes("csv");
		if (!name.endsWith(".csv") && !textType) {
			setError("Choose a .csv file");
			return;
		}
		setError(null);
		setResult(null);
		setFileName(file.name);
		if (file.size > 4e5) {
			fileRef.current = file;
			setFileBytes(file.size);
			setCsv("");
			return;
		}
		fileRef.current = null;
		setFileBytes(0);
		setCsv(await file.text());
	}
	async function run() {
		const file = fileRef.current;
		const body = csv.trim();
		if (!file && !body) {
			setError("Paste a CSV or choose a file");
			return;
		}
		setBusy("import");
		setError(null);
		setProgress("");
		const totals = emptyImport();
		try {
			if (file) await importFile(file, totals, setProgress, setResult);
			else await importText(body, totals, setProgress, setResult);
			if (totals.inserted + totals.updated + totals.unchanged + totals.invalidCount + totals.merged === 0) setError("That file had no rows");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setBusy(null);
			setProgress("");
		}
	}
	async function sweep() {
		setBusy("sweep");
		setError(null);
		setProgress("");
		const totals = emptyImport();
		try {
			let offset = 0;
			for (;;) {
				const next = await importRegistrySweep({ data: { offset } });
				foldImport(totals, next);
				setResult(snapshotImport(totals));
				setProgress(`${next.county} · ${next.nextOffset.toLocaleString()} of ${next.total.toLocaleString()}`);
				const previous = offset;
				offset = next.nextOffset;
				if (next.done || offset <= previous) break;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sweep failed");
		} finally {
			setBusy(null);
			setProgress("");
		}
	}
	const invalid = result?.invalid ?? [];
	const invalidCount = result?.invalidCount ?? invalid.length;
	const shown = invalid.slice(0, 40);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Bulk lead ingestion"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: [
					"Upload a .csv or paste the sheet. Columns: Business, City, County, Niche, Email, Phone, Website. A county file is staged in batches of ",
					IMPORT_BATCH.toLocaleString(),
					", then moved into the live list. Filing titles such as Electrical, Plumbing, Firewood, Lock, Handyman, and Sole proprietor land on the matching niche. Sweep Florida registry loads ",
					SWEEP_PER_COUNTY.toLocaleString(),
					" filings in Miami-Dade, Broward, Palm Beach, Hillsborough, Orange, and Duval. A claimed or live business stays as it is."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: "CSV file",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".csv,text/csv,text/plain",
							className: "block w-full text-sm text-muted file:mr-3 file:h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-medium file:text-fg",
							onChange: (event) => {
								const file = event.target.files?.[0];
								loadFile(file);
								event.target.value = "";
							}
						}), fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: fileBytes > 0 ? `${fileName} (${fileSize(fileBytes)}) imports in batches of ${IMPORT_BATCH.toLocaleString()} and stays out of the box below.` : `${fileName} is in the box below. Edit it, then run the import.`
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Or paste CSV",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: csv,
							onChange: (event) => {
								setCsv(event.target.value);
								fileRef.current = null;
								setFileBytes(0);
								setResult(null);
							},
							rows: 10,
							spellCheck: false,
							placeholder: "Business,City,County,Niche,Email,Phone,Website",
							className: "min-h-56 w-full resize-y rounded-xl bg-surface px-3 py-3 text-base text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] placeholder:text-muted",
							"aria-label": "CSV text"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: busy !== null || csv.trim().length === 0 && fileBytes === 0,
								onClick: () => void run(),
								children: busy === "import" ? "Importing" : "Run Bulk Import"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								disabled: busy !== null,
								onClick: () => void sweep(),
								children: busy === "sweep" ? "Sweeping Florida" : "Sweep Florida registry"
							}),
							progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "w-full text-sm text-muted",
								children: progress
							}) : null
						]
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: "Inserted",
								value: result.inserted.toLocaleString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: "Updated",
								value: result.updated.toLocaleString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: "Unchanged",
								value: result.unchanged.toLocaleString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: "Invalid",
								value: invalidCount.toLocaleString()
							})
						]
					}),
					result.merged > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: [
							result.merged.toLocaleString(),
							" repeated ",
							result.merged === 1 ? "business was" : "businesses were",
							" folded into one row."
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.18em] text-muted",
								children: "Invalid rows"
							}),
							invalidCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Every row was usable."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 max-h-64 space-y-2 overflow-auto text-sm",
								children: shown.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: ["Line ", row.line]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-fg",
									children: [" · ", row.reason]
								})] }, `${row.line}-${row.reason}`))
							}),
							invalidCount > shown.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted",
								children: [
									(invalidCount - shown.length).toLocaleString(),
									" more invalid ",
									invalidCount - shown.length === 1 ? "row" : "rows",
									" were left out of this list."
								]
							}) : null
						]
					})
				]
			}) : null
		]
	});
}
function StrategicFunnel() {
	const [businessName, setBusinessName] = (0, import_react.useState)("");
	const [niche, setNiche] = (0, import_react.useState)(NICHE_ORDER[0] ?? "trade");
	const [contact, setContact] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("");
	const [path, setPath] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const load = () => {
			listOutreachFunnels().then((next) => {
				if (!stop) setRows(next);
			}).catch(() => void 0);
		};
		load();
		const timer = window.setInterval(load, 5e3);
		return () => {
			stop = true;
			window.clearInterval(timer);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Strategic outreach"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: "One prospect, one preview. The link opens their niche with a before-and-after sample and the claim button. Nothing is emailed from here."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				onSubmit: (event) => {
					event.preventDefault();
					setBusy(true);
					setNote(null);
					setCopied(false);
					createOutreachFunnel({ data: {
						businessName,
						niche,
						contact,
						city
					} }).then(async (result) => {
						setPath(result.path);
						setBusinessName("");
						setContact("");
						setCity("");
						const next = await listOutreachFunnels();
						setRows(next);
					}).catch((err) => setNote(err instanceof Error ? err.message : "Could not build the link")).finally(() => setBusy(false));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Business",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: businessName,
							onChange: (event) => setBusinessName(event.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Niche",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: niche,
							onChange: (event) => setNiche(event.target.value),
							className: "h-10 rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
							"aria-label": "Niche",
							children: NICHE_ORDER.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: id,
								children: NICHES[id].label
							}, id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Email or phone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: contact,
							onChange: (event) => setContact(event.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "City",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: city,
							onChange: (event) => setCity(event.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-2 lg:col-span-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy,
							children: busy ? "Building" : "Generate preview link"
						})
					})
				]
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: note
			}) : null,
			path ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "break-all text-sm",
					children: path
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-sm text-muted",
					onClick: () => {
						navigator.clipboard.writeText(window.location.origin + path).then(() => {
							setCopied(true);
						});
					},
					children: copied ? "Copied" : "Copy link"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[40rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Prospect"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Niche"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Contact"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Opened"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Tested"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Subscriber"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-4 text-muted",
						colSpan: 6,
						children: "No desk funnels yet."
					}) }) : rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-3 pr-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: row.path,
									className: "font-medium hover:underline",
									children: row.businessName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block text-muted",
									children: row.city
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-3",
								children: row.niche
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-3",
								children: row.contact
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-3",
								children: row.opened ? "Yes" : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-3",
								children: row.tested ? "Yes" : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: row.converted ? "Yes" : "—"
							})
						]
					}, row.leadSlug)) })]
				})
			})
		]
	});
}
function FunnelTool() {
	const [county, setCounty] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [businessName, setBusinessName] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("");
	const [contactPhone, setContactPhone] = (0, import_react.useState)("");
	const [contactEmail, setContactEmail] = (0, import_react.useState)("");
	const [contactName, setContactName] = (0, import_react.useState)("");
	const [reviewScore, setReviewScore] = (0, import_react.useState)("");
	const [reviewCount, setReviewCount] = (0, import_react.useState)("");
	const [hasWebsite, setHasWebsite] = (0, import_react.useState)("");
	const [phoneLine, setPhoneLine] = (0, import_react.useState)("");
	const [links, setLinks] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	async function addLead() {
		setBusy("add");
		setNote(null);
		try {
			const saved = await addPreloadedLeads({ data: { leads: [{
				businessName,
				tradeType: category,
				city,
				county,
				contactPhone,
				contactEmail,
				contactName,
				reviewScore,
				reviewCount,
				hasWebsite,
				phoneLine
			}] } });
			setBusinessName("");
			setCity("");
			setContactPhone("");
			setContactEmail("");
			setContactName("");
			setReviewScore("");
			setReviewCount("");
			setHasWebsite("");
			setPhoneLine("");
			setNote(`Saved ${saved.leads[0]?.leadSlug ?? "lead"}.`);
		} catch (err) {
			setNote(err instanceof Error ? err.message : "Could not save");
		} finally {
			setBusy(null);
		}
	}
	async function generate() {
		setBusy("gen");
		setNote(null);
		setCopied(false);
		try {
			const next = await generateRegionalFunnel({ data: {
				county,
				tradeType: category
			} });
			setLinks(next);
			setNote(next.links.length === 0 ? "No unclaimed businesses in that county and trade." : null);
		} catch (err) {
			setNote(err instanceof Error ? err.message : "Could not build links");
		} finally {
			setBusy(null);
		}
	}
	const blob = links?.links.map((link) => link.url).join("\n") ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Regional funnel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: "Save businesses, then print a link for each unclaimed one. The link is yourplatform.com/?b=their-slug, with the county attached."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "County",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: county,
							onChange: (event) => setCounty(event.target.value),
							placeholder: "Grand County"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: "Category",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: category,
							onChange: (event) => setCategory(event.target.value),
							placeholder: "Dog walking, HVAC, Barber…",
							list: "trade-categories",
							"aria-label": "Category"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "trade-categories",
							children: NICHE_ORDER.map((niche) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: NICHES[niche].label }, niche))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Business",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: businessName,
							onChange: (event) => setBusinessName(event.target.value),
							placeholder: "River Bend"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "City",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: city,
							onChange: (event) => setCity(event.target.value),
							placeholder: "Moab"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Phone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: contactPhone,
							onChange: (event) => setContactPhone(event.target.value),
							placeholder: "Optional"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Email",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: contactEmail,
							onChange: (event) => setContactEmail(event.target.value),
							placeholder: "Optional"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Owner",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: contactName,
							onChange: (event) => setContactName(event.target.value),
							placeholder: "Luis Ortega"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Review score",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: reviewScore,
							onChange: (event) => setReviewScore(event.target.value),
							placeholder: "4.8",
							inputMode: "decimal"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Review count",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: reviewCount,
							onChange: (event) => setReviewCount(event.target.value),
							placeholder: "126",
							inputMode: "numeric"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Website",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: hasWebsite,
							onChange: (event) => setHasWebsite(event.target.value),
							className: selectClass,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Unknown"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "yes",
									children: "Has website"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "no",
									children: "No website"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Phone line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: phoneLine,
							onChange: (event) => setPhoneLine(event.target.value),
							className: selectClass,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Unknown"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "mobile",
									children: "Mobile"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "landline",
									children: "Landline"
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: busy !== null,
					onClick: () => void addLead(),
					children: busy === "add" ? "Saving" : "Save business"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					disabled: busy !== null,
					onClick: () => void generate(),
					children: busy === "gen" ? "Building" : "Build unclaimed links"
				})]
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: note
			}) : null,
			links && links.links.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [links.links.length, " unclaimed"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-fg",
						onClick: () => {
							navigator.clipboard.writeText(blob).then(() => setCopied(true)).catch(() => setCopied(false));
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
							className: "size-4",
							"aria-hidden": true
						}), copied ? "Copied" : "Copy links"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
					children: links.links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-medium",
							children: [
								link.businessName,
								" · ",
								link.city
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 break-all text-sm text-muted",
							children: link.url
						})]
					}, link.leadSlug))
				})]
			}) : null
		]
	});
}
var PULSE_LABEL = {
	booking_request: "Booking",
	booking_confirmed: "Confirmed",
	payment_received: "Payment",
	audit_request: "Estimate",
	audit_confirmed: "Estimate locked"
};
function PlatformWire() {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [lit, setLit] = (0, import_react.useState)(false);
	const seen = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const primed = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const tick = () => {
			listPlatformPulse().then((next) => {
				if (stop) return;
				const fresh = next.filter((row) => !seen.current.has(row.id));
				for (const row of next) seen.current.add(row.id);
				setRows(next);
				if (!primed.current) {
					primed.current = true;
					return;
				}
				if (fresh.length === 0) return;
				const prefs = readFeedback("master");
				if (prefs.neon) {
					setLit(true);
					window.setTimeout(() => setLit(false), 1600);
				}
				if (prefs.haptics) pulseHaptic("incoming");
			}).catch(() => void 0);
		};
		tick();
		const timer = window.setInterval(tick, 2e3);
		return () => {
			stop = true;
			window.clearInterval(timer);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		children: [
			lit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "axiom-ring",
				"data-state": "alert",
				"aria-hidden": "true"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Live wire"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: "Bookings, payments, and estimates from every shop land here as they happen."
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 max-w-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackToggles, { scope: "master" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-4 py-6 text-sm text-muted",
					children: "No live events yet."
				}) : rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: `px-4 py-3 text-sm ${index === 0 && lit ? "shadow-[inset_3px_0_0_0_#2ee6d6]" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-medium",
						children: [
							PULSE_LABEL[row.type] ?? row.type,
							" · ",
							row.shopName
						]
					}), row.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-line text-muted",
						children: row.detail
					}) : null]
				}, row.id))
			})
		]
	});
}
function CommandStrip({ desk }) {
	const jackson = desk.attribution.filter((row) => row.county.toLowerCase().includes("jackson"));
	const jacksonLeads = jackson.reduce((sum, row) => sum + row.leads, 0);
	const queues = /* @__PURE__ */ new Map();
	for (const row of desk.attribution) {
		const label = row.tradeLabel || row.tradeType;
		queues.set(label, (queues.get(label) ?? 0) + row.leads);
	}
	const splits = [...queues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-6 grid gap-3 lg:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-muted",
						children: "Jackson County"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-3xl tabular",
						children: jacksonLeads.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [jackson.length, " trade queues on the regional list"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-muted",
						children: "Trickle worker"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-3xl capitalize",
						children: desk.outreach.mode
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							desk.outreach.chunkSize,
							" leads every ",
							desk.outreach.intervalSeconds,
							"s · database ",
							desk.database
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.18em] text-muted",
					children: "Niche queues"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm",
					children: splits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "No regional lists yet."
					}) : splits.map(([label, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular text-muted",
							children: count.toLocaleString()
						})]
					}, label))
				})]
			})
		]
	});
}
function Kpi({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.18em] text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-display text-3xl",
			children: value
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1.5 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function when(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString(void 0, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
//#endregion
export { MasterAdminPage as component };
