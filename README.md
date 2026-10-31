# Flixx

Flixx is a responsive movie and TV discovery app built with HTML, CSS, and vanilla JavaScript. It uses a Netlify Function to keep the TMDB API key off the client, supports resilient browsing and search states, and stores a private watchlist in the current browser.

**[Open the live demo](https://flixx-benz.netlify.app)** · [Read the portfolio case study](docs/portfolio-showcase.md)

![Flixx homepage showing a featured movie and the now-playing carousel](docs/screenshots/home-desktop.png)

## What it demonstrates

- Browse popular movies, popular TV shows, and a shared now-playing feed.
- Search movies or TV shows with validated inputs and protected pagination.
- View responsive detail pages with safe fallbacks for incomplete TMDB data.
- Open movie trailers in an accessible modal with focus trapping and stale-request protection.
- Save movies and shows to a browser-local watchlist, mark them **Want to Watch** or **Watched**, and filter by type or status.
- Recover from loading, empty, authentication, rate-limit, network, and invalid-response states with useful feedback and retry actions.
- Respect keyboard navigation and reduced-motion preferences, including manual carousel autoplay control.

## Project origin and authorship

The original project was built while following Brad Traversy's **Modern JavaScript From the Beginning 2.0** course. The course foundation includes the core Flixx pages, TMDB-backed browsing and search flow, detail views, pagination, styling, and Swiper carousel concept.

The featured-movie hero and trailer modal began as original additions. The portfolio-ready version extends the project further with the Netlify API proxy, shared request and safe-DOM utilities, robust error states, browser-local watchlist and statuses, accessibility work, responsive card system, security headers, automated tests, CI, metadata, and deployment documentation. See [Credits](#credits) and the in-app [`credits.html`](credits.html) page for attribution.

## Stack and architecture

| Layer        | Implementation                                                                                |
| ------------ | --------------------------------------------------------------------------------------------- |
| Frontend     | Semantic HTML, CSS, vanilla JavaScript ES modules                                             |
| Data         | TMDB API through `/.netlify/functions/tmdb`                                                   |
| Serverless   | Netlify Function with endpoint allowlisting, validation, timeouts, caching, and mapped errors |
| Local state  | Versioned `localStorage` watchlist; no accounts or database                                   |
| UI libraries | Swiper and Font Awesome                                                                       |
| Quality      | Node test runner, JSDOM, Playwright, axe-core, ESLint, Prettier, GitHub Actions               |

The browser never receives `TMDB_API_KEY`. Page modules call [`js/api.js`](js/api.js), which sends only allowlisted paths and query values to [`netlify/functions/tmdb.js`](netlify/functions/tmdb.js). Rendering helpers construct user-visible API text through DOM APIs. Watchlist data remains on the device and is handled conservatively if stored JSON is malformed.

## Run locally

Requirements: Node.js 22 or a compatible current LTS release, npm, and a free TMDB API key.

```bash
npm ci
cp .env.example .env
```

Set your key in `.env` without committing the file:

```text
TMDB_API_KEY=your_tmdb_v3_api_key
```

Run the site and Netlify Function together:

```bash
npx netlify-cli dev
```

Open the local URL printed by Netlify CLI. A plain static server can display the shell, but TMDB requests require the function runtime.

## Checks

```bash
npm run lint
npm run format:check
npm run test:unit
npm run test:e2e
```

The Playwright suite starts a local Netlify-compatible test server and uses mocked TMDB responses, so it does not need a live key. The committed GitHub Actions workflow runs linting, formatting, unit tests, and Chromium browser tests on pull requests and pushes to `main`.

## Deploy on Netlify

1. Import this repository into Netlify.
2. Keep the publish directory as `.` and the functions directory as `netlify/functions` (both are defined in `netlify.toml`).
3. Add `TMDB_API_KEY` under **Site configuration → Environment variables**.
4. Deploy, then exercise the homepage, search, detail, trailer, and watchlist flows against live TMDB data.

Do not prefix the key with `VITE_`, `PUBLIC_`, or expose it in frontend JavaScript. The function reduces accidental key exposure; it is not user authentication or a complete abuse-prevention system.

## Known limitations

- TMDB data, images, availability, and trailers can change or be missing.
- The watchlist is local to one browser profile and does not sync across devices.
- YouTube playback depends on the selected trailer remaining embeddable.
- The free Netlify plan can introduce cold starts and is subject to usage limits.
- No account system, personalization backend, or database is included by design.

## Credits

- Course foundation: Brad Traversy, **Modern JavaScript From the Beginning 2.0**.
- Movie and TV data and imagery: [The Movie Database (TMDB)](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Carousel: [Swiper](https://swiperjs.com/).
- Icons: [Font Awesome](https://fontawesome.com/).

Production screenshots and their provenance are documented in [`docs/screenshots/README.md`](docs/screenshots/README.md).
