# Studio: the live dashboard bundle (developers)

The video template renders the real dashboard from `template/src/hublead-app/hublead-app.js` (+ `.css`, `.d.ts`),
a library build of admin-ui's own components on its preview sample world. Employees never build it; a developer
rebuilds it when the dashboard changes and commits the output.

```bash
cd admin-ui && bun install            # needs the private ui-kit (SSH)
node hublead-video/studio/build.mjs ../admin-ui
```

- `entry.tsx` composes the real shell (sidebar, header, indicators) and page bodies (`JobChangesPage`'s panels,
  `ActivityPage`, `EnrichmentsPage`) on admin-ui's inert preview `QueryClient`, then seeds the film's data
  (`changes`, `user`, `stats`, `team`, `lists`, `slack`). Dialogs portal into the app frame through the kit's
  `PortalContainerProvider`, so they move with the camera.
- `@/` resolves to `admin-ui/src`, packages to `admin-ui/node_modules` (symlinked during the build). React is
  external (the film's own React); a small shim hands it to the CommonJS dependencies.
- Tailwind scans `admin-ui/src` and the entry, with the kit theme, into one CSS file.
- No environment variable of admin-ui is read: no keys end up in the bundle (`grep -E "pk_live|phc_" ...` to check).
- `SOURCE.txt` records the admin-ui commit it was built from.

To add a page: import its route body in `entry.tsx`, add it to `pages`, seed any query it reads that the preview
world does not (an unseeded query stays empty, the preview client never fetches), rebuild, and document the prop
in `skills/hublead-video/references/live-app.md` and `hublead-app.d.ts`.
