import { existsSync } from "node:fs";
import path from "node:path";
import { SHOWCASE } from "./showcase";

/** A cinematic build only shows once every required file is on disk. */
export function readyShowcaseIds(): string[] {
  return SHOWCASE.filter((b) =>
    b.requires.every((f) => existsSync(path.join(process.cwd(), "public", "showcase", b.dir ?? b.id, f))),
  ).map((b) => b.id);
}
