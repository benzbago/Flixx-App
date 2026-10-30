# Flixx Portfolio-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a reliable, accessible, portfolio-ready Flixx app with a server-side TMDB proxy and browser-local watchlist.

**Architecture:** A Netlify Function is the only TMDB boundary and a small set of browser ES modules owns validation, API state, safe DOM rendering, and watchlist persistence. Page controllers compose those modules while retaining the current HTML/CSS design and vendor libraries.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Netlify Functions, Node.js test runner, jsdom, Playwright, ESLint, Prettier

**Spec:** `docs/superpowers/specs/2026-10-30-flixx-portfolio-ready-design.md`

## Global Constraints

- Start from local commit `b5d2994`; do not reconcile the unavailable remote or missing prior-review commit.
- Work only on `feat/flixx-portfolio-ready` and do not commit, push, merge, rewrite history, or deploy.
- Keep the runtime frontend HTML, CSS, and vanilla JavaScript; use no paid API, account system, or database.
- Keep `TMDB_API_KEY` server-side and test without credentials through mocked responses.
- Preserve the visual identity, working pages, course attribution, hero, and trailer modal.

## Review Focus

- A proxy request containing encoded traversal or an unapproved endpoint must be rejected before upstream fetch; Task 1 tests both.
- Two simultaneous browser requests must keep the spinner visible until both settle, including rejection; Task 2 tests reference counting and `finally` cleanup.
- Corrupt or quota-blocked localStorage must not crash any page; Task 3 tests parse and write failures.
- Rapid pagination clicks must produce one request and retain the prior page after failure; Task 5 tests locking and transactional state.
- API strings containing HTML must render literally and never create executable nodes; Tasks 3 and 4 test hostile titles and trailer metadata.

---

### Task 1: Test Harness and Netlify TMDB Proxy

**Files:**

- Create: `package.json`, `netlify.toml`, `.env.example`
- Create: `netlify/functions/tmdb.js`
- Create: `tests/functions/tmdb.test.js`
- Modify: `.gitignore`

**Interfaces:**

- Consumes: Netlify event `{ httpMethod, queryStringParameters }` and injected/global `fetch`.
- Produces: `handler(event) -> Promise<{statusCode, headers, body}>`; proxy requests use query `path=<allowlisted endpoint>` plus supported TMDB query keys.

- [ ] Write failing function tests for missing configuration, non-GET methods, missing/invalid/traversal paths, unsupported queries, successful JSON, 401/404/429/5xx mappings, timeout/network failure, and invalid upstream JSON.
- [ ] Run `npm test -- tests/functions/tmdb.test.js`; confirm failures are caused by the missing handler behavior.
- [ ] Add the minimal npm test tooling and implement the validated, timed, server-side proxy plus Netlify/env configuration.
- [ ] Run the focused function tests and then `npm test`; expect zero failures.
- [ ] Do not commit; record Task 1 changes in the working tree.

### Task 2: Browser API Client, Validation, and Loading State

**Files:**

- Create: `js/api.js`, `js/state.js`, `js/utils.js`
- Create: `tests/unit/api.test.js`, `tests/unit/state.test.js`, `tests/unit/utils.test.js`

**Interfaces:**

- Produces: `fetchTMDB(path, params, options)`, `ApiError`, `createLoadingManager(spinner)`, `parseDetailId(search)`, `parseSearchContext(search)`, `safeExternalUrl(value)`, and display fallback helpers.

- [ ] Write failing tests for response categories, malformed payloads, URL construction (including absence of malformed `&=query`), abort/network errors, concurrent spinner cleanup, positive integer IDs, trimmed/validated search, safe external protocols, dates/numbers, and image fallbacks.
- [ ] Run the focused unit tests and verify expected failures.
- [ ] Implement the minimal modules with all loading decrements in `finally` and an immutable parsed search context.
- [ ] Run focused tests and the complete suite; expect zero failures.
- [ ] Do not commit; record Task 2 changes in the working tree.

### Task 3: Safe Shared Rendering and Watchlist Persistence

**Files:**

