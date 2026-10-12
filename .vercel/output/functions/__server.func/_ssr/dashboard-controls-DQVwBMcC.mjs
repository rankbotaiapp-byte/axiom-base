import { o as __toESM } from "../_runtime.mjs";
import { $ as require_react, T as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as setShopDashboard, E as setEmployeeDashboard } from "./server-CiF75qCF.mjs";
import { i as effectiveDashboard, n as DASHBOARD_SECTION_LABELS, r as dashboardSummary, t as DASHBOARD_SECTIONS } from "./dashboard-BdvHoEL2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-controls-DQVwBMcC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DashboardSectionToggles({ value, disabled, onChange }) {
	function toggle(section) {
		onChange({ sections: value.sections.includes(section) ? value.sections.filter((item) => item !== section) : DASHBOARD_SECTIONS.filter((item) => value.sections.includes(item) || item === section) });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-2",
		children: DASHBOARD_SECTIONS.map((section) => {
			const on = value.sections.includes(section);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "switch",
				"aria-checked": on,
				disabled,
				onClick: () => toggle(section),
				className: "flex h-11 items-center justify-between rounded-xl px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: DASHBOARD_SECTION_LABELS[section] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: on ? "text-fg" : "text-faint",
					children: on ? "On" : "Off"
				})]
			}, section);
		})
	});
}
function ShopDashboardPanel({ shop, employees, disabled, onReload }) {
	const [override, setOverride] = (0, import_react.useState)(shop.dashboardOverride);
	const [config, setConfig] = (0, import_react.useState)(shop.dashboardConfig);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const saving = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (saving.current) return;
		setOverride(shop.dashboardOverride);
		setConfig(shop.dashboardConfig);
	}, [shop.dashboardConfig, shop.dashboardOverride]);
	function save(nextOverride, nextConfig) {
		if (disabled || saving.current) return;
		saving.current = true;
		setOverride(nextOverride);
		setConfig(nextConfig);
		setBusy(true);
		setError(null);
		setShopDashboard({ data: {
			slug: shop.slug,
			override: nextOverride,
			config: nextConfig
		} }).then(() => onReload()).catch((err) => {
			setOverride(shop.dashboardOverride);
			setConfig(shop.dashboardConfig);
			setError(err instanceof Error ? err.message : "Could not save");
		}).finally(() => {
			saving.current = false;
			setBusy(false);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "max-w-xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "Stations"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-3xl",
				children: "Dashboards"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: override ? "This layout replaces every employee dashboard. Their saved layouts stay put." : "Employees keep the layouts they set. Turn override on to replace them."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "switch",
				"aria-checked": override,
				"aria-label": "Override employee dashboards",
				disabled: disabled || busy,
				onClick: () => save(!override, config),
				className: "mt-4 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Override employee dashboards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: override ? "text-fg" : "text-faint",
					children: override ? "On" : "Off"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardSectionToggles, {
					value: config,
					disabled: disabled || busy,
					onChange: (next) => save(override, next)
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 grid gap-3",
				children: employees.map((employee) => {
					const showing = effectiveDashboard(override, config, employee.dashboardConfig);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: employee.displayName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted",
								children: ["Saved · ", dashboardSummary(employee.dashboardConfig)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted",
								children: ["Showing · ", dashboardSummary(showing)]
							})
						]
					}, employee.id);
				})
			})
		]
	});
}
function EmployeeDashboardEditor({ shop, employee, disabled, onSaved }) {
	const [config, setConfig] = (0, import_react.useState)(employee.dashboardConfig);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const showing = effectiveDashboard(shop.dashboardOverride, shop.dashboardConfig, config);
	(0, import_react.useEffect)(() => {
		setConfig(employee.dashboardConfig);
	}, [employee.dashboardConfig, employee.id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10 max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.2em] text-muted",
				children: "My layout"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: "Dashboard"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: shop.dashboardOverride ? `Shop override is on. This station is showing ${dashboardSummary(showing)}.` : "These sections are yours until the shop override is on."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardSectionToggles, {
					value: config,
					disabled: disabled || busy,
					onChange: (next) => {
						setConfig(next);
						setBusy(true);
						setError(null);
						setEmployeeDashboard({ data: {
							slug: shop.slug,
							employeeId: employee.id,
							config: next
						} }).then((result) => onSaved(result.config)).catch((err) => {
							setConfig(employee.dashboardConfig);
							setError(err instanceof Error ? err.message : "Could not save");
						}).finally(() => setBusy(false));
					}
				})
			}),
			shop.dashboardOverride ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: ["Saved · ", dashboardSummary(config)]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null
		]
	});
}
//#endregion
export { ShopDashboardPanel as n, EmployeeDashboardEditor as t };
