#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VENDOR_TARGETS = [
  path.join(ROOT, "apps/lab/public/vendor"),
  path.join(ROOT, "apps/www/public/vendor"),
];

const NODE_MODULE_CANDIDATES = [
  path.resolve(ROOT, "../libs-genclaude/node_modules"),
  path.resolve(ROOT, "apps/www/node_modules"),
  path.resolve(ROOT, "node_modules"),
];

const PACKAGES = ["gsap", "lenis", "three"];

main();

function main() {
  for (const vendorRoot of VENDOR_TARGETS) {
    mkdirSync(vendorRoot, { recursive: true });
  }

  for (const pkg of PACKAGES) {
    const sourceDir = resolvePackageDir(pkg);
    if (!sourceDir) {
      throw new Error(
        `[sync-vendor] No se encontro el paquete "${pkg}" en: ${NODE_MODULE_CANDIDATES.join(", ")}`
      );
    }

    for (const vendorRoot of VENDOR_TARGETS) {
      const targetDir = path.join(vendorRoot, pkg);
      rmSync(targetDir, { recursive: true, force: true });
      cpSync(sourceDir, targetDir, { recursive: true, dereference: true });
      console.log(`[sync-vendor] ${pkg}: ${sourceDir} -> ${targetDir}`);
    }
  }
}

function resolvePackageDir(pkg) {
  for (const candidateRoot of NODE_MODULE_CANDIDATES) {
    const dir = path.join(candidateRoot, pkg);
    if (existsSync(dir)) return dir;
  }
  return null;
}
