//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-BdvHoEL2.js
var DASHBOARD_SECTIONS = [
	"schedule",
	"portfolio",
	"hours"
];
var DASHBOARD_SECTION_LABELS = {
	schedule: "Schedule",
	portfolio: "Portfolio",
	hours: "Shop hours"
};
var DEFAULT_DASHBOARD = { sections: [
	"schedule",
	"portfolio",
	"hours"
] };
function parseDashboardConfig(raw) {
	let value = raw;
	if (typeof raw === "string") try {
		value = JSON.parse(raw);
	} catch {
		return DEFAULT_DASHBOARD;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_DASHBOARD;
	const sections = value.sections;
	if (!Array.isArray(sections)) return DEFAULT_DASHBOARD;
	const picked = [];
	for (const item of sections) if (DASHBOARD_SECTIONS.includes(String(item)) && !picked.includes(item)) picked.push(item);
	return { sections: picked };
}
/** Shop override wins. The employee's saved layout is left untouched. */
function effectiveDashboard(override, shopConfig, employeeConfig) {
	return override ? shopConfig : employeeConfig;
}
function dashboardSummary(config) {
	if (config.sections.length === 0) return "Empty";
	return config.sections.map((section) => DASHBOARD_SECTION_LABELS[section]).join(", ");
}
//#endregion
export { parseDashboardConfig as a, effectiveDashboard as i, DASHBOARD_SECTION_LABELS as n, dashboardSummary as r, DASHBOARD_SECTIONS as t };
