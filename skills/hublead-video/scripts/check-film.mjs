#!/usr/bin/env node
// Checks film.json against the rules a reviewer would otherwise check by eye, before any frame is rendered.
// Run from the film folder: node scripts/check-film.mjs   (render.mjs --sheet and the full render run it first)
// Prints one line per failed check and exits 1 when any fails. The frames still need a look (SKILL.md section 6):
// this catches what can be read from the file.
import fs from "node:fs"
import path from "node:path"

const OVERLAP = 0.5
const film = process.cwd()
const spec = JSON.parse(fs.readFileSync(path.join(film, "film.json"), "utf8"))
const fails = []
const fail = (where, msg) => fails.push(`${where}: ${msg}`)

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length
// references/copy.md
const BANNED = /\b(seamless(ly)?|effortless(ly)?|powerful|revolutionary|unlock|leverage|ai-powered)\b/i
// Hublead product rule: detection has no fixed delay (data lags weeks to about 2 months), never promise speed
const SPEED = /\b(the day (they|it|he|she)|same day|instant(ly)?|in real[- ]time|real-time|right away|immediately|the moment|within \d+ ?(min|minutes?|hours?|days?))\b/i
const EMOJI = /\p{Extended_Pictographic}/u

const texts = []
spec.scenes.forEach((s, i) => {
  const at = `scene ${i + 1} (${s.type})`
  if (s.text) texts.push([at, "text", s.text])
  if (s.step) {
    texts.push([at, "step", s.step])
    const n = words(s.step)
    if (n < 3 || n > 6) fail(at, `step pill "${s.step}" has ${n} words, copy.md asks 3 to 6`)
  }
  if (s.tagline) {
    texts.push([at, "tagline", s.tagline])
    const n = words(s.tagline)
    if (n < 3 || n > 6) fail(at, `lockup tagline "${s.tagline}" has ${n} words, copy.md asks 3 to 6`)
  }
  if (s.toast?.text) texts.push([at, "toast", s.toast.text])
  for (const it of s.items ?? []) if (it.name) texts.push([at, "channel", it.name])

  // pointer on its target: a click given in pixels must land inside its capture
  const inside = (c, w, h, where) => {
    if (c.target) return
    if (typeof c.x === "number" && (c.x < 0 || c.x > w)) fail(where, `click x ${c.x} outside the capture (0 to ${w})`)
    if (typeof c.y === "number" && (c.y < 0 || c.y > h)) fail(where, `click y ${c.y} outside the capture (0 to ${h})`)
  }
  if (s.type === "shot") {
    for (const c of s.clicks ?? []) inside(c, s.capture.w, s.capture.h, `${at} click at ${c.t}s`)
    for (const p of s.popups ?? []) {
      if (p.until > s.seconds + 1e-6) fail(at, `popup ${p.src} ends at ${p.until}s, after the shot (${s.seconds}s)`)
      for (const c of p.clicks ?? []) inside(c, p.w, p.h, `${at} popup ${p.src} click at ${c.t}s`)
    }
    const app = s.capture.app
    const hasTarget = [...(s.camera ?? []), ...(s.clicks ?? []), ...(s.highlights ?? [])].some((k) => k.target)
    if (hasTarget && !app) fail(at, "a target is used on a PNG capture: targets only work on a live app capture")
    // the captures exist
    for (const f of [s.capture.src, ...(s.popups ?? []).flatMap((p) => [p.src, ...(p.swaps ?? []).map((w) => w.src)])])
      if (f && !/^https?:/.test(f) && !fs.existsSync(path.join(film, "public", f))) fail(at, `missing file public/${f}`)
  }
  for (const it of s.items ?? []) if (it.src && !fs.existsSync(path.join(film, "public", it.src))) fail(at, `missing file public/${it.src}`)
})

