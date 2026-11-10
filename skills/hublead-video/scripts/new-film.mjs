#!/usr/bin/env node
// Creates a film project from the template and installs what it needs.
// Usage: node new-film.mjs <name> [--dir "<parent folder>"]   (default parent: ~/Hublead Videos)
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const args = process.argv.slice(2)
const name = args.find((a) => !a.startsWith("--"))
if (!name) {
  console.error('Usage: node new-film.mjs <name> [--dir "<parent folder>"]')
  process.exit(1)
}
const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const dirFlag = args.indexOf("--dir")
const parent = dirFlag >= 0 ? path.resolve(args[dirFlag + 1].replace(/^~/, os.homedir())) : path.join(os.homedir(), "Hublead Videos")
const film = path.join(parent, slug)
if (fs.existsSync(film)) {
  console.error(`${film} already exists: pick another name, or keep working in it.`)
  process.exit(1)
}

const here = import.meta.dirname
const template = path.join(here, "..", "template")
fs.mkdirSync(parent, { recursive: true })
fs.cpSync(template, film, { recursive: true, filter: (src) => !/node_modules|[\\/]out[\\/]?$/.test(src) })
fs.mkdirSync(path.join(film, "scripts"), { recursive: true })
for (const f of ["render.mjs", "check-film.mjs", "music.mjs", "sfx.mjs"]) fs.copyFileSync(path.join(here, f), path.join(film, "scripts", f))
const pkg = JSON.parse(fs.readFileSync(path.join(film, "package.json"), "utf8"))
pkg.name = slug
pkg.scripts.render = "node scripts/render.mjs"
fs.writeFileSync(path.join(film, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`)

console.log(`Installing the film tools in ${film} (one or two minutes)...`)
execFileSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: film, stdio: "inherit" })
execFileSync(process.execPath, [path.join(film, "scripts", "sfx.mjs"), film], { stdio: "inherit" })
console.log(`\nFILM=${film}`)
