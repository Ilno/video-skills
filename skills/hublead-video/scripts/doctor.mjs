#!/usr/bin/env node
// Checks this Mac can make a Hublead film. Prints one line per check and what to do when one fails.
import { execFileSync } from "node:child_process"

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return null
  }
}

const checks = []
const major = Number(process.versions.node.split(".")[0])
checks.push({ name: "Node.js", ok: major >= 18, detail: `v${process.versions.node}`, fix: "Install Node.js 20 or later from https://nodejs.org (the LTS button), then open a new terminal." })
const npm = run("npm", ["--version"])
checks.push({ name: "npm", ok: Boolean(npm), detail: npm ?? "missing", fix: "npm comes with Node.js: reinstall Node.js from https://nodejs.org." })
const free = run("df", ["-k", process.env.HOME ?? "/"])
const kb = free ? Number(free.split("\n")[1]?.split(/\s+/)[3]) : NaN
checks.push({ name: "Disk space", ok: !(kb < 3_000_000), detail: Number.isFinite(kb) ? `${(kb / 1e6).toFixed(1)} GB free` : "unknown", fix: "Free at least 3 GB: a film project with its tools takes about 1 GB." })

let failed = 0
for (const c of checks) {
  console.log(`${c.ok ? "OK  " : "FAIL"} ${c.name}: ${c.detail}`)
  if (!c.ok) {
    failed++
    console.log(`     -> ${c.fix}`)
  }
}
console.log(failed ? `\n${failed} check(s) failed.` : "\nReady. (Remotion brings its own Chrome and ffmpeg on first render.)")
process.exit(failed ? 1 : 0)
