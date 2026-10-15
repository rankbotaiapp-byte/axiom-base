import { readFileSync, writeFileSync } from "node:fs";

const lines = readFileSync("src/lib/axiom/bulk-import.ts", "utf8").split(/\n/);
let head = lines.slice(0, 167).join("\n");
head = head.replace("const INVALID_SAMPLE = 40;\n", "").replace("type WriteShape =", "export type WriteShape =");
const tail = lines.slice(168).join("\n");
const header = `import { newId } from "../utils.ts";
import type { Sql } from "../db.ts";
import {
  IMPORT_BATCH,
  leadCsvChunks,
  prepareBulkImport,
  type BulkImportResult,
  type BulkLeadInput,
  type PreparedLead,
  type WriteShape,
} from "./bulk-import.ts";

const INVALID_SAMPLE = 40;

`;
writeFileSync("src/lib/axiom/bulk-import.server.ts", header + tail);
writeFileSync("src/lib/axiom/bulk-import.ts", head.replace(/\n+$/, "\n"));
console.log("split bulk-import");
