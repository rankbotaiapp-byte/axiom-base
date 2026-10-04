//#region node_modules/.nitro/vite/services/ssr/assets/intro-BPZn6APW.js
var INTRO_PRESETS = [
	{
		id: "kenburns",
		label: "Ken Burns (Scale + Pan Inward)"
	},
	{
		id: "zoomin",
		label: "Zoom In Only"
	},
	{
		id: "zoomout",
		label: "Zoom Out Only"
	},
	{
		id: "panlr",
		label: "Pan Left-to-Right"
	},
	{
		id: "pantd",
		label: "Pan Top-Down"
	},
	{
		id: "fade",
		label: "Fade In + Subtle Scale"
	},
	{
		id: "none",
		label: "None (Static)"
	}
];
var INTRO_FX_KEY = "axiom:intro-fx";
var INTRO_FX_EVENT = "axiom:intro-fx";
function parseIntroPreset(raw) {
	const v = (raw ?? "").toLowerCase();
	if (INTRO_PRESETS.some((p) => p.id === v)) return v;
	return "kenburns";
}
function readIntroFx() {
	if (typeof window === "undefined") return true;
	return window.localStorage.getItem(INTRO_FX_KEY) !== "off";
}
function writeIntroFx(on) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(INTRO_FX_KEY, on ? "on" : "off");
	window.dispatchEvent(new Event(INTRO_FX_EVENT));
}
function introDurationSec(speed) {
	return 3 + (100 - Math.min(100, Math.max(1, speed))) / 100 * 9;
}
function cameraMotion(preset, intensity) {
	const i = Math.min(100, Math.max(0, intensity)) / 100;
	const zoom = 1 + .18 * i;
	const pan = 5.5 * i;
	switch (preset) {
		case "kenburns": return {
			initial: {
				scale: 1.02,
				x: `${-pan}%`,
				y: `${-pan * .35}%`,
				opacity: 1
			},
			animate: {
				scale: zoom,
				x: `${pan * .7}%`,
				y: `${pan * .25}%`,
				opacity: 1
			}
		};
		case "zoomin": return {
			initial: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: zoom,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		case "zoomout": return {
			initial: {
				scale: zoom,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		case "panlr": return {
			initial: {
				scale: 1 + .1 * i,
				x: `${-pan}%`,
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1 + .1 * i,
				x: `${pan}%`,
				y: "0%",
				opacity: 1
			}
		};
		case "pantd": return {
			initial: {
				scale: 1 + .1 * i,
				x: "0%",
				y: `${-pan}%`,
				opacity: 1
			},
			animate: {
				scale: 1 + .1 * i,
				x: "0%",
				y: `${pan}%`,
				opacity: 1
			}
		};
		case "fade": return {
			initial: {
				scale: 1 + .08 * i,
				x: "0%",
				y: "0%",
				opacity: 0
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
		default: return {
			initial: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			},
			animate: {
				scale: 1,
				x: "0%",
				y: "0%",
				opacity: 1
			}
		};
	}
}
//#endregion
export { parseIntroPreset as a, introDurationSec as i, INTRO_PRESETS as n, readIntroFx as o, cameraMotion as r, writeIntroFx as s, INTRO_FX_EVENT as t };
