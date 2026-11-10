#!/usr/bin/env node
// Rebuilds the real Hublead dashboard components for the video template.
// Needs a checkout of admin-ui with `bun install` done (private ui-kit access).
// Usage: node studio/build.mjs [path/to/admin-ui]
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const here = import.meta.dirname
const adminUi = path.resolve(process.argv[2] ?? process.env.ADMIN_UI ?? path.join(here, "../../admin-ui"))
const out = path.resolve(here, "../skills/hublead-video/template/src/hublead-app")
if (!fs.existsSync(path.join(adminUi, "node_modules/@hublead-io/ui-kit"))) {
  console.error(`admin-ui not found or not installed at ${adminUi}`)
  process.exit(1)
}

const link = path.join(here, "node_modules")
fs.rmSync(link, { force: true, recursive: true })
fs.symlinkSync(path.join(adminUi, "node_modules"), link)

const src = path.relative(here, path.join(adminUi, "src")).split(path.sep).join("/")
fs.writeFileSync(
  path.join(here, "app.css"),
  `@import "tailwindcss" source(none);\n@import "@hublead-io/ui-kit/theme.css";\n@source "${src}";\n@source "./entry.tsx";\n`,
)
fs.writeFileSync(path.join(here, "app.ts"), `import "./app.css"\nexport * from "./entry"\n`)

try {
  execFileSync(path.join(link, ".bin/vite"), ["build", "--config", path.join(here, "vite.config.mjs")], {
    stdio: "inherit",
    env: { ...process.env, ADMIN_UI: adminUi, OUT_DIR: out },
  })
  // CommonJS deps inside call require("react"): hand them the host's React, so the film and the app share one
  const js = path.join(out, "hublead-app.js")
  const shim = 'import * as __react from "react";\nimport * as __reactDom from "react-dom";\nimport * as __jsx from "react/jsx-runtime";\nconst require = (m) => { const v = { react: __react, "react-dom": __reactDom, "react/jsx-runtime": __jsx }[m]; if (!v) throw new Error(`hublead-app: no ${m}`); return v; };\n'
  fs.writeFileSync(js, shim + fs.readFileSync(js, "utf8"))
  const sha = execFileSync("git", ["-C", adminUi, "rev-parse", "--short", "HEAD"]).toString().trim()
  fs.writeFileSync(path.join(out, "SOURCE.txt"), `Built from admin-ui ${sha} on ${new Date().toISOString().slice(0, 10)}\n`)
  fs.copyFileSync(path.join(here, "hublead-app.d.ts"), path.join(out, "hublead-app.d.ts"))
} finally {
  fs.rmSync(link, { force: true })
  fs.rmSync(path.join(here, "app.css"), { force: true })
  fs.rmSync(path.join(here, "app.ts"), { force: true })
}
