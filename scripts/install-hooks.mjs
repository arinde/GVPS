#!/usr/bin/env node
/**
 * Points git at our committed hooks directory.
 *
 * Runs from npm's `prepare`, so hooks are wired up after a clone or install
 * without anyone having to remember. The git root is not necessarily the
 * package root here, so the path is computed rather than assumed.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, join } from "node:path";

const HOOKS_DIR = join(process.cwd(), ".githooks");

try {
  if (!existsSync(HOOKS_DIR)) {
    console.error("install-hooks: .githooks not found, skipping.");
    process.exit(0);
  }

  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const fromRoot = relative(root, HOOKS_DIR).replace(/\\/g, "/");

  execFileSync("git", ["config", "core.hooksPath", fromRoot]);
  console.log(`install-hooks: core.hooksPath -> ${fromRoot}`);
} catch {
  // No git repo, or git unavailable. Not a reason to fail an install.
  console.error("install-hooks: no git repository, skipping.");
}
