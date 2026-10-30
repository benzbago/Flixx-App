# Flixx Portfolio-Ready Design

## Intent

Turn the current `b5d2994` Flixx learning project into a dependable, accessible portfolio project deployable on Netlify's free plan. Preserve its HTML/CSS/vanilla JavaScript identity, pages, visual style, and course attribution while clearly identifying the featured hero, trailer modal, reliability work, and watchlist as Benz Bago's additions.

## Constraints

- Start from the current local repository at `b5d2994`; remote state is unverified because GitHub access is unavailable.
- Work on `feat/flixx-portfolio-ready` without commits, pushes, merges, history rewrites, or deployment.
- Use no paid service, account system, or database.
- Keep TMDB credentials server-side in a Netlify environment variable.
- Make local tests deterministic with mocked responses; do not require a real TMDB credential.
- Preserve unrelated work and the existing visual identity.

## Goals

- Make every API-driven page resilient to HTTP, authentication, missing-resource, rate-limit, network, malformed-response, empty-data, and missing-field conditions.
- Provide visible loading, error, empty, and retry states without spinner races.
- Render untrusted API/search data with safe DOM construction and validate outbound URLs.
- Make search pagination transactional: one request at a time, stable query context, state updated only on success.
- Share a single now-playing request between the hero and slider, inserting all slides before one Swiper initialization.
- Add a persistent, local-only watchlist with add/remove controls and an empty state.
- Add automated unit and browser-level coverage, lint/format checks, Netlify configuration, and deployment documentation.

## Non-goals and Anti-goals

- No framework, bundler-driven rewrite, authentication, cross-device sync, database, analytics, or paid API.
- No visual redesign or replacement of the course's core features.
- No exposed TMDB secret, unsafe HTML injection, silent failures, or misleading successful state after a failed request.

## Approaches Considered

### Selected: Netlify Function proxy plus modular vanilla JavaScript

The browser calls `/.netlify/functions/tmdb` with an allowlisted TMDB path and query parameters. The function reads `TMDB_API_KEY`, validates inputs, forwards to TMDB, and returns normalized error responses. Browser code is split into small vanilla modules for API access, safe rendering, state, and watchlist behavior. This provides the strongest credential handling and testability while remaining compatible with Netlify's free plan.

### Rejected: browser-visible TMDB key

This is simpler but exposes the credential in source and browser requests, which conflicts with the reliability/security objective.

### Rejected: third-party public TMDB proxy

This removes local serverless code but creates an unnecessary external dependency with unclear availability, privacy, and rate limits.

## Design

### Serverless boundary

`netlify/functions/tmdb.js` accepts only `GET`. It validates the requested endpoint against the movie, TV, search, and video routes used by Flixx; rejects path traversal and unsupported query keys; reads `TMDB_API_KEY`; and calls TMDB with a timeout. It maps upstream status codes into safe JSON errors while preserving useful categories (configuration/authentication, not found, rate limited, upstream/network failure, malformed response). The response will include conservative caching headers for successful public catalog data and no credential values.

`netlify.toml` publishes the repository root and declares the functions directory. An `.env.example` names the required variable without containing a secret. Local development instructions use Netlify CLI as an optional free development tool; automated tests invoke the handler directly with mocked `fetch`.

### Frontend data and state

The browser API client constructs proxy URLs with `URL`/`URLSearchParams`, checks `response.ok`, validates JSON shape, throws categorized application errors, and wraps requests in a reference-counted loading manager whose decrement is always in `finally`.

Homepage initialization starts now-playing and popular requests independently. The now-playing promise is consumed once, then its validated result feeds both hero and slider. All slider nodes are inserted before a single Swiper instance is created. Each content region owns its loading/error/empty/retry state so one failure does not erase working content elsewhere.

Detail pages parse IDs with `URLSearchParams`, accept positive integer IDs only, and avoid a request for invalid input. Missing values receive human-readable fallbacks. Images use a local placeholder both when paths are absent and when remote images fail. Backdrops are omitted when absent. Homepage buttons are shown only for validated `http:` or `https:` URLs and use safe external-link attributes.

Search validates `type` against `movie`/`tv`, trims the term, and keeps an immutable request context. Pagination disables controls while a request is active, ignores overlapping requests, and commits the page/total state only after success. All user/API strings are assigned through `textContent`; elements and attributes are created explicitly. The results heading remains a single heading, and radio labels target the correct inputs.

### Watchlist

The watchlist stores a versioned, minimal snapshot in `localStorage`: media type, numeric ID, title, poster path, and relevant date. Movie and TV detail pages show an Add/Remove Watchlist button reflecting current state. A new `watchlist.html` page uses the existing header, card grid, footer, placeholder images, and safe card renderer; it supports removal in place and presents an explanatory empty state. Corrupt or unavailable storage fails safely to an empty list. This is intentionally browser-local and requires no account.

### Accessibility and trailer reliability

Status messages use appropriate live-region semantics. Retry and watchlist controls are keyboard-operable. The trailer modal restores focus to its opener, moves focus to the close control, closes on Escape/backdrop, validates YouTube keys, and shows retry/error/empty states without unsafe HTML.

### Testing and quality

Add a minimal npm development setup using Node's built-in test runner and jsdom for DOM behavior. Tests cover proxy validation/status mapping, API error classification, loading reference counts, URL/ID/search validation, safe rendering, missing fields/images, now-playing sharing, Swiper initialization count, pagination locking/rollback, watchlist persistence/corruption, and trailer selection. Browser smoke tests use mocked proxy responses to cover the home, search, details, watchlist, loading/error/retry, and empty flows without a TMDB key. Formatting and linting remain development-only and do not alter the runtime stack.

## Documentation

The README will explicitly separate course-derived features from original improvements, retain Brad Traversy/Modern JavaScript From the Beginning 2.0 attribution, document the unverified remote/commit limitation, explain local mocked testing, and give Netlify environment-variable, build/publish, and function setup steps. It will also note which live integration checks require a real TMDB key and were not run.

## Success Criteria

- Automated tests and static quality checks pass locally using mocks.
- No TMDB credential appears in tracked source or browser requests.
- Every requested prior-review item is either fixed or documented as no longer applicable.
- All pages retain their recognizable Flixx appearance and work at direct Netlify URLs.
- Git ends on `feat/flixx-portfolio-ready` with changes uncommitted and nothing pushed or deployed.