for (const [at, kind, t] of texts) {
  if (BANNED.test(t)) fail(at, `${kind} "${t}" uses a banned word (${t.match(BANNED)[0]}), see copy.md`)
  if (SPEED.test(t)) fail(at, `${kind} "${t}" promises a detection speed (${t.match(SPEED)[0]}): Hublead data lags weeks, say what happens, not when`)
  if (t.includes("!")) fail(at, `${kind} "${t}" has an exclamation mark`)
  if (/[—–]/.test(t)) fail(at, `${kind} "${t}" has an em or en dash`)
  if (EMOJI.test(t)) fail(at, `${kind} "${t}" has an emoji`)
  if (/\b(nexus|admin-ui|signals backend|v\d+(\.\d+)*)\b/i.test(t)) fail(at, `${kind} "${t}" shows an internal name or a version`)
}

const len = spec.scenes.reduce((a, s) => a + (s.type === "channels" ? s.items.reduce((b, i) => b + i.seconds, 0) : s.seconds), 0) - OVERLAP * (spec.scenes.length - 1)
if (len < 30 || len > 50) fail("film", `lasts ${len.toFixed(1)} s, the skill aims at 30 to 50 s`)
if (spec.music && !fs.existsSync(path.join(film, "public", spec.music))) fail("film", `missing music public/${spec.music}`)

// The live app screens come from the admin-ui bundle: its own copy is on screen too and film.json cannot change it.
// Warn (exit code unchanged) on any bundle string that breaks copy.md, so the film author picks other screens or asks
// for a bundle change. Seen 2026-11-10: "You hear the moment one moves" on the Job changes stat card.
const warns = []
const usesApp = spec.scenes.some((s) => s.type === "shot" && s.capture?.app)
const bundleDir = [path.join(film, "src/hublead-app"), path.join(film, "template/src/hublead-app")].find((d) => fs.existsSync(d))
if (usesApp && bundleDir) {
  const js = fs.readFileSync(path.join(bundleDir, "hublead-app.js"), "utf8")
  const seen = new Set()
  // string literals that read as English UI copy: quotes, single quotes and template literals
  for (const m of js.matchAll(/"([^"\\\n]{8,240})"|'([^'\\\n]{8,240})'|`([^`\\]{8,400})`/g)) {
    const t = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, "…").trim()
    if (!/\s/.test(t) || !/[a-z]{3}/.test(t) || /[{};=<>]|^(https?:|\.|\/)/.test(t) || seen.has(t)) continue
    const tok = t.split(/\s+/)
    if (tok.filter((w) => /[-:\[(]/.test(w)).length * 2 > tok.length) continue   // CSS class lists, not copy
    if (SPEED.test(t)) { seen.add(t); warns.push(`app bundle copy "${t}" promises a detection speed (${t.match(SPEED)[0]}): keep it off screen or ask for a bundle change`) }
    else if (BANNED.test(t)) { seen.add(t); warns.push(`app bundle copy "${t}" uses a banned word (${t.match(BANNED)[0]})`) }
  }
  // stale bundle: a screen the customer no longer sees. ADMIN_UI_HEAD=<sha of admin-ui main> turns this on.
  const src = fs.existsSync(path.join(bundleDir, "SOURCE.txt")) ? fs.readFileSync(path.join(bundleDir, "SOURCE.txt"), "utf8") : ""
  const built = (src.match(/admin-ui ([0-9a-f]{7,40})/) || [])[1]
  const head = process.env.ADMIN_UI_HEAD
  if (head && built && !head.startsWith(built) && !built.startsWith(head)) warns.push(`app bundle built from admin-ui ${built}, main is ${head.slice(0, 8)}: rebuild it (studio/README.md) before showing it`)
}
for (const w of warns) console.log(`  WARN ${w}`)

if (fails.length) {
  console.log(`CHECK FAIL (${fails.length})`)
  for (const f of fails) console.log(`  - ${f}`)
  process.exit(1)
}
console.log(`CHECK OK: ${spec.scenes.length} scenes, ${len.toFixed(1)} s`)
