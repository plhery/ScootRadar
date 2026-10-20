<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Committing

When a change is done and the checks pass, commit it and push straight to `main`; no branch or pull request is needed. It deploys once CI passes on it, about 15 minutes later, and not at all if CI fails (DEPLOY.md, "Deploys wait for CI"): fix a red run forward.

The scooter cache is not deployed between 23:00 and 05:30 Paris time. Norway's night bans run 23:00–05:00, and Sentry watches for 30 minutes after them. A restart takes each feed's state at that moment as its baseline, so a feed its operator took down for the ban (Dott in Trondheim) would not be reported if it never came back. CI's Deploy job holds back a change to the cache (a path matched by `server/deploy-watch-paths.txt`; see DEPLOY.md) whose CI passes in those hours, and the next commit that passes after 05:30 carries it; `[skip cd]` in every commit message holds it back the same way at any hour. So don't deploy the cache by hand then, from Coolify or with a push to `production-cache`. The website's own changes are not affected.

# Map layers

Draw shapes on the map with SVG (`L.svg`), not `L.canvas`. leaflet-rotate 0.2.4 patches `L.Renderer.prototype.onAdd` to read the map it is handed, and Leaflet 1.9.4's canvas calls it without one, so adding a canvas layer throws. The walk's route and the zones are SVG for this reason.
