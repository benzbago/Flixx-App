import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { initDetailsPage } from "../../js/pages/details.js";

test("rejects invalid IDs without requesting data", async () => {
  const dom = new JSDOM('<main id="show-details"></main>', {
    url: "https://flixx.test/tv-details.html?id=bad",
  });
  let calls = 0;
  await initDetailsPage({
    type: "tv",
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData: async () => {
      calls += 1;
    },
    loading: { track: (value) => value },
    storage: dom.window.localStorage,
  });
  assert.equal(calls, 0);
  assert.match(dom.window.document.body.textContent, /invalid/i);
});

test("renders nullable show fields without crashing or unsafe homepage links", async () => {
  const dom = new JSDOM('<main id="show-details"></main>', {
    url: "https://flixx.test/tv-details.html?id=9",
  });
  await initDetailsPage({
    type: "tv",
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData: async () => ({
      id: 9,
      name: "<img onerror=x>",
      genres: null,
      production_companies: null,
      last_episode_to_air: null,
      homepage: "javascript:alert(1)",
    }),
    loading: { track: (value) => value },
    storage: dom.window.localStorage,
  });
  assert.match(
    dom.window.document.body.textContent,
    /Last episode unavailable/,
  );
  assert.equal(
    dom.window.document.querySelector('a[href^="javascript"]'),
    null,
  );
  assert.equal(dom.window.document.querySelectorAll("img").length, 1);
});

test("watchlist button adds and removes the current title", async () => {
  const dom = new JSDOM('<main id="movie-details"></main>', {
    url: "https://flixx.test/movie-details.html?id=3",
  });
  await initDetailsPage({
    type: "movie",
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData: async () => ({
      id: 3,
      title: "Dune",
      genres: [],
      production_companies: [],
    }),
    loading: { track: (value) => value },
    storage: dom.window.localStorage,
  });
  const button = dom.window.document.querySelector(".watchlist-toggle");
  assert.equal(button.textContent, "Add to Watchlist");
  button.click();
  assert.equal(button.textContent, "Remove from Watchlist");
  button.click();
  assert.equal(button.textContent, "Add to Watchlist");
});