- Create: `js/dom.js`, `js/watchlist.js`, `watchlist.html`
- Create: `tests/unit/dom.test.js`, `tests/unit/watchlist.test.js`
- Modify: `index.html`, `shows.html`, `movie-details.html`, `tv-details.html`, `search.html`, `css/style.css`

**Interfaces:**

- Consumes: validated media summaries and `Storage`-compatible object.
- Produces: `createMediaCard(item, type)`, `createStatus(container, state)`, `createWatchlist(storage)`, `renderWatchlistPage()`, and versioned `flixx-watchlist` records.

- [ ] Write failing tests proving hostile text is literal, image errors select the local placeholder, broken/corrupt storage returns empty, add/remove is deduplicated by `type:id`, storage write failures are nonfatal, and the page supports removal/empty state.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement safe DOM construction, reusable state UI, localStorage persistence, watchlist navigation/page, and matching CSS.
- [ ] Run focused tests and the complete suite; expect zero failures.
- [ ] Do not commit; record Task 3 changes in the working tree.

### Task 4: Homepage and Trailer Controller

**Files:**

- Create: `js/pages/home.js`, `js/trailer.js`
- Create: `tests/unit/home.test.js`, `tests/unit/trailer.test.js`
- Modify: `index.html`, `css/style.css`
- Remove runtime use of: legacy homepage/trailer sections in `js/script.js`

**Interfaces:**

- Consumes: one `fetchTMDB('movie/now_playing')` promise and one popular-movies request.
- Produces: `initHomePage(dependencies)`, `renderHero`, `renderSlider`, and accessible `createTrailerModal` behavior.

- [ ] Write failing tests for one now-playing fetch shared by hero/slider, one Swiper initialization after all slides, missing posters/backdrops/dates, independent region errors/empty/retry, trailer selection, validated YouTube keys, focus entry/return, Escape/backdrop close, and literal hostile metadata.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement the homepage controller and accessible trailer module using safe DOM helpers.
- [ ] Run focused tests and the complete suite; expect zero failures.
- [ ] Do not commit; record Task 4 changes in the working tree.

### Task 5: Popular, Details, Search, and Pagination Controllers

**Files:**

- Create: `js/pages/popular.js`, `js/pages/details.js`, `js/pages/search.js`, `js/app.js`
- Create: `tests/unit/popular.test.js`, `tests/unit/details.test.js`, `tests/unit/search.test.js`
- Modify: all page HTML files, `css/style.css`
- Replace: `js/script.js` with compatibility-free module entry or remove it after all pages load `js/app.js`

**Interfaces:**

- Consumes: Task 2 API/validation and Task 3 rendering/watchlist interfaces.
- Produces: pathname-routed initialization, resilient movie/TV details, popular grids, and locked transactional pagination.

- [ ] Write failing tests for all page loading/error/empty/retry states, invalid IDs without fetch, null `last_episode_to_air`, missing arrays/numeric fields/backdrops/homepages, validated homepage links, corrected radio labels/single heading, trimmed search/type validation, hostile query/API text, overlap prevention, context preservation, and state rollback after failed pagination.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement controllers, page routing, HTML corrections, watchlist buttons, and safe fallbacks.
- [ ] Run focused tests and the complete suite; expect zero failures.
- [ ] Do not commit; record Task 5 changes in the working tree.

### Task 6: Browser Smoke Tests, Quality Gates, and Documentation

**Files:**

- Create: `playwright.config.js`, `tests/e2e/flixx.spec.js`, `eslint.config.js`, `.prettierignore`
- Modify: `package.json`, `README.md`, all modified source files as quality checks require

**Interfaces:**

- Consumes: complete application served through a local test server with mocked `/.netlify/functions/tmdb` responses.
- Produces: repeatable `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run format:check` workflows plus Netlify setup instructions.

