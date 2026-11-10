---
name: hublead-video
description: Make a Hublead product video (16:9, 30 to 50 s) that presents a feature with the real Hublead UI, the real dashboard components, logos, Hublead's art direction, music and sound, rendered to MP4. Use whenever someone at Hublead asks for a feature video, a product demo clip, a launch video, a teaser, an animated walkthrough or "une vidéo pour présenter <feature>", even if they only name the feature. Works for people who never used a terminal: the skill installs and runs everything.
---

# Hublead feature video

You make a short film that shows a Hublead feature working, the way a customer would see it: the real dashboard
(rendered live from its own React components, sharp at any zoom), real captures of the extension on LinkedIn,
floating in 3D on Hublead's violet grain gradient, a pointer that clicks the real buttons, numbered steps,
alert channels, the Hublead lockup, a licensed track and sound effects.

The person asking is usually in marketing, sales or customer success. Assume no terminal knowledge: you run
every command, you never ask them to edit a file, you explain in one plain sentence what you are doing, and you
speak their language (French if they write in French). The film itself is in English unless they ask otherwise.

`SKILL_DIR` below is this skill's folder (the folder holding this file).

## 1. Brief (ask, in one message, then go)

Ask only what you cannot decide yourself, with your proposal for each so they can just say "ok":

1. **The feature** and the one sentence the viewer must remember (the outcome, not the mechanism).
2. **The story in 3 to 5 steps**: what the viewer sees happen, in order (e.g. track a contact from LinkedIn,
   watch a whole segment, see every change, get alerted in HubSpot/Slack/email).
3. **CRM**: HubSpot (default) or Salesforce.
4. **Length**: 30 to 50 s (default 45 s). **Mood** of the music (default: upbeat, modern, confident).
5. **Screens they already have** (screenshots, recordings) they want in, if any.

Read `references/copy.md` before writing any on-screen text.

## 2. Set up (about two minutes, once per film)

```bash
node "$SKILL_DIR/scripts/doctor.mjs"
node "$SKILL_DIR/scripts/new-film.mjs" "<short film name>"
```

`doctor` checks Node.js 18+ and disk space. If Node is missing, tell them in one sentence to install the LTS from
https://nodejs.org and to tell you when it is done; nothing else is needed (Remotion brings its own Chrome and
ffmpeg). `new-film` creates `~/Hublead Videos/<name>/`, installs the tools and downloads the sound effects; it
prints `FILM=<path>`. Every later command runs in that folder.

## 3. Screens: pick a source per step

| What the step shows | Source | How |
| --- | --- | --- |
| The Hublead dashboard (Job changes and its tabs, Activity, Bulk Enrichment) | **Live app** (best: real components, any zoom, targets by label) | `capture.app` in film.json, see `references/live-app.md` |
| The Watch a segment dialog, first step | Live app | `"dialog": "watch-segment"` |
| The extension panel on LinkedIn, the track modal, the job change modal, the next steps of the watch dialog, HubSpot/Slack/Salesforce/email alerts | **Ready captures** in `public/captures/` | list in `references/captures.md` |
| Anything else (another page, another product surface) | **New capture** from the browser, or a screenshot they give you | `references/captures.md` |

Prefer the live app whenever the screen exists there. Never show real customer data: the live app ships with
sample people and companies, captures must use sample data too (`references/captures.md`).

## 4. Write the film

Edit `film.json` in the film folder. It is the whole film: scenes in order, times in seconds. Read
`references/film-spec.md` (every field, with examples). The template's `film.json` is a complete 45 s Job changes
film: start from it and change what the brief changes rather than writing from nothing.

House shape that works: `title` (the problem, 3 s) → `brand` ("Hublead does X.", 2.5 s) → one `shot` per step
(4 to 8 s each, a camera move plus a click, a popup or a highlight) → `channels` (where the result lands) →
`lockup` (tagline, 3 s). Slow on interfaces (people must read), quick on transitions.

## 5. Music

```bash
node scripts/music.mjs search --mood "<mood words>" --length <seconds> --source mixkit --limit 4
node scripts/music.mjs get '#1' --to public/audio/music --name track --no-history
```

Pick the candidate whose description fits the mood and has "a real ending"; the film ends on the track's ending
by itself. Then set `"music": "audio/music/track.mp3"` at the top of `film.json`. Mixkit's licence needs no credit.
Ignore the `track.py` / `listen.py` hints it prints: they belong to cinetic, not to this skill.

## 6. Check before rendering

```bash
node scripts/check-film.mjs              # the words and numbers of film.json against references/copy.md
node scripts/render.mjs --sheet          # one frame per second in out/sheet/ (runs the check first)
node scripts/render.mjs --still 12.5     # one moment
```

Look at the frames yourself (Read the PNGs) and fix before showing anything: text readable, pointer on its
button, nothing cut at the edges, no empty frame, step pills not covering what the step shows, no personal data.
A crop that cuts through the dashboard's sidebar leaves a strip of chevrons and New / Soon badges that reads as a
broken app: frame the whole sidebar or none of it. A camera centred on a button near the window's edge leaves half
the frame empty: aim at the row or the panel instead, or set `x` on the key.
The sheet prints the film's own warnings: `[film] target not found` means the pointer or the camera fell back to the
middle of the capture (fix the target's text); `[film] target "..." is on screen 2 times` means the camera may aim at
the wrong one (a card title and a column header, the signed-in user and a table row): use a `css:` selector.

## 7. Render and hand over

```bash
node scripts/render.mjs                  # out/<name>.mp4, 1080p, ~14 Mb/s
open "out/<name>.mp4"
```

A full render takes a while because the dashboard is rendered for real on every frame (about 1 to 2 s a frame on a
4-core machine, so 20 to 45 min for a 45 s film): run it in the background and say so. Give them the file path, ask what to change, iterate. To preview live while editing they
can run `npm run studio` (it opens in the browser).

## Rules

- Never click a button that spends credits, starts a watch, sends a message or changes settings while capturing
  in the real product ("Track for N credits", "Start watching", "Send", "Save"). Captures are read-only.
- Never use a real customer's name, email, company data or photo. Colleagues only with their OK.
- No version numbers, no internal names, no jargon on screen (`references/copy.md`).
- Do not commit or publish the film anywhere unless asked; the MP4 stays on their Mac.
- The live dashboard bundle (`template/src/hublead-app/`) is built by a developer from the dashboard repo
  (`studio/README.md` at the plugin root). If a screen is missing from it, use a capture and say a developer
  can add it.
