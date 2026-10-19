# Contributing

Thanks for helping improve ScootRadar.

## Before you start

- Search existing issues and pull requests before opening a duplicate.
- Keep changes focused and explain user-visible behavior.
- Do not add provider feeds without documenting their redistribution terms.
- Do not commit credentials, `.env` files, signing material, device identifiers,
  or precise user-location data.

## Development workflow

1. Fork or clone the repository.
2. Create a branch from `main`.
3. Install dependencies with `npm ci`.
4. Make the change and add proportionate tests.
5. Run:

   ```bash
   npm run check:dependencies
   npm run check:providers
   npm run check:api-contract
   npm run lint
   npm test
   npm run build
   npm run test:e2e
   ```

6. If native code changed, run the `ScootRadar` unit-test scheme in Xcode.
7. Open a pull request using the repository template.

The dependency check fails on moderate or higher npm advisories. Its only
exception is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
in the development-only `eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces@3.0.3` chain: upstream has no patched release,
and these tools read repository-controlled glob patterns during linting. The
exception also covers npm's inherited findings along that chain, but rejects
other advisories and any production dependency affected by this advisory.
Remove the exception when a patched upstream release is available.

Provider names, colors, marker labels, and upstream system-ID matches live in
`data/providers.json`. After editing that catalog, run `npm run
generate:providers` and commit both generated TypeScript and Swift files.
The same generator writes the service areas of every covered country, which
the iPhone app's provider filters read too, so run it after changing a
service-area catalog as well. [Adding a country](docs/adding-a-country.md)
walks through a new country's catalog and entry.

The public scooter response is defined by `data/scooter-api.schema.json`.
After changing it, run `npm run generate:api-contract` and commit the generated
TypeScript and Swift payload files with the schema.

## Style and scope

- Follow the existing TypeScript, React, Swift, and SwiftUI conventions.
- Keep the map usable without an account.
- Preserve accessibility, localization, privacy, and upstream fair-use behavior.
- Use source attribution anywhere new data is displayed.

By contributing, you agree that your contribution is licensed under the MIT
License included in this repository.
