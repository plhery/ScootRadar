<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Committing

When a change is done and the checks pass, commit it and push straight to `main`; no branch or pull request is needed.

Between 23:00 and 05:30 Paris time, don't push a change that deploys the scooter cache (a path matched by `server/deploy-watch-paths.txt`; see DEPLOY.md). Norway's night bans run 23:00–05:00, and Sentry watches for 30 minutes after them. A restart takes each feed's state at that moment as its baseline, so a feed its operator took down for the ban (Dott in Trondheim) would not be reported if it never came back. Push after 05:30, or put `[skip cd]` in every commit message of the push: the next push that deploys the cache carries the change. The website's own changes are not affected.

# Map layers

Draw shapes on the map with SVG (`L.svg`), not `L.canvas`. leaflet-rotate 0.2.4 patches `L.Renderer.prototype.onAdd` to read the map it is handed, and Leaflet 1.9.4's canvas calls it without one, so adding a canvas layer throws. The walk's route and the zones are SVG for this reason.
