import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createMediaCard, createStatus } from "../../js/dom.js";

test("renders hostile API text literally", () => {
  const { document } = new JSDOM("<body></body>").window;
  const card = createMediaCard(
    { id: 7, title: "<img src=x onerror=alert(1)>", poster_path: null },
    "movie",
    document,
  );
  assert.equal(
    card.querySelector(".card-title").textContent,
    "<img src=x onerror=alert(1)>",
  );
  assert.equal(card.querySelectorAll("img").length, 1);
  assert.equal(
    card.querySelector("img").getAttribute("src"),
    "images/no-image.jpg",
  );
});

test("falls back when a remote poster breaks", () => {
  const { document, Event } = new JSDOM("<body></body>").window;
  const image = createMediaCard(
    { id: 7, title: "Dune", poster_path: "/dune.jpg" },
    "movie",
    document,
  ).querySelector("img");
  image.dispatchEvent(new Event("error"));
  assert.equal(image.getAttribute("src"), "images/no-image.jpg");
});

test("poster images reserve space to reduce layout shifts", () => {
  const { document } = new JSDOM("<body></body>").window;
  const image = createMediaCard(
    { id: 7, title: "Dune" },
    "movie",
    document,
  ).querySelector("img");
  assert.equal(image.getAttribute("width"), "500");
  assert.equal(image.getAttribute("height"), "750");
  assert.equal(image.getAttribute("loading"), "lazy");
});

test("renders normalized TV watchlist titles", () => {
  const { document } = new JSDOM("<body></body>").window;
  const card = createMediaCard(
    { id: 9, title: "Saved Show", poster_path: null },
    "tv",
    document,
  );
  assert.equal(card.querySelector(".card-title").textContent, "Saved Show");
});

test("card watchlist control reflects saved state and announces changes", () => {
  const { document } = new JSDOM('<body><div id="feedback"></div></body>')
    .window;
  let saved = false;
  const watchlist = {
    has: () => saved,
    add: () => {
      saved = true;
      return true;
    },
    remove: () => {
      saved = false;
      return true;
    },
  };
  const card = createMediaCard({ id: 4, title: "Dune" }, "movie", document, {
    watchlist,
    feedback: document.querySelector("#feedback"),
  });
  const button = card.querySelector(".card-watchlist-toggle");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.match(document.querySelector("#feedback").textContent, /added/i);
});

test("watchlist card status control keeps accessible labels and stored values", () => {
  const { document } = new JSDOM("<body></body>").window;
  const card = createMediaCard(
    { id: 4, title: "Dune", status: "want" },
    "movie",
    document,
    { onStatus: () => {} },
  );
  const label = card.querySelector(".watchlist-status-label");
  const select = card.querySelector(".watchlist-status");

  assert.equal(label.control, select);
  assert.deepEqual(
    [...select.options].map(({ value, textContent }) => [value, textContent]),
    [
      ["want", "Want to Watch"],
      ["watched", "Watched"],
    ],
  );
  assert.equal(select.value, "want");
});

test("card actions share a dedicated bottom action area", () => {
  const { document } = new JSDOM("<body></body>").window;
  const card = createMediaCard(
    { id: 4, title: "A Very Long Movie Title", status: "want" },
    "movie",
    document,
    {
      onRemove: () => {},
      onStatus: () => {},
    },
  );
  const actions = card.querySelector(".card-actions");

  assert.ok(actions);
  assert.equal(actions.parentElement, card.querySelector(".card-body"));
  assert.equal(actions.querySelector(".watchlist-remove") !== null, true);
  assert.equal(actions.querySelector(".watchlist-status") !== null, true);
});

test("creates an accessible retry state", () => {
  const { document } = new JSDOM('<main id="target"></main>').window;
  const target = document.querySelector("#target");
  let retried = false;
  createStatus(
    target,
    {
      kind: "error",
      message: "Offline",
      onRetry: () => {
        retried = true;
      },
    },
    document,
  );
  assert.equal(target.getAttribute("aria-live"), "assertive");
  assert.equal(target.textContent.includes("Offline"), true);
  target.querySelector("button").click();
  assert.equal(retried, true);
});
