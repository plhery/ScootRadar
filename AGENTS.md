<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Committing

When a change is done and the checks pass, commit it and push straight to `main`; no branch or pull request is needed. It deploys once CI passes on it, about 15 minutes later, and not at all if CI fails (DEPLOY.md, "Deploys wait for CI"): fix a red run forward. CI runs one commit of `main` at a time: a commit pushed during a run waits for it, up to 15 minutes more, and a later push cancels that waiting run and carries the commit, which is not a failure.

The scooter cache deploys at any hour, in Norway's night bans (23:00–05:00) too: it keeps the feed states Sentry waits on across a restart, so a feed its operator takes down for the ban (Dott in Trondheim) is still reported if it doesn't come back (docs/OBSERVABILITY.md). To hold back a change to the cache (a path matched by `server/deploy-watch-paths.txt`; see DEPLOY.md), put `[skip cd]` in its commit message: the next commit that passes without it carries the change. The website's own changes are not affected.

# iOS tests

Run the simulator tests with `-parallel-testing-enabled NO`, or `-parallel-testing-worker-count 2` at most (the command is in ios/README.md, "Tests"). The scheme otherwise tests on clones of the shared simulator, each downloading about 1.9 GB of Siri and Apple Intelligence assets: on 26 October 2026 one run made five, 9 GB in ten minutes, and left the Mac 256 MB.

# Map layers

Draw shapes on the map with SVG (`L.svg`), not `L.canvas`. leaflet-rotate 0.2.4 patches `L.Renderer.prototype.onAdd` to read the map it is handed, and Leaflet 1.9.4's canvas calls it without one, so adding a canvas layer throws. The walk's route and the zones are SVG for this reason.
