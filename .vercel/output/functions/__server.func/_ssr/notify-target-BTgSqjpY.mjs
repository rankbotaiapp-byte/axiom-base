//#region node_modules/.nitro/vite/services/ssr/assets/notify-target-BTgSqjpY.js
function isNotifyEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
/** US 10-digit, 11-digit with leading 1, or an existing +E.164 number. */
function toE164(raw) {
	const trimmed = raw.trim();
	const digits = trimmed.replace(/\D/g, "");
	if (digits.length === 10) return `+1${digits}`;
	if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
	if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
	return null;
}
//#endregion
export { toE164 as n, isNotifyEmail as t };
