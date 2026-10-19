# Flixx — Movies & TV Shows

Flixx is a movie and TV show discovery app built with HTML, CSS, and vanilla JavaScript. It uses The Movie Database (TMDB) API to retrieve movie and television information.

This is a learning and portfolio project based on Brad Traversy's Flixx tutorial. I added a **Featured Movie** section with a **Watch Trailer** feature that opens a player modal and plays an available YouTube trailer.

## Features

- Browse popular movies and popular TV shows
- Explore movies currently playing in theaters with a Swiper slider
- View movie details and TV show details
- Search for movies and TV shows
- Navigate paginated search results
- View a featured movie with its backdrop, rating, overview, and details link
- Play an available movie trailer in a modal from the Featured Movie section
- Close the trailer player to stop playback

## Built With

- HTML5
- CSS3
- JavaScript (ES6+)
- [TMDB API](https://developer.themoviedb.org/docs)
- [Swiper](https://swiperjs.com/)
- Font Awesome

## Run Locally

1. Clone or download this repository.
2. Get your own API key from [TMDB](https://www.themoviedb.org/settings/api).
3. Open `js/script.js` and find the API configuration near the top:

   ```js
   apiKey: 'YOUR_TMDB_API_KEY'
   ```

4. Replace `YOUR_TMDB_API_KEY` with your TMDB API key for local testing.
5. Serve the project using a local development server, such as the Live Server extension in VS Code, and open `index.html`.

**API key note:** This project makes TMDB requests from browser-side JavaScript, so a key placed in `js/script.js` is visible to anyone who can access the app. Do not commit a real key to a public repository. Keep the placeholder in the published source and configure your own key locally. For a deployed static demo, understand that a frontend key cannot be kept secret; use a backend proxy if the credential must remain private.

## Project Pages

- `index.html` — home page with the featured movie, now-playing slider, popular movies, and popular TV shows
- `movie-details.html` — movie details
- `tv-details.html` — TV show details
- `search.html` — search and paginated results

## Credits & Attribution

- **Tutorial:** Built while following Brad Traversy's Flixx tutorial. The original tutorial and its code are credited to Brad Traversy / Traversy Media. This repository includes my own added Featured Movie trailer playback feature.
- **Movie and TV data:** Provided by [TMDB](https://www.themoviedb.org/). This project is not endorsed or certified by TMDB.
- **Libraries:** Swiper and Font Awesome are third-party projects and retain their respective licenses and notices.

This repository is intended to showcase learning and practice. Please check the applicable tutorial/course terms before redistributing tutorial source code, and retain the relevant third-party license notices.

## Ideas for Future Improvements

- Add a favorites list saved with `localStorage`
- Improve loading, empty-result, and API-error states
- Add filters for genres, release year, or rating
- Improve accessibility and keyboard controls for the trailer modal
