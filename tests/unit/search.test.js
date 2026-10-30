import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { initSearchPage } from "../../js/pages/search.js";

function page(url) {
  return new JSDOM(
    '<h2 id="search-results-heading"></h2><div id="search-results"></div><div id="pagination"></div>',
    { url },
  );
}

test("shows validation error without fetching invalid search context", async () => {
  const dom = page(
    "https://flixx.test/search.html?type=person&search-term=Dune",
  );
  let calls = 0;
  await initSearchPage({
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData: async () => {
      calls += 1;
    },
    loading: { track: (value) => value },
  });
  assert.equal(calls, 0);
  assert.match(dom.window.document.body.textContent, /movie or TV/i);
});

test("prevents overlapping pagination and commits page only after success", async () => {
  const dom = page(
    "https://flixx.test/search.html?type=movie&search-term=%20Dune%20",
  );
  let calls = 0;
  let resolveSecond;
  const fetchData = async (_path, params) => {
    calls += 1;
    if (params.page === 1)
      return {
        page: 1,
        total_pages: 3,
        total_results: 2,
        results: [{ id: 1, title: "<b>Dune</b>" }],
      };
    return new Promise((resolve) => {
      resolveSecond = resolve;
    });
  };
  const controller = await initSearchPage({
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData,
    loading: { track: (value) => value },
  });
  const next = dom.window.document.querySelector("#next");
  next.click();
  next.click();
  assert.equal(calls, 2);
  assert.equal(controller.state.page, 1);
  resolveSecond({
    page: 2,
    total_pages: 3,
    total_results: 2,
    results: [{ id: 2, title: "Part Two" }],
  });
  await controller.pending;
  assert.equal(controller.state.page, 2);
  assert.equal(
    dom.window.document.querySelector("#search-results .card-title")
      .textContent,
    "Part Two",
  );
});

test("retains the current page when pagination fails", async () => {
  const dom = page("https://flixx.test/search.html?type=tv&search-term=Show");
  const controller = await initSearchPage({
    documentRef: dom.window.document,
    locationRef: dom.window.location,
    fetchData: async (_path, params) => {
      if (params.page === 1)
        return {
          page: 1,
          total_pages: 2,
          total_results: 1,
          results: [{ id: 1, name: "Show" }],
        };
      throw Object.assign(new Error("offline"), { code: "network" });
    },
    loading: { track: (value) => value },
  });
  dom.window.document.querySelector("#next").click();
  await controller.pending;
  assert.equal(controller.state.page, 1);
  assert.match(
    dom.window.document.querySelector("#pagination").textContent,
    /offline/i,
  );
});
