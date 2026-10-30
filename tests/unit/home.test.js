import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { initHomePage } from "../../js/pages/home.js";

test("shares one now-playing request and initializes Swiper once after slides", async () => {
  const dom = new JSDOM(
    '<section id="featured-movie"></section><div class="swiper"><div class="swiper-wrapper"></div></div><div id="popular-movies"></div>',
  );
  const calls = [];
  let swiperCount = 0;
  let slidesAtInit = 0;
  const fetchData = async (path) => {
    calls.push(path);
    return {
      results: [
        {
          id: 1,
          title: "Movie",
          overview: "Story",
          backdrop_path: "/b.jpg",
          poster_path: null,
          vote_average: 8,
          release_date: "",
        },
      ],
    };
  };
  await initHomePage({
    documentRef: dom.window.document,
    fetchData,
    loading: { track: (value) => value },
    createSwiper: () => {
      swiperCount += 1;
      slidesAtInit =
        dom.window.document.querySelectorAll(".swiper-slide").length;
    },
    openTrailer: () => {},
  });
  assert.equal(calls.filter((path) => path === "movie/now_playing").length, 1);
  assert.equal(swiperCount, 1);
  assert.equal(slidesAtInit, 1);
  assert.equal(
    dom.window.document.querySelector(".swiper-slide img").getAttribute("src"),
    "images/no-image.jpg",
  );
  assert.match(
    dom.window.document.querySelector("#featured-movie").textContent,
    /Date unknown/,
  );
});

test("renders retry independently when now-playing fails", async () => {
  const dom = new JSDOM(
    '<section id="featured-movie"></section><div class="swiper"><div class="swiper-wrapper"></div></div><div id="popular-movies"></div>',
  );
  await initHomePage({
    documentRef: dom.window.document,
    fetchData: async (path) => {
      if (path.includes("now_playing"))
        throw Object.assign(new Error(), { code: "network" });
      return { results: [] };
    },
    loading: { track: (value) => value },
    createSwiper: () => {},
    openTrailer: () => {},
  });
  assert.equal(
    dom.window.document.querySelector("#featured-movie button").textContent,
    "Retry",
  );
  assert.match(
    dom.window.document.querySelector(".swiper-wrapper").textContent,
    /offline/i,
  );
  assert.match(
    dom.window.document.querySelector("#popular-movies").textContent,
    /No popular movies/i,
  );
});
