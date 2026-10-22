# Contributing

Thanks for helping out. Bug reports, fixes, docs and new providers are all welcome.

For anything bigger than a fix, open an issue first so we can agree on the approach before you spend time on it. That goes especially for new options, changes to the default behaviour, and anything that touches the public API.

## Setup

You need Node.js 22 or newer (CI uses 24).

```bash
npm install
npm test            # unit tests with Vitest, npm run test:watch keeps them running
npm run lint        # types, ESLint and Prettier
npm run build       # the bundles in dist and the types
```

A pre-commit hook (husky and lint-staged) type-checks, lints and formats the staged files. Please don't skip it.

## Tests

- unit tests live next to the code in `src/**/__tests__` and run with Vitest and happy-dom.
- requests to providers are answered with recorded responses through MSW, nothing goes to the network. A request without a handler fails the test.
- a fix comes with a test that fails without it. A new option comes with tests for the default and for the option.
- the end-to-end tests in `e2e/` run the built bundles in a real browser with Playwright:

```bash
npx playwright install chromium   # once
npm run build
npm run test:e2e
```

Locally an installed browser works too: `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e` (or `chrome`).

Before you open a PR, run what CI runs:

```bash
npm run ci:tsc && npm run ci:lint && npm test
npm run build && npm run ci:package && npm run ci:package-types
```

## Docs

The docs site lives in `website/` and is built with Rspress. It uses the package from `dist`, so run `npm run build` again after changing the source and reload the page.

```bash
npm install --prefix website
npm run docs:dev    # builds the package and starts the docs site
```

- a new option goes into the options table on the Leaflet Control page and into the README.
- the `<Map>` component shows a live demo: `<Map provider="OpenStreetMap" controlOptions={{ ... }} />`, or `providers={[...]}` for several.
- for before/after examples, mark lines with `// [!code --]` and `// [!code ++]`, and put `{/* prettier-ignore */}` above the code block. Otherwise Prettier moves the markers to their own lines.
- a change users have to act on goes into the upgrade notes of the next major in `website/docs/upgrading/`.

## Providers

A provider is a class with a `search({ query })` method that returns results like `{ x, y, label, bounds, raw }`. Most providers extend `JsonProvider` and only implement `endpoint()` and `parse()`, see `src/providers/` for examples.

A new provider needs:

- the provider in `src/providers/`, exported from `src/providers/index.ts` and `src/index.ts`
- a test with a recorded response of the real service in `src/providers/__tests__/`
- a docs page in `website/docs/providers/`, an entry in its `_meta.json` and in `website/components/providers.ts` for the demo
- a line in the provider list of the README

We don't add providers of Russian companies (see #414). You're welcome to publish such a provider as its own package, for example `leaflet-geosearch-yandex-provider`.

## Compatibility

- the public API (exports, options, events, methods) doesn't lose or rename anything outside a major release.
- new behaviour comes as an option that is off by default. A fix may change behaviour, but say why in the commit message.
- the bundles target ES2016 and work with Leaflet 1.6 and newer. Don't use language features or APIs from ES2017 or later in `src`, like `Object.fromEntries` or `Promise.allSettled`.
- the package has no side effects on import. Keep it that way, bundlers rely on it to drop unused providers.

## Commits and pull requests

We use [Conventional Commits](https://www.conventionalcommits.org). PRs are squash merged and the PR title becomes the commit message, so the title has to follow the format too. The release is made from it:

| Type                                        | Release               |
| ------------------------------------------- | --------------------- |
| `feat:`                                     | minor (4.4.0 → 4.5.0) |
| `fix:`, `perf:`                             | patch (4.4.0 → 4.4.1) |
| `docs:`, `test:`, `ci:`, `build:`, `chore:` | none                  |

Use `feat:` or `fix:` for anything users should get with the next release, also when it's mostly docs. A breaking change (`feat!:` or a `BREAKING CHANGE:` footer) makes a major release, so please talk to us in an issue first.

Inside a PR, small commits that each do one thing make the review easier. Write in the message what changed and why, and close issues with a line per issue: `Closes #0000`.

Releases are published from GitHub Actions after a maintainer approves them.
