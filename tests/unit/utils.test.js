import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDate,
  formatNumber,
  imageUrl,
  parseDetailId,
  parseSearchContext,
  safeExternalUrl,
} from "../../js/utils.js";

test("accepts only positive integer detail IDs", () => {
  assert.equal(parseDetailId("?id=42"), 42);
  for (const search of [
    "",
    "?id=",
    "?id=0",
    "?id=-1",
    "?id=2.5",
    "?id=abc&x=1",
  ])
    assert.equal(parseDetailId(search), null);
});

test("trims search and validates movie or tv type", () => {
  assert.deepEqual(parseSearchContext("?type=movie&search-term=%20Dune%20"), {
    type: "movie",
    term: "Dune",
  });
  assert.equal(parseSearchContext("?type=person&search-term=Dune"), null);
  assert.equal(parseSearchContext("?type=tv&search-term=%20%20"), null);
});

test("allows only HTTP and HTTPS external URLs", () => {
  assert.equal(
    safeExternalUrl("https://example.com/a"),
    "https://example.com/a",
  );
  assert.equal(safeExternalUrl("http://example.com"), "http://example.com/");
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl(""), null);
});

test("provides stable display fallbacks", () => {
  assert.equal(formatDate(""), "Date unknown");
  assert.equal(formatDate("2024-03-01"), "March 1, 2024");
  assert.equal(formatNumber(null), "Unknown");
  assert.equal(formatNumber(1200), "1,200");
  assert.equal(imageUrl(null), "images/no-image.jpg");
  assert.equal(
    imageUrl("/poster.jpg"),
    "https://image.tmdb.org/t/p/w500/poster.jpg",
  );
});