- [ ] Write browser smoke tests for home success/shared data, retry after failure, search/pagination, nullable details, watchlist persistence/removal/empty state, keyboard modal behavior, and direct-page loading with mocked API responses.
- [ ] Run smoke tests and verify failures identify missing integration behavior or configuration.
- [ ] Add Playwright/configuration and correct only behaviors exposed by the smoke tests.
- [ ] Update README with attribution vs. original work, architecture, local/mock/live testing distinctions, `TMDB_API_KEY` setup, Netlify deployment settings, remote verification limitation, and any live checks not performed.
- [ ] Run formatting, lint, unit/integration tests, browser smoke tests, and a local production-like Netlify route check; expect zero failures except explicitly documented credential-dependent live checks.
- [ ] Inspect `git diff --check`, `git diff --stat`, `git status --short --branch`, and scan tracked/untracked content for accidental secrets.
- [ ] Do not commit, push, merge, rewrite history, or deploy; prepare the final verification report.

## Self-Review Result

All design sections map to Tasks 1–6. Interfaces use consistent proxy path, media identity, watchlist key, and page-controller boundaries. The plan adds explicit tests for each Review Focus item and preserves the user's prohibition on commits despite the generic workflow's normal commit checkpoints.

## Full-Prompt Gap Extension

The initial plan implemented the first two prompt sections plus a basic interpretation of later requirements. The complete eight-section prompt supplied afterward is now the binding acceptance criteria. Tasks 7–11 extend the existing implementation without rebuilding Tasks 1–6.

### Task 7: Complete Watchlist Domain and Card Controls

**Files:** Modify `js/watchlist.js`, `js/dom.js`, page controllers, `watchlist.html`, `css/style.css`; extend watchlist/DOM/browser tests.

- [ ] RED: cover combined `type:id` identity, want/watched status transitions, duplicates, filtering, card and detail controls, announcements, write failures, and preserving malformed raw data.
- [ ] GREEN: migrate valid v1 data in memory, refuse mutations while malformed data remains unresolved, expose recovery guidance without deleting/overwriting raw data, and render filterable status-aware cards.
- [ ] Verify focused tests, full unit suite, and watchlist browser journeys.

### Task 8: Complete Trailer Modal Isolation

**Files:** Modify `js/trailer.js`, `css/style.css`; extend trailer/browser tests.

- [ ] RED: cover Tab/Shift+Tab focus cycling, inert background, focus restoration, playback removal, close-before-response, and superseded requests.
- [ ] GREEN: add focus trap, inert/aria-hidden lifecycle, AbortController/request tokens, and stale-result guards.
- [ ] Verify focused tests, full unit suite, and keyboard browser journey.

### Task 9: Tighten Proxy Validation and Security Documentation

**Files:** Modify `netlify/functions/tmdb.js`, function tests, README.

- [ ] RED: reject invalid media IDs/types, page values outside 1–500, blank/oversized/control-character search terms, and query keys inappropriate for each endpoint.
- [ ] GREEN: validate each endpoint's exact query schema before fetch and document public-proxy abuse/rate-limit limitations and credential-scan scope.
- [ ] Verify function tests, suite, and a value-free environment/secret scan.

### Task 10: Presentation, Responsive, Metadata, and Credits

**Files:** Modify HTML/CSS/page modules; create favicon, approved TMDB logo asset, About/Credits page, screenshot assets, and related tests.

- [ ] RED: browser checks at narrow mobile, mobile, tablet, and desktop widths; autoplay pause control; reduced-motion behavior; focus visibility; direct refresh; metadata/credits presence.
- [ ] GREEN: responsive fixes, autoplay control, reduced-motion CSS/JS, explicit image dimensions, `w1280` backdrops, verified metadata, favicon, removal of generic social links, and official TMDB attribution/approved logo in Credits.
- [ ] Capture screenshots of the finished mocked interface at representative widths.
- [ ] Verify axe and responsive/browser suites.

### Task 11: CI, Documentation, and Final Acceptance Audit

**Files:** Create `.github/workflows/ci.yml`; modify README and test/configuration files.

- [ ] Add CI for reproducible install, lint, format, unit/function tests, Playwright browser install, and browser tests.
- [ ] Document every page, screenshot, free-plan considerations, local function development, watchlist limitations, credits, no live URL, and beginner deployment steps.
- [ ] Run all local checks, dependency audit, direct-refresh checks, and scoped credential scans without printing values.
- [ ] Produce the requirement-by-requirement implemented/verified/blocked/untested checklist, affected-file summary, suggested commits, and review/push commands without performing Git publication actions.
