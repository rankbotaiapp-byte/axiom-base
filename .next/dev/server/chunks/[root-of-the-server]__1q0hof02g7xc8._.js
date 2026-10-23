module.exports = [
"[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_pg_1ve3oz33vol1o._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
    });
});
}),
"[project]/node_modules/@electric-sql/pglite/dist/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__0fjdbj2pcydni._.js",
  "server/chunks/node_modules_@electric-sql_pglite_dist_0ler3op2dh9ti._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/@electric-sql/pglite/dist/index.js [app-route] (ecmascript)");
    });
});
}),
];