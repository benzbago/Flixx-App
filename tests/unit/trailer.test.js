import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createTrailerModal, selectTrailer } from "../../js/trailer.js";

test("selects an official YouTube trailer and rejects unsafe keys", () => {
  const videos = [
    {
      site: "YouTube",
      type: "Trailer",
      official: false,
      key: "fallback_1",
      name: "Fallback",
    },
    {
      site: "YouTube",
      type: "Trailer",
      official: true,
      key: "official-2",
      name: "<b>Official</b>",
    },
    {
      site: "YouTube",
      type: "Trailer",
      official: true,
      key: "bad/key",
      name: "Bad",
    },
  ];
  assert.equal(selectTrailer(videos).key, "official-2");
  assert.equal(
    selectTrailer([{ site: "YouTube", type: "Trailer", key: "bad/key" }]),
    null,
  );
});

test("moves focus into modal and restores it on Escape", async () => {
  const dom = new JSDOM(
    '<main id="page"><button id="open">Open</button></main>',
    {
      pretendToBeVisual: true,
    },
  );
  const opener = dom.window.document.querySelector("#open");
  const modal = createTrailerModal({
    documentRef: dom.window.document,
    fetchData: async () => ({ results: [] }),
  });
  opener.focus();
  await modal.open(1, opener);
  assert.equal(dom.window.document.activeElement.id, "close-trailer");
  assert.equal(
    dom.window.document.querySelector("#page").hasAttribute("inert"),
    true,
  );
  dom.window.document.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(dom.window.document.activeElement, opener);
  assert.equal(
    dom.window.document.querySelector("#trailer-modal").hidden,
    true,
  );
  assert.equal(
    dom.window.document.querySelector("#page").hasAttribute("inert"),
    false,
  );
});

test("traps forward and backward focus inside the modal", async () => {
  const dom = new JSDOM('<button id="open">Open</button>', {
    pretendToBeVisual: true,
  });
  const modal = createTrailerModal({
    documentRef: dom.window.document,
    fetchData: async () => ({ results: [] }),
  });
  await modal.open(1, dom.window.document.querySelector("#open"));
  const extra = dom.window.document.createElement("button");
  extra.textContent = "Extra";
  dom.window.document.querySelector("#trailer-player").append(extra);
  extra.focus();
  extra.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
  );
  assert.equal(dom.window.document.activeElement.id, "close-trailer");
  dom.window.document.querySelector("#close-trailer").dispatchEvent(
    new dom.window.KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
    }),
  );
  assert.equal(dom.window.document.activeElement, extra);
});

test("ignores a late response after close", async () => {
  const dom = new JSDOM('<button id="open">Open</button>', {
    pretendToBeVisual: true,
  });
  let resolveRequest;
  const modal = createTrailerModal({
    documentRef: dom.window.document,
    fetchData: () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  });
  const pending = modal.open(1, dom.window.document.querySelector("#open"));
  modal.close();
  resolveRequest({
    results: [
      { site: "YouTube", type: "Trailer", key: "abcdef_1", name: "Late" },
    ],
  });
  await pending;
  assert.equal(
    dom.window.document.querySelector("#trailer-player").children.length,
    0,
  );
});

test("only the latest open request may update the player", async () => {
  const dom = new JSDOM(
    '<button id="one">One</button><button id="two">Two</button>',
    { pretendToBeVisual: true },
  );
  const resolvers = [];
  const modal = createTrailerModal({
    documentRef: dom.window.document,
    fetchData: () => new Promise((resolve) => resolvers.push(resolve)),
  });
  const first = modal.open(1, dom.window.document.querySelector("#one"));
  const second = modal.open(2, dom.window.document.querySelector("#two"));
  resolvers[1]({
    results: [
      { site: "YouTube", type: "Trailer", key: "second_2", name: "Second" },
    ],
  });
  await second;
  resolvers[0]({
    results: [
      { site: "YouTube", type: "Trailer", key: "first_11", name: "First" },
    ],
  });
  await first;
  assert.match(dom.window.document.querySelector("iframe").src, /second_2/);
});
