# Captures

A capture is a PNG in the film's `public/captures/`, shown as a floating window. Use one when the screen is not
in the live app. Coordinates in a scene are pixels of the PNG (open it, read the pixel), so a 2x capture has 2x
coordinates.

## Ready captures (in every new film)

| File | Size | Shows |
| --- | --- | --- |
| `linkedin-profile-with-panel.png` | 1135 x 1064 | A LinkedIn profile with the Hublead panel, contact not tracked |
| `linkedin-panel-not-tracked.png` | 1078 x 1120 | The panel alone, "Track job changes" button |
| `linkedin-track-modal-monthly.png` / `-quarterly.png` | 880 x 704 | Track modal, monthly / quarterly selected |
| `linkedin-panel-job-change.png` | 1078 x 1120 | The panel showing a detected job change |
| `linkedin-job-change-detected-modal.png` | 880 x 686 | The job change modal (Salesforce AE to HubSpot Senior AE) |
| `watch-segment-1-list.png` .. `-4-review.png` | ~1000 x 1100 | The 4 steps of the Watch a segment dialog |
| `hubspot-task-card.png` | 1120 x 572 | The HubSpot task created on a job change |
| `slack-message-card.png` | 1200 x 502 | The Slack alert |
| `salesforce-task-card.png` | 1080 x 248 | The Salesforce task |
| `email-weekly-recap.png` | 1360 x 1504 | The weekly email recap |

Logos for `channels` items and `title` scenes: `public/logos/` (hubspot, salesforce, slack, gmail, linkedin,
microsoft, stripe). More official logos: `https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/<name>.svg`.

## A screenshot they give you

Save it into `public/captures/` with a plain name, read its size (`sips -g pixelWidth -g pixelHeight <file>`),
crop away browser bars and personal data first (`sips -c <h> <w> --cropOffset <y> <x> in.png --out out.png`).
Check it for real customer names, emails, photos: if any, ask for another one or cover them with a highlight-free
crop. Retina screenshots are 2x: that is good (sharp when zoomed).

## A new capture from the browser (Claude in Chrome / Dia tools)

Only with their OK, in their own logged-in browser, read-only:

1. Open the page in a new tab. Never click a button that spends credits, starts a watch, sends, saves or deletes.
2. Replace personal data before capturing, client side only (nothing is saved): rename the signed-in user and
   the people shown with `javascript_tool` (`el.textContent = ...`), hide `[data-slot=sidebar-cards]`.
3. For dashboard pages fed by the API, sample data can be injected by patching `window.fetch` for the page's
   endpoints, then refreshing React Query: find the client on the root fibre
   (`document.getElementById('root')._reactContainer...memoizedProps.client`) and call `invalidateQueries()`.
4. Capture at 2x with the `computer` tool's `zoom` action on the region (scale 1, save to disk), and stitch tiles
   if the region is larger than the viewport.
5. Close dialogs with Escape, never with their action buttons.
