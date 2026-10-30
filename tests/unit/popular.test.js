import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { initPopularPage } from "../../js/pages/popular.js";

test("renders empty and retry states for popular TV", async () => {
  const dom = new JSDOM('<div id="popular-shows"></div>');
  let fail = false;
  await initPopularPage({
    type: "tv",
    container: dom.window.document.querySelector("div"),
    documentRef: dom.window.document,
    fetchData: async () => {
      if (fail) throw Object.assign(new Error(), { code: "network" });
      return { results: [] };
    },
    loading: { track: (value) => value },
  });
  assert.match(dom.window.document.body.textContent, /No popular TV shows/i);
  fail = true;
  await initPopularPage({
    type: "tv",
    container: dom.window.document.querySelector("div"),
    documentRef: dom.window.document,
    fetchData: async () => {
      throw Object.assign(new Error(), { code: "network" });
    },
    loading: { track: (value) => value },
  });
  assert.equal(
    dom.window.document.querySelector("button").textContent,
    "Retry",
  );
});
