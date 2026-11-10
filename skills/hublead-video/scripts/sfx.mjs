#!/usr/bin/env node
// Downloads the film's sound effects from Mixkit (free licence, no credit needed; the files may not be
// redistributed, so each film fetches its own copy). Usage: node sfx.mjs <film dir>
import fs from "node:fs"
import path from "node:path"

const film = path.resolve(process.argv[2] ?? ".")
const dir = path.join(film, "public", "sfx")
const kit = { whoosh: 1491, click: 1115, pop: 3192, hit: 562, land: 2070 }
fs.mkdirSync(dir, { recursive: true })
for (const [name, id] of Object.entries(kit)) {
  const file = path.join(dir, `${name}.wav`)
  if (fs.existsSync(file)) continue
  const res = await fetch(`https://assets.mixkit.co/active_storage/sfx/${id}/${id}.wav`)
  if (!res.ok) {
    console.error(`could not download ${name} (${res.status}); the film plays without it`)
    continue
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  console.log(`sfx ${name}.wav`)
}
fs.writeFileSync(path.join(dir, "LICENCE.txt"), "Sound effects from Mixkit (https://mixkit.co/license/#sfxFree): free for commercial use, no attribution. Do not redistribute the files on their own.\n")
