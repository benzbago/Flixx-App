# Screenshot provenance

These screenshots show the public Flixx deployment at [flixx-benz.netlify.app](https://flixx-benz.netlify.app). They were captured on **October 31, 2026 (Asia/Singapore)** with Playwright Chromium in a new isolated browser context.

All content is live production data returned through the deployed Netlify Function and TMDB API. No API fixtures or mocked responses were used. The watchlist was populated and its statuses changed through the visible application controls; the capture process did not write directly to `localStorage`.

| File                                                       | Viewport               | What it shows                                                                      | Source and limitations                                                                                                         |
| ---------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`home-desktop.png`](home-desktop.png)                     | 1440 × 1000            | Featured movie, trailer/detail actions, now-playing carousel, and autoplay control | Production. TMDB titles and artwork are time-dependent.                                                                        |
| [`search-results-desktop.png`](search-results-desktop.png) | 1440 × 1000, full page | Movie search for “Dune,” pagination, poster fallbacks, and card watchlist actions  | Production. The search returned 1,120 results at capture time; result order and count can change.                              |
| [`movie-details-desktop.png`](movie-details-desktop.png)   | 1440 × 1000, full page | Detail view for the 2021 movie **Dune** with metadata and watchlist controls       | Production. Metadata and imagery are supplied by TMDB and can change.                                                          |
| [`watchlist-desktop.png`](watchlist-desktop.png)           | 1440 × 1000, full page | Two movies and two TV shows with alternating Want to Watch and Watched states      | Production in an isolated browser profile. Entries are local to that temporary profile and were not synced or seeded directly. |
| [`home-mobile.png`](home-mobile.png)                       | 390 × 844              | Mobile navigation, featured hero, actions, and carousel controls                   | Production. This is a single representative narrow viewport, not every mobile device.                                          |

The browser's viewport was resized for the mobile capture after the desktop journey. Screenshots may include Netlify's deployment badge. Trailer playback was deliberately omitted from the final set because YouTube embed availability is external and a still image adds limited evidence beyond the modal regression tests.
