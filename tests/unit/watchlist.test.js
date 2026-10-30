import assert from "node:assert/strict";
import test from "node:test";
import { createWatchlist } from "../../js/watchlist.js";

function memoryStorage(initial) {
  let value = initial;
  return {
    getItem: () => value ?? null,
    setItem: (_key, next) => {
      value = next;
    },
    raw: () => value,
  };
}

test("treats corrupt or unreadable storage as empty", () => {
  const corruptStorage = memoryStorage("{bad");
  const corrupt = createWatchlist(corruptStorage);
  assert.deepEqual(corrupt.all(), []);
  assert.equal(corrupt.issue, "malformed");
  assert.equal(corrupt.add({ type: "movie", id: 1, title: "Dune" }), false);
  assert.equal(corruptStorage.raw(), "{bad");
  assert.deepEqual(
    createWatchlist({
      getItem() {
        throw new Error("blocked");
      },
    }).all(),
    [],
  );
});

test("adds unique type and ID records and removes them", () => {
  const watchlist = createWatchlist(memoryStorage());
  const item = {
    type: "movie",
    id: 7,
    title: "<b>Dune</b>",
    poster_path: "/x.jpg",
    date: "2024-01-01",
  };
  assert.equal(watchlist.add(item), true);
  assert.equal(watchlist.add(item), true);
  assert.equal(watchlist.all().length, 1);
  assert.equal(watchlist.all()[0].key, "movie:7");
  assert.equal(watchlist.all()[0].status, "want");
  assert.equal(watchlist.has("movie", 7), true);
  assert.equal(watchlist.remove("movie", 7), true);
  assert.deepEqual(watchlist.all(), []);
});

test("keeps movie and TV IDs distinct and changes watch status", () => {
  const watchlist = createWatchlist(memoryStorage());
  watchlist.add({ type: "movie", id: 7, title: "Movie" });
  watchlist.add({ type: "tv", id: 7, title: "Show" });
  assert.deepEqual(
    watchlist.all().map((item) => item.key),
    ["movie:7", "tv:7"],
  );
  assert.equal(watchlist.setStatus("tv", 7, "watched"), true);
  assert.equal(watchlist.get("tv", 7).status, "watched");
  assert.equal(watchlist.setStatus("tv", 7, "invalid"), false);
});

test("filters by media type and status", () => {
  const watchlist = createWatchlist(memoryStorage());
  watchlist.add({ type: "movie", id: 1, title: "A", status: "watched" });
  watchlist.add({ type: "tv", id: 2, title: "B" });
  assert.deepEqual(
    watchlist.filter({ type: "movie" }).map((item) => item.title),
    ["A"],
  );
  assert.deepEqual(
    watchlist.filter({ status: "want" }).map((item) => item.title),
    ["B"],
  );
});

test("reports storage write failures without crashing", () => {
  const watchlist = createWatchlist({
    getItem: () => null,
    setItem() {
      throw new Error("quota");
    },
  });
  assert.equal(watchlist.add({ type: "tv", id: 4, title: "Show" }), false);
  assert.deepEqual(watchlist.all(), []);
});
