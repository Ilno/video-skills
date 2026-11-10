# The live dashboard

`capture.app` renders the real Hublead dashboard from its own components (sidebar, header, panels, tables,
dialogs) with sample data, inside the film. It is sharp at any zoom, and the camera, clicks and highlights can aim
at what is on screen by its label instead of pixels.

```json
"capture": {
  "w": 1440, "h": 900,
  "app": {
    "page": "job-changes",
    "tab": "changes",
    "crm": "hubspot",
    "user": { "firstName": "Claire", "lastName": "Morel", "email": "claire@acme.com" }
  }
}
```

`w`/`h` are the browser size the app is laid out at (1440 x 900 is a laptop; 1280 x 800 shows bigger text,
1600 x 1000 shows more rows). Coordinates in the scene are in these pixels.

## Props of `app`

| Prop | Values | Default |
| --- | --- | --- |
| `page` | `job-changes`, `activity`, `enrichments` | required |
| `tab` | Job changes tab: `changes`, `watches` (Watched contacts), `team` | `changes` |
| `crm` | `hubspot`, `salesforce` (labels, logos and links follow) | `hubspot` |
| `user` | `{ firstName, lastName, email, photo? }`, the person signed in (sidebar) | Claire Morel |
| `changes` | the job changes listed: `[{ firstName, lastName, photo?, from: { company, title, logo? }, to: { company, title, logo? } or null (left), daysAgo? }]` | 12 sample changes |
| `stats` | `{ moved, left, tracked, missingProfiles }`, the numbers on top | 47, 12, 1,284, 0 |
| `team` | `[{ name, photo?, tracked, moved, left }]`, the Team tab | 3 sample members |
| `lists` | `[{ name, size }]`, the segments the watch dialog offers | 5 sample segments |
| `slack` | `false` shows Slack not connected ("Alerts off") | connected |
| `dialog` | `watch-segment` opens the real Watch a segment dialog (list step) over the page | none |
| `sidebarCards` | `true` shows the feature card at the bottom of the sidebar | hidden |

`logo` and `photo` are files in `public/` (e.g. `logos/stripe.svg`, `people/emily.jpg`) or `https://` URLs;
without a logo, a coloured tile with the company's initial is drawn. Photos of sample people: free stock photos
(Burst by Shopify, Unsplash) saved into `public/people/`, never a real customer.

## Changing the app during a shot

A `swap` merges new props from its time on:

```json
"swaps": [{ "t": 3.2, "app": { "tab": "team" } }, { "t": 5, "app": { "dialog": "watch-segment" } }]
```

Changing `tab` or `dialog` is instant; changing data (`changes`, `user`, `stats`...) redraws the page.

## Targets

On a live app shot, `camera` keys, `clicks` and `highlights` take `"target"` instead of `x`/`y`:

- the visible text of a button, tab, row or cell: `"Watch a segment"`, `"Team"`, `"Michael Johnson"`,
  `"Closed lost 2025"`, `"Alerts on"`; the smallest element with exactly that text wins, else one containing it;
- or a CSS selector after `css:`: `"css:[data-slot=job-changes-route] tbody tr:first-child"`.

A key may mix both: `{ "t": 2, "target": "Michael Johnson", "x": 980, "zoom": 1.7 }` centres on the row's height
but at x 980. Highlights get `pad` (pixels around the element, default 8).

## Limits

- The app is a still picture of the real UI driven by the film: a click shows the pointer and the ring, it does
  not change the app by itself. Show the result with a `swap` (tab, dialog) or a `popup` (a capture).
- Only the pages above and the first step of the watch dialog exist in the bundle. Other screens: captures.
- The bundle is rebuilt by a developer when the dashboard changes (`studio/README.md` at the plugin root).
