#!/usr/bin/env node
// One frame per second of the film in out/sheet/, with one bundle and one browser for the whole sheet
// (a `remotion still` per frame re-bundled the film every time: about 36 s a frame, 27 min for 45 s of film).
// Usage, from the film folder: node scripts/sheet.mjs [--every <seconds>] [--from <s>] [--to <s>] [--out <folder>]
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const film = process.cwd()
const req = createRequire(path.join(film, "package.json"))
const { bundle } = await import(req.resolve("@remotion/bundler"))
const { openBrowser, selectComposition, renderStill } = await import(req.resolve("@remotion/renderer"))

const args = process.argv.slice(2)
const opt = (k, d) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d)
const spec = JSON.parse(fs.readFileSync(path.join(film, "film.json"), "utf8"))
const len = spec.scenes.reduce((a, s) => a + (s.type === "channels" ? s.items.reduce((b, i) => b + i.seconds, 0) : s.seconds), 0) - 0.5 * (spec.scenes.length - 1)
const every = opt("--every", 1), from = opt("--from", 0.5), to = opt("--to", len)

const t0 = Date.now()
const serveUrl = await bundle({ entryPoint: path.join(film, "src", "index.ts"), publicDir: path.join(film, "public") })
const browser = await openBrowser("chrome")
const composition = await selectComposition({ serveUrl, id: "Film", puppeteerInstance: browser, logLevel: "warn" })
const dir = args.includes("--out") ? path.resolve(args[args.indexOf("--out") + 1]) : path.join(film, "out", "sheet")
fs.mkdirSync(dir, { recursive: true })
console.log(`bundle + browser ready in ${((Date.now() - t0) / 1000).toFixed(0)} s`)
let n = 0
// the film's own warnings ("[film] target not found", a target on screen twice) come from the page: print each once
const seen = new Set()
const onBrowserLog = (log) => {
  if (!log.text.includes("[film]") || seen.has(log.text)) return
  seen.add(log.text)
  console.log(log.text)
}
for (let s = from; s < to; s += every) {
  const t = Date.now()
  const output = path.join(dir, `${s.toFixed(1).padStart(5, "0")}.png`)
  await renderStill({ composition, serveUrl, frame: Math.min(Math.round(s * composition.fps), composition.durationInFrames - 1), output, puppeteerInstance: browser, logLevel: "warn", onBrowserLog })
  n++
  console.log(`${path.basename(output)} ${((Date.now() - t) / 1000).toFixed(1)} s`)
}
await browser.close({ silent: true })
console.log(`\nout/sheet ready: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`)
