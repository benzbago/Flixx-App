import { apiErrorMessage } from "../api.js";
import {
  createElement,
  createMediaCard,
  createSafeImage,
  createStatus,
} from "../dom.js";
import { formatDate, imageUrl, mediaTitle } from "../utils.js";
import { createWatchlist } from "../watchlist.js";

export function renderHero(
  container,
  movie,
  { documentRef = document, openTrailer } = {},
) {
  if (!movie)
    return createStatus(
      container,
      { kind: "empty", message: "No featured movie is available right now." },
      documentRef,
    );
  container.replaceChildren();
  const hero = createElement(
    "div",
    { className: "featured-hero" },
    documentRef,
  );
  if (movie.backdrop_path)
    hero.style.backgroundImage = `url("${imageUrl(movie.backdrop_path, "w1280")}")`;
  const content = createElement(
    "div",
    { className: "featured-content" },
    documentRef,
  );
  content.append(
    createElement(
      "span",
      { className: "featured-label", text: "FEATURED MOVIE" },
      documentRef,
    ),
  );
  content.append(
    createElement("h1", { text: mediaTitle(movie, "movie") }, documentRef),
  );
  content.append(
    createElement(
      "p",
      {
        className: "featured-rating",
        text: `★ ${Number(movie.vote_average || 0).toFixed(1)} / 10 | ${formatDate(movie.release_date)}`,
      },
      documentRef,
    ),
  );
  content.append(
    createElement(
      "p",
      {
        className: "featured-overview",
        text: movie.overview || "No overview is available.",
      },
      documentRef,
    ),
  );
  const actions = createElement(
    "div",
    { className: "featured-actions" },
    documentRef,
  );
  const trailer = createElement(
    "button",
    {
      className: "btn featured-play",
      text: "▶ Watch Trailer",
      attributes: { type: "button" },
    },
    documentRef,
  );
  trailer.addEventListener("click", () => openTrailer?.(movie.id, trailer));
  const details = createElement(
    "a",
    {
      className: "btn featured-details",
      text: "ⓘ More Details",
      attributes: { href: `movie-details.html?id=${Number(movie.id)}` },
    },
    documentRef,
  );
  actions.append(trailer, details);
  content.append(actions);
  hero.append(content);
  container.append(hero);
}

export function renderSlider(
  container,
  movies,
  { documentRef = document, createSwiper } = {},
) {
  container.replaceChildren();
  if (!movies.length)
    return createStatus(
      container,
      { kind: "empty", message: "No now-playing movies are available." },
      documentRef,
    );
  movies.forEach((movie) => {
    const slide = createElement(
      "div",
      { className: "swiper-slide" },
      documentRef,
    );
    const link = createElement(
      "a",
      { attributes: { href: `movie-details.html?id=${Number(movie.id)}` } },
      documentRef,
    );
    link.append(
      createSafeImage(
        imageUrl(movie.poster_path),
        mediaTitle(movie, "movie"),
        documentRef,
      ),
    );
    slide.append(
      link,
      createElement(
        "p",
        {
          className: "swiper-rating",
          text: `★ ${Number(movie.vote_average || 0).toFixed(1)} / 10`,
        },
        documentRef,
      ),
    );
    container.append(slide);
  });
  createSwiper?.();
}

export async function initHomePage({
  documentRef = document,
  fetchData,
  loading,
  createSwiper,
  openTrailer,
  storage,
  feedback,
}) {
  const hero = documentRef.querySelector("#featured-movie");
  const slider = documentRef.querySelector(".swiper-wrapper");
  const popular = documentRef.querySelector("#popular-movies");
  const watchlist = createWatchlist(storage);
  const loadNowPlaying = async () => {
    try {
      const data = await loading.track(fetchData("movie/now_playing"));
      const movies = Array.isArray(data.results) ? data.results : [];
      renderHero(
        hero,
        movies.find((movie) => movie.backdrop_path && movie.overview) ||
          movies[0],
        { documentRef, openTrailer },
      );
      renderSlider(slider, movies, { documentRef, createSwiper });
    } catch (error) {
      const retry = () => loadNowPlaying();
      createStatus(
        hero,
        { kind: "error", message: apiErrorMessage(error), onRetry: retry },
        documentRef,
      );
      createStatus(
        slider,
        { kind: "error", message: apiErrorMessage(error), onRetry: retry },
        documentRef,
      );
    }
  };
  const loadPopular = async () => {
    try {
      const data = await loading.track(fetchData("movie/popular"));
      const movies = Array.isArray(data.results) ? data.results : [];
      popular.replaceChildren();
      if (!movies.length)
        return createStatus(
          popular,
          { kind: "empty", message: "No popular movies are available." },
          documentRef,
        );
      movies.forEach((movie) =>
        popular.append(
          createMediaCard(movie, "movie", documentRef, {
            watchlist,
            feedback,
          }),
        ),
      );
    } catch (error) {
      createStatus(
        popular,
        {
          kind: "error",
          message: apiErrorMessage(error),
          onRetry: loadPopular,
        },
        documentRef,
      );
    }
  };
  await Promise.all([loadNowPlaying(), loadPopular()]);
}
