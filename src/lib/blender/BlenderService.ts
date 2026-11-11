import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "@/lib/env.server";
import type { BlenderShot } from "./creative-director.ts";

const SCRIPT = join(process.cwd(), "src", "lib", "blender", "scripts", "master_scene.py");

export type BlenderRenderResult =
  | { ok: true; engine: "blender"; bytes: Uint8Array }
  | { ok: false; engine: "none"; detail: string };

function blenderBin(): string {
  return (env("BLENDER_BIN") || env("BLENDER_PATH") || "blender").trim() || "blender";
}

export function blenderAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(blenderBin(), ["--version"], { windowsHide: true });
    const timer = setTimeout(() => {
      child.kill();
      resolve(false);
    }, 4000);
    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

export async function renderHeadlessBlender(input: {
  shot: BlenderShot;
  logoBytes?: Uint8Array | null;
}): Promise<BlenderRenderResult> {
  if (!(await blenderAvailable())) {
    return { ok: false, engine: "none", detail: "Blender is not installed on this host" };
  }
  const dir = await mkdtemp(join(tmpdir(), "axiom-blend-"));
  const out = join(dir, "hero.mp4");
  const logo = join(dir, "logo.png");
  const params = join(dir, "params.json");
  try {
    if (input.logoBytes && input.logoBytes.byteLength > 32) {
      await writeFile(logo, Buffer.from(input.logoBytes));
    }
    await writeFile(
      params,
      JSON.stringify({
        ...input.shot,
        logo: input.logoBytes ? logo : "",
        output: out.replace(/\\/g, "/"),
      }),
    );
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(blenderBin(), ["-b", "-P", SCRIPT, "--", params], {
        windowsHide: true,
        stdio: "ignore",
      });
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("Blender render timed out"));
      }, 90_000);
      child.on("error", reject);
      child.on("exit", (status) => {
        clearTimeout(timer);
        resolve(status ?? 1);
      });
    });
    if (code !== 0) return { ok: false, engine: "none", detail: `Blender exited ${code}` };
    const bytes = new Uint8Array(await readFile(out));
    if (bytes.byteLength < 64) return { ok: false, engine: "none", detail: "Blender wrote an empty film" };
    return { ok: true, engine: "blender", bytes };
  } catch (err) {
    return { ok: false, engine: "none", detail: err instanceof Error ? err.message : "Blender failed" };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
