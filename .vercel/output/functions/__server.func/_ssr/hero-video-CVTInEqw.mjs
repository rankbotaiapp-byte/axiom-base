//#region node_modules/.nitro/vite/services/ssr/assets/hero-video-CVTInEqw.js
/** ISO BMFF files start with a size field and the `ftyp` brand. */
function isMp4(bytes) {
	if (bytes.byteLength < 12 || bytes.byteLength > 12582912) return false;
	return bytes[4] === 102 && bytes[5] === 116 && bytes[6] === 121 && bytes[7] === 112;
}
function isCustomHeroVideo(url) {
	return typeof url === "string" && url.startsWith("/api/hero-video/");
}
function heroVideoPath(shopId, version) {
	return `/api/hero-video/${shopId}?v=${version}`;
}
function shopIdFromHeroPath(pathname) {
	const id = pathname.split("/").filter(Boolean).pop() ?? "";
	return /^shop_[a-zA-Z0-9]+$/.test(id) ? id : null;
}
//#endregion
export { shopIdFromHeroPath as i, isCustomHeroVideo as n, isMp4 as r, heroVideoPath as t };
