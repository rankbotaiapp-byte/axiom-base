import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc--phiu8Av.mjs";
import { a as newId } from "./utils-BkNFIPfO.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { t as classifyFiling } from "./directory-LRUyGbzu.mjs";
import { l as isLeadSlug, p as leadSlugFrom, x as parsePhoneLine } from "./funnel-DCLKTLeU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bulk-import-CKJr0_35.js
/**
* Rows staged and promoted in one transaction.
* 1,000 rows × 14 columns stays under Postgres' 65,535-parameter limit.
*/
var IMPORT_BATCH = 1e3;
var INVALID_SAMPLE = 40;
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
function* leadCsvChunks(text, size = IMPORT_BATCH) {
	const reader = createLeadCsvReader(size);
	for (const batch of reader.push(text.replace(/^\uFEFF/, "").trim())) yield batch;
	const tail = reader.finish();
	if (tail.length > 0) yield tail;
}
function prepareBulkImport(records) {
	const invalid = [];
	const bySlug = /* @__PURE__ */ new Map();
	let merged = 0;
	records.forEach((record, index) => {
		const line = record.line ?? index + 1;
		const prepared = prepareOne(record, line);
		if (!prepared.ok) {
			invalid.push({
				line,
				reason: prepared.reason
			});
			return;
		}
		const previous = bySlug.get(prepared.lead.leadSlug);
		if (previous) {
			merged += 1;
			bySlug.set(prepared.lead.leadSlug, mergeLead(previous, prepared.lead));
			return;
		}
		bySlug.set(prepared.lead.leadSlug, prepared.lead);
	});
	return {
		leads: [...bySlug.values()],
		invalid,
		merged
	};
}
async function upsertPreloadedLeads(leads) {
	let inserted = 0;
	let updated = 0;
	let unchanged = 0;
	let shape = "full";
	for (let offset = 0; offset < leads.length; offset += IMPORT_BATCH) {
		const outcome = await stageChunk(leads.slice(offset, offset + IMPORT_BATCH), shape);
		shape = outcome.shape;
		inserted += outcome.inserted;
		updated += outcome.updated;
		unchanged += outcome.unchanged;
	}
	return {
		inserted,
		updated,
		unchanged
	};
}
var importBulkLeads_createServerFn_handler = createServerRpc({
	id: "9b3f2539fb5ca19bc4bb704461db11a7eb5410ae35c8fdf12dee420be9f8253f",
	name: "importBulkLeads",
	filename: "src/lib/axiom/bulk-import.ts"
}, (opts) => importBulkLeads.__executeServer(opts));
var importBulkLeads = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const csv = typeof input?.csv === "string" ? input.csv : "";
	const leads = Array.isArray(input?.leads) ? input.leads : [];
	if (!csv.trim() && leads.length === 0) throw new Error("Add a CSV or a list of businesses");
	return {
		csv,
		leads
	};
}).handler(importBulkLeads_createServerFn_handler, async ({ data, context }) => {
	const { assertPlatformOwner } = await import("./platform-owner.server-DcNyU0Zn.mjs");
	const { getSql } = await import("./db-BbGQAJUy.mjs").then((n) => n.n).then((n) => n.n);
	await assertPlatformOwner(context.userId);
	await sweepOldStaging(await getSql());
	const totals = emptyResult();
	if (data.csv.trim()) for (const chunk of leadCsvChunks(data.csv)) await takeChunk(chunk, totals);
	for (let offset = 0; offset < data.leads.length; offset += IMPORT_BATCH) await takeChunk(data.leads.slice(offset, offset + IMPORT_BATCH), totals);
	return totals;
});
var importRegistrySweep_createServerFn_handler = createServerRpc({
	id: "062ec43077c61b4e853c93f445a3eca84f8ebd2249364864881a9554f91c12fa",
	name: "importRegistrySweep",
	filename: "src/lib/axiom/bulk-import.ts"
}, (opts) => importRegistrySweep.__executeServer(opts));
var importRegistrySweep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const offset = Number(input?.offset ?? 0);
	if (!Number.isFinite(offset) || offset < 0) throw new Error("Sweep offset is not usable");
	return { offset: Math.floor(offset) };
}).handler(importRegistrySweep_createServerFn_handler, async ({ data, context }) => {
	const { assertPlatformOwner } = await import("./platform-owner.server-DcNyU0Zn.mjs");
	await assertPlatformOwner(context.userId);
	return runRegistrySweepBatch(data.offset);
});
async function runRegistrySweepBatch(offset) {
	const { getSql } = await import("./db-BbGQAJUy.mjs").then((n) => n.n).then((n) => n.n);
	const { registryCountyAt, registrySweepSlice, registrySweepTotal } = await import("./registry-sweep-D2T9j1xV.mjs");
	await sweepOldStaging(await getSql());
	const total = registrySweepTotal();
	const rows = registrySweepSlice(offset, IMPORT_BATCH);
	const totals = emptyResult();
	await takeChunk(rows, totals);
	const nextOffset = offset + rows.length;
	return {
		...totals,
		nextOffset,
		total,
		done: nextOffset >= total,
		county: registryCountyAt(offset)
	};
}
function emptyResult() {
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
async function takeChunk(records, totals) {
	if (records.length === 0) return;
	const plan = prepareBulkImport(records);
	totals.merged += plan.merged;
	totals.invalidCount += plan.invalid.length;
	for (const row of plan.invalid) if (totals.invalid.length < INVALID_SAMPLE) totals.invalid.push(row);
	if (plan.leads.length === 0) return;
	const written = await upsertPreloadedLeads(plan.leads);
	totals.inserted += written.inserted;
	totals.updated += written.updated;
	totals.unchanged += written.unchanged;
}
async function sweepOldStaging(sql) {
	try {
		await sql.query("delete from preloaded_leads_staging where created_at < now() - interval '1 day'");
	} catch (err) {
		if (!missingRelation(err, "preloaded_leads_staging")) throw err;
	}
}
async function stageChunk(chunk, shape) {
	const { withTransaction } = await import("./db-BbGQAJUy.mjs").then((n) => n.n).then((n) => n.n);
	const batchId = newId("batch");
	const ids = chunk.map(() => newId("lead"));
	try {
		return {
			...await withTransaction(async (tx) => {
				await insertStaging(tx, batchId, chunk, ids);
				const rows = await promoteStaging(tx, batchId, shape);
				await tx.query("delete from preloaded_leads_staging where batch_id = $1", [batchId]);
				return tally(ids, rows, chunk.length);
			}),
			shape
		};
	} catch (err) {
		if (missingRelation(err, "preloaded_leads_staging")) throw new Error("Lead staging is not ready. Apply the latest database migration, then import again.");
		if (shape === "full" && missingColumn(err, "website")) return stageChunk(chunk, "no-website");
		if (shape !== "core" && (missingColumn(err, "source") || missingColumn(err, "account_mode") || missingColumn(err, "trade_label"))) return stageChunk(chunk, "core");
		throw err;
	}
}
async function insertStaging(sql, batchId, chunk, ids) {
	const columns = [
		"id",
		"batch_id",
		"business_name",
		"trade_type",
		"trade_label",
		"city",
		"county",
		"lead_slug",
		"contact_email",
		"contact_phone",
		"website",
		"has_website",
		"phone_line",
		"source"
	];
	const width = columns.length;
	const params = [];
	const tuples = chunk.map((lead, index) => {
		const values = [
			ids[index],
			batchId,
			lead.businessName,
			lead.tradeType,
			lead.tradeLabel,
			lead.city,
			lead.county,
			lead.leadSlug,
			lead.contactEmail,
			lead.contactPhone,
			lead.website,
			lead.hasWebsite,
			lead.phoneLine,
			"import"
		];
		params.push(...values);
		return `(${values.map((_, column) => `$${index * width + column + 1}`).join(", ")})`;
	});
	await sql.query(`insert into preloaded_leads_staging (${columns.join(", ")})
     values ${tuples.join(", ")}
     on conflict (batch_id, lead_slug) do update set
       business_name = excluded.business_name,
       trade_type = excluded.trade_type,
       trade_label = excluded.trade_label,
       city = excluded.city,
       county = excluded.county,
       contact_email = excluded.contact_email,
       contact_phone = excluded.contact_phone,
       website = excluded.website,
       has_website = excluded.has_website,
       phone_line = excluded.phone_line,
       source = excluded.source`, params);
}
async function promoteStaging(sql, batchId, shape) {
	const rich = shape !== "core";
	const columns = [
		"id",
		"business_name",
		"trade_type",
		...rich ? ["trade_label"] : [],
		"city",
		"county",
		"lead_slug",
		"claimed",
		"contact_email",
		"contact_phone",
		"has_website",
		"phone_line",
		...rich ? ["source"] : [],
		...shape === "full" ? ["website"] : []
	];
	const select = columns.map((column) => column === "claimed" ? "false" : column).join(", ");
	const assignments = [
		"business_name = excluded.business_name",
		"trade_type = excluded.trade_type",
		...rich ? ["trade_label = excluded.trade_label"] : [],
		"city = excluded.city",
		"county = excluded.county",
		"contact_email = case when excluded.contact_email <> '' then excluded.contact_email else preloaded_leads.contact_email end",
		"contact_phone = case when excluded.contact_phone <> '' then excluded.contact_phone else preloaded_leads.contact_phone end",
		"has_website = coalesce(excluded.has_website, preloaded_leads.has_website)",
		"phone_line = case when excluded.phone_line <> '' then excluded.phone_line else preloaded_leads.phone_line end",
		...shape === "full" ? ["website = case when excluded.website <> '' then excluded.website else preloaded_leads.website end"] : []
	];
	const guard = shape === "core" ? "preloaded_leads.claimed = false" : "preloaded_leads.claimed = false and preloaded_leads.account_mode is distinct from 'live'";
	return sql.query(`insert into preloaded_leads (${columns.join(", ")})
     select ${select}
     from preloaded_leads_staging
     where batch_id = $1
     on conflict (lead_slug) do update set ${assignments.join(", ")}
     where ${guard}
     returning lead_slug, id`, [batchId]);
}
function tally(ids, rows, total) {
	const fresh = new Set(ids);
	let inserted = 0;
	let updated = 0;
	for (const row of rows) if (fresh.has(row.id)) inserted += 1;
	else updated += 1;
	return {
		inserted,
		updated,
		unchanged: total - rows.length
	};
}
function prepareOne(record, line) {
	const businessName = text(record.businessName || record.name, 80);
	const city = text(record.city, 80);
	const county = text(record.county, 80) || city;
	const trade = text(record.trade || record.niche, 80);
	if (businessName.length < 2) return {
		ok: false,
		reason: "Business name is required"
	};
	if (city.length < 2) return {
		ok: false,
		reason: "City is required"
	};
	if (trade.length < 2) return {
		ok: false,
		reason: "Trade is required"
	};
	let classified;
	try {
		classified = classifyFiling(businessName, trade);
	} catch (err) {
		return {
			ok: false,
			reason: err instanceof Error ? err.message : "Trade is required"
		};
	}
	const email = text(record.email, 120).toLowerCase();
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {
		ok: false,
		reason: "Email is not usable"
	};
	const phone = text(record.phone, 40);
	if (phone && phone.replace(/\D/g, "").length < 7) return {
		ok: false,
		reason: "Phone is not usable"
	};
	let phoneLine = "";
	if (record.phoneLine?.trim()) try {
		phoneLine = parsePhoneLine(record.phoneLine);
	} catch (err) {
		return {
			ok: false,
			reason: err instanceof Error ? err.message : "Phone line must be mobile or landline"
		};
	}
	const site = readWebsite(record.website ?? "");
	if (!site.ok) return {
		ok: false,
		reason: site.reason
	};
	const leadSlug = leadSlugFrom(businessName, city);
	if (!isLeadSlug(leadSlug)) return {
		ok: false,
		reason: "Business name did not make a usable slug"
	};
	return {
		ok: true,
		lead: {
			line,
			businessName,
			tradeType: classified.tradeType,
			tradeLabel: classified.tradeLabel,
			city,
			county,
			leadSlug,
			contactEmail: email,
			contactPhone: phone,
			website: site.website,
			hasWebsite: site.hasWebsite,
			phoneLine
		}
	};
}
function mergeLead(previous, next) {
	const cleared = next.hasWebsite === false && !next.website;
	const website = cleared ? "" : next.website || previous.website;
	return {
		...next,
		contactEmail: next.contactEmail || previous.contactEmail,
		contactPhone: next.contactPhone || previous.contactPhone,
		phoneLine: next.phoneLine || previous.phoneLine,
		website,
		hasWebsite: cleared ? false : website ? true : next.hasWebsite ?? previous.hasWebsite
	};
}
function readWebsite(raw) {
	const value = raw.trim().slice(0, 200);
	if (!value || value.toLowerCase() === "unknown") return {
		ok: true,
		website: "",
		hasWebsite: null
	};
	const lower = value.toLowerCase();
	if (lower === "no" || lower === "false" || lower === "none") return {
		ok: true,
		website: "",
		hasWebsite: false
	};
	if (lower === "yes" || lower === "true" || lower === "y") return {
		ok: true,
		website: "",
		hasWebsite: true
	};
	if (/^(javascript|data):/i.test(value)) return {
		ok: false,
		reason: "Website is not usable"
	};
	return {
		ok: true,
		website: value,
		hasWebsite: true
	};
}
function text(value, max) {
	return (value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}
function missingColumn(err, name) {
	const message = err instanceof Error ? err.message : "";
	return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}
function missingRelation(err, name) {
	const message = err instanceof Error ? err.message : "";
	return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_table|relation/i.test(message);
}
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
//#endregion
export { importBulkLeads_createServerFn_handler, importRegistrySweep_createServerFn_handler };
