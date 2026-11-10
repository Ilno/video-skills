#!/usr/bin/env node
// Renders the film. Run from the film folder.
//   node scripts/render.mjs              -> out/<name>.mp4 (1080p, ~14 Mb/s, plays everywhere)
//   node scripts/render.mjs --still 4.5  -> out/still-4.5.png, one frame at 4.5 s, to check a moment
//   node scripts/render.mjs --sheet      -> out/sheet/*.png, one frame per second, to review the whole film
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const film = process.cwd()
const name = JSON.parse(fs.readFileSync(path.join(film, "package.json"), "utf8")).name
const args = process.argv.slice(2)
const npx = (a) => execFileSync("npx", ["--no-install", "remotion", ...a], { cwd: film, stdio: "inherit" })
fs.mkdirSync(path.join(film, "out"), { recursive: true })

const still = args.indexOf("--still")
if (still >= 0) {
  const s = Number(args[still + 1])
  npx(["still", "Film", `out/still-${s}.png`, `--frame=${Math.round(s * 30)}`])
  process.exit(0)
}

if (args.includes("--sheet")) {
  const film = JSON.parse(fs.readFileSync("film.json", "utf8"))
  const len = film.scenes.reduce((a, s) => a + (s.type === "channels" ? s.items.reduce((b, i) => b + i.seconds, 0) : s.seconds), 0) - 0.5 * (film.scenes.length - 1)
  fs.mkdirSync("out/sheet", { recursive: true })
  for (let s = 0.5; s < len; s += 1) npx(["still", "Film", `out/sheet/${String(s.toFixed(1)).padStart(5, "0")}.png`, `--frame=${Math.round(s * 30)}`, "--log=error"])
  console.log("\nout/sheet ready")
  process.exit(0)
}

npx(["render", "Film", "out/raw.mp4", "--codec=h264", "--crf=16", "--concurrency=50%"])
// the grain makes the raw file huge: re-encode at a steady bitrate that keeps it sharp and light
npx(["ffmpeg", "-y", "-loglevel", "error", "-i", "out/raw.mp4", "-c:v", "libx264", "-preset", "slow", "-b:v", "14M", "-maxrate", "16M", "-bufsize", "28M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", `out/${name}.mp4`])
fs.rmSync("out/raw.mp4", { force: true })
console.log(`\nFILM_MP4=${path.join(film, "out", `${name}.mp4`)}`)
