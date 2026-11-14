import { parse } from "@babel/parser";
import babelGenerate from "@babel/generator";

const generate = babelGenerate.default ?? babelGenerate;
import * as t from "@babel/types";
import { readFileSync, writeFileSync } from "node:fs";

const [, , sourcePath, implPath, importSpec] = process.argv;
if (!sourcePath || !implPath || !importSpec) {
  console.error("usage: node scripts/_split-server-fns.mjs <source> <impl> <import-spec>");
  process.exit(1);
}

const code = readFileSync(sourcePath, "utf8");
const ast = parse(code, {
  sourceType: "module",
  plugins: ["typescript"],
  attachComment: true,
});

function handlerCallOf(init) {
  let current = init;
  let handlerCall = null;
  while (t.isCallExpression(current)) {
    const callee = current.callee;
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
      if (callee.property.name === "handler") handlerCall = current;
      current = callee.object;
      continue;
    }
    if (t.isIdentifier(callee) && callee.name === "createServerFn") return handlerCall;
    break;
  }
  return null;
}

function isServerFnExport(stmt) {
  if (!t.isExportNamedDeclaration(stmt) || !stmt.declaration || !t.isVariableDeclaration(stmt.declaration)) return null;
  const decl = stmt.declaration.declarations[0];
  if (!decl || !t.isIdentifier(decl.id) || !decl.init || stmt.declaration.declarations.length !== 1) return null;
  const handlerCall = handlerCallOf(decl.init);
  if (!handlerCall) return null;
  if (handlerCall.arguments.length !== 1) throw new Error(`${decl.id.name} handler has ${handlerCall.arguments.length} args`);
  const fn = handlerCall.arguments[0];
  if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) {
    throw new Error(`${decl.id.name} handler is ${fn.type}`);
  }
  return { name: decl.id.name, handlerCall, fn };
}

function isTypeStmt(stmt) {
  if (t.isTSTypeAliasDeclaration(stmt) || t.isTSInterfaceDeclaration(stmt)) return true;
  if (!t.isExportNamedDeclaration(stmt)) return false;
  if (stmt.exportKind === "type") return true;
  const declaration = stmt.declaration;
  return t.isTSTypeAliasDeclaration(declaration) || t.isTSInterfaceDeclaration(declaration);
}

function annotate(fn) {
  for (const param of fn.params) {
    if (param.typeAnnotation) continue;
    param.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());
  }
}

function wrapper(handlerName) {
  const parsed = parse(
    `const placeholder = async (ctx: any) => { const loaded = await import(${JSON.stringify(importSpec)}); return loaded.${handlerName}(ctx); };`,
    { sourceType: "module", plugins: ["typescript"] },
  );
  const decl = parsed.program.body[0];
  if (!t.isVariableDeclaration(decl)) throw new Error("wrapper parse failed");
  const init = decl.declarations[0]?.init;
  if (!t.isArrowFunctionExpression(init)) throw new Error("wrapper arrow missing");
  return init;
}

const implStatements = [];
const clientStatements = [];
let extracted = 0;

for (const stmt of ast.program.body) {
  if (t.isImportDeclaration(stmt)) {
    implStatements.push(t.cloneNode(stmt, true));
    clientStatements.push(t.cloneNode(stmt, true));
    continue;
  }
  if (isTypeStmt(stmt)) {
    implStatements.push(t.cloneNode(stmt, true));
    clientStatements.push(t.cloneNode(stmt, true));
    continue;
  }
  const serverFn = isServerFnExport(stmt);
  if (!serverFn) {
    implStatements.push(stmt);
    continue;
  }
  const handlerName = `${serverFn.name}Handler`;
  const cloned = t.cloneNode(serverFn.fn, true);
  annotate(cloned);
  implStatements.push(
    t.exportNamedDeclaration(
      t.variableDeclaration("const", [t.variableDeclarator(t.identifier(handlerName), cloned)]),
    ),
  );
  serverFn.handlerCall.arguments[0] = wrapper(handlerName);
  clientStatements.push(stmt);
  extracted += 1;
}

function referenced(statements, specifiers) {
  const body = generate(t.program(statements), { comments: false, compact: false }).code;
  return specifiers.some((name) => new RegExp(`\\b${name}\\b`).test(body));
}

function filterImports(statements) {
  const rest = statements.filter((stmt) => !t.isImportDeclaration(stmt));
  const imports = statements.filter((stmt) => t.isImportDeclaration(stmt));
  const kept = [];
  for (const stmt of imports) {
    const source = stmt.source.value;
    if (source === "@/lib/db" || source.endsWith("/db") || source.endsWith("/db.ts")) continue;
    if (stmt.specifiers.length === 0) {
      kept.push(stmt);
      continue;
    }
    const names = stmt.specifiers.map((spec) => {
      if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec) || t.isImportSpecifier(spec)) {
        return spec.local.name;
      }
      return "";
    });
    if (referenced(rest, names.filter(Boolean))) kept.push(stmt);
  }
  return [...kept, ...rest];
}

const impl = filterImports(implStatements);
const client = filterImports(clientStatements);
const print = (statements) =>
  generate(t.program(statements), { comments: true, compact: false, jsescOption: { minimal: true } }).code + "\n";

writeFileSync(implPath, print(impl));
writeFileSync(sourcePath, print(client));
console.log(`extracted ${extracted} server functions from ${sourcePath}`);
