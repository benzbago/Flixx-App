import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, fetchTMDB } from "../../js/api.js";

test("builds a proxy URL without malformed query fragments", async () => {
  let requested;
  const data = await fetchTMDB(
    "search/movie",
    { query: " Dune ", page: 2 },
    {
      fetch: async (url) => {
        requested = url;
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      },
    },
  );
  assert.deepEqual(data, { results: [] });
  assert.equal(
    requested,
    "/.netlify/functions/tmdb?path=search%2Fmovie&query=+Dune+&page=2",
  );
  assert.equal(requested.includes("&=query"), false);
});

test("classifies non-success responses using proxy error data", async () => {
  await assert.rejects(
    fetchTMDB(
      "movie/popular",
      {},
      {
        fetch: async () =>
          new Response(
            JSON.stringify({
              error: { code: "rate_limited", message: "Retry later." },
            }),
            { status: 429 },
          ),
      },
    ),
    (error) =>
      error instanceof ApiError &&
      error.code === "rate_limited" &&
      error.status === 429,
  );
});

test("rejects invalid successful JSON shapes", async () => {
  await assert.rejects(
    fetchTMDB(
      "movie/popular",
      {},
      { fetch: async () => new Response("null", { status: 200 }) },
    ),
    (error) => error.code === "invalid_response",
  );
});

test("classifies network failures", async () => {
  await assert.rejects(
    fetchTMDB(
      "movie/popular",
      {},
      {
        fetch: async () => {
          throw new TypeError("offline");
        },
      },
    ),
    (error) => error.code === "network",
  );
});
