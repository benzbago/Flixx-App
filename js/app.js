import { fetchTMDB } from "./api.js";
import { createLoadingManager } from "./state.js";
import { initDetailsPage } from "./pages/details.js";
import { initHomePage } from "./pages/home.js";
import { initPopularPage } from "./pages/popular.js";
import { initSearchPage } from "./pages/search.js";
import { createTrailerModal } from "./trailer.js";
import { renderWatchlistPage } from "./watchlist.js";
import { createSliderController } from "./slider.js";

function highlightActiveLink(documentRef, pathname) {
  documentRef.querySelectorAll(".nav-link").forEach((link) => {
    const target = new URL(link.href, location.origin).pathname;
    if (target === pathname || (pathname === "/index.html" && target === "/"))
      link.classList.add("active");
  });
}

export async function initApp({
  documentRef = document,
  locationRef = location,
  fetchData = fetchTMDB,
} = {}) {
  const spinner = documentRef.querySelector(".spinner");
  const loading = createLoadingManager(spinner);
  highlightActiveLink(documentRef, locationRef.pathname);
  const storage = window.localStorage;
  let feedback = documentRef.querySelector("#app-feedback");
  if (!feedback) {
    feedback = documentRef.createElement("div");
    feedback.id = "app-feedback";
    feedback.className = "sr-only";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    documentRef.body.prepend(feedback);
  }
  const shared = {
    documentRef,
    locationRef,
    fetchData,
    loading,
    storage,
    feedback,
  };

  switch (locationRef.pathname) {
    case "/":
    case "/index.html": {
      const trailer = createTrailerModal({
        documentRef,
        fetchData: (...args) => loading.track(fetchData(...args)),
      });
      return initHomePage({
        ...shared,
        openTrailer: trailer.open,
        createSwiper: () =>
          createSliderController({
            button: documentRef.querySelector("#slider-autoplay-toggle"),
            prefersReducedMotion: window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches,
            createSwiper: (options) => new window.Swiper(".swiper", options),
          }),
      });
    }
    case "/shows.html":
      return initPopularPage({
        ...shared,
        type: "tv",
        container: documentRef.querySelector("#popular-shows"),
      });
    case "/movie-details.html":
      return initDetailsPage({
        ...shared,
        type: "movie",
        storage,
      });
    case "/tv-details.html":
      return initDetailsPage({ ...shared, type: "tv", storage });
    case "/search.html":
      return initSearchPage(shared);
    case "/watchlist.html":
      return renderWatchlistPage({
        container: documentRef.querySelector("#watchlist"),
        storage,
        documentRef,
      });
    default:
      return undefined;
  }
}

document.addEventListener("DOMContentLoaded", () => initApp());
