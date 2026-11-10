# film.json

The whole film. Scenes play in order; each overlaps the next by 0.5 s (the old one blurs away while the new one
lands), so the film lasts the sum of the scenes minus 0.5 s per cut. Every `t` is in seconds from the start of
its own scene. Sound effects (whoosh, click, pop, hit, land) are placed automatically on cuts, clicks and popups.
The types are in `src/spec.ts`.

```json
{
  "music": "audio/music/track.mp3",
  "scenes": [ ... ]
}
```

## `title`: the problem

```json
{ "type": "title", "seconds": 3, "text": "Your best contacts change jobs.",
  "capture": { "src": "captures/linkedin-job-change-detected-modal.png", "w": 880, "h": 686, "scale": 0.75 } }
```

Big white line on the gradient; `capture` (optional) floats beside it at `scale` of its pixels.

## `brand`: Hublead's answer

```json
{ "type": "brand", "seconds": 2.7, "text": "Hublead tells you.\nAutomatically." }
```

The mark, then the line (`\n` breaks it).

## `shot`: one step of the story

```json
{
  "type": "shot", "seconds": 6, "step": "Watch a whole HubSpot segment",
  "capture": { "w": 1440, "h": 900, "app": { "page": "job-changes" } },
  "camera": [
    { "t": 0, "x": 900, "y": 250, "zoom": 1.0, "tiltY": 12 },
    { "t": 1.4, "target": "Watch a segment", "zoom": 1.35 }
  ],
  "clicks": [{ "t": 1.6, "target": "Watch a segment", "from": [1100, 520] }],
  "highlights": [{ "t": 2.4, "until": 4.8, "target": "Michael Johnson", "pad": 6 }],
  "swaps": [{ "t": 2.0, "app": { "dialog": "watch-segment" } }],
  "popups": [{ "t": 2.2, "until": 4.8, "src": "captures/watch-segment-2-contacts.png", "w": 1066, "h": 1120, "scale": 0.78,
               "clicks": [{ "t": 3.4, "x": 946, "y": 1070 }] }],
  "toast": { "t": 5.0, "until": 5.9, "text": "Now watching 1,934 contacts", "x": 900, "y": 300 }
}
```

- `step`: the numbered pill on top. Two shots with the same text keep the same number (one step told in two shots).
- `capture`: a live app (`app`, see `live-app.md`) or a PNG (`src`, see `captures.md`), `w`/`h` its size.
- `camera`: keys the camera eases between. `x`/`y` is the point at the centre of the screen (capture pixels) or
  `target`; `zoom` 1 = the capture's pixels 1:1 on the 1920 x 1080 frame (a 1440-wide app at zoom 1.3 fills the
  width); `tiltX`/`tiltY` in degrees tilt the window in 3D (6 to 16 looks good, settle to 0 to 5 when reading).
- `clicks`: the pointer glides in from `from` (default: down right) over 0.75 s and presses at `t`.
- `highlights`: a violet frame around an element from `t` to `until`.
- `swaps`: from `t`, another PNG (`src`) or new app props (`app`).
- `popups`: a capture that pops over the dimmed shot from `t` to `until`, at `scale` of its pixels, with its own
  `clicks` and `swaps` (pixels of the popup). Chain several popups for a multi-step dialog, each starting 0.2 s
  before the previous one ends.
- `toast`: a white confirmation chip at `x`/`y` (capture pixels).

Timing that reads well: the camera arrives, 0.2 s later the pointer clicks, 0.5 s later the result shows, then at
least 1.5 s of stillness on anything with text.

## `channels`: where the result lands

```json
{ "type": "channels", "step": "Alerted where your team works", "items": [
  { "logo": "hubspot", "name": "HubSpot task", "seconds": 3.2, "src": "captures/hubspot-task-card.png", "w": 1120, "h": 572 },
  { "logo": "slack", "name": "Slack", "seconds": 3, "src": "captures/slack-message-card.png", "w": 1200, "h": 502 }
] }
```

Each item: its logo (`public/logos/<logo>.svg`) lands big, hands over to its capture, then leaves. `scale`
overrides the automatic fit. The scene lasts the sum of its items.

## `lockup`: the end

```json
{ "type": "lockup", "seconds": 2.8, "tagline": "Never lose a champion again." }
```

The Hublead wordmark and the tagline, on the track's last bars.
