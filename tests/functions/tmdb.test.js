import assert from "node:assert/strict";
import test from "node:test";

const originalKey = process.env.TMDB_API_KEY;

async function loadHandler() {
  return (await import("../../netlify/functions/tmdb.js")).handler;
}

test.afterEach(() => {
  if (originalKey === undefined) delete process.env.TMDB_API_KEY;
  else process.env.TMDB_API_KEY = originalKey;
});

test("returns a configuration error without TMDB_API_KEY", async () => {
  delete process.env.TMDB_API_KEY;
  const response = await (
    await loadHandler()
  )({
    httpMethod: "GET",
    queryStringParameters: { path: "movie/popular" },
  });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: "configuration",
      message: "Movie service is not configured.",
    },
  });
});

test("rejects non-GET methods", async () => {
  process.env.TMDB_API_KEY = "test-key";
  const response = await (await loadHandler())({ httpMethod: "POST" });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "GET");
});

for (const path of [
  "",
  "../movie/popular",
  "movie/%2e%2e/tv/popular",
  "person/popular",
]) {
  test(`rejects invalid path ${path || "(missing)"}`, async () => {
    process.env.TMDB_API_KEY = "test-key";
    let called = false;
    const response = await (
      await loadHandler()
    )(
      { httpMethod: "GET", queryStringParameters: path ? { path } : {} },
      {
        fetch: async () => {
          called = true;
        },
      },
    );
    assert.equal(response.statusCode, 400);
    assert.equal(called, false);
  });
}

test("rejects unsupported query parameters before fetching", async () => {
  process.env.TMDB_API_KEY = "test-key";
  let called = false;
  const response = await (
    await loadHandler()
  )(
    {
      httpMethod: "GET",
      queryStringParameters: { path: "movie/popular", redirect: "x" },
    },
    {
      fetch: async () => {
        called = true;
      },
    },
  );
  assert.equal(response.statusCode, 400);
  assert.equal(called, false);
});

for (const params of [
  { path: "search/movie", query: "   " },
  { path: "search/tv", query: "x".repeat(101) },
  { path: "search/movie", query: "bad\u0000query" },
  { path: "search/movie", query: "Dune", page: "0" },
  { path: "search/movie", query: "Dune", page: "501" },
  { path: "search/movie", query: "Dune", page: "1.5" },
  { path: "movie/popular", query: "Dune" },
  { path: "movie/1", page: "2" },
  { path: "movie/9007199254740992" },
  { path: "tv/1", language: "not_a_locale" },
]) {
  test(`rejects invalid endpoint parameters ${JSON.stringify(params)}`, async () => {
    process.env.TMDB_API_KEY = "test-key";
    let called = false;
    const response = await (
      await loadHandler()
    )(
      { httpMethod: "GET", queryStringParameters: params },
      {
        fetch: async () => {
          called = true;
        },
      },
    );
    assert.equal(response.statusCode, 400);
    assert.equal(called, false);
  });
}

test("trims a valid search term before forwarding it", async () => {
  process.env.TMDB_API_KEY = "test-key";
  let requestedUrl;
  const response = await (
    await loadHandler()
  )(
    {
      httpMethod: "GET",
      queryStringParameters: {
        path: "search/tv",
        query: "  Severance  ",
        page: "1",
      },
    },
    {
      fetch: async (url) => {
        requestedUrl = url;
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      },
    },
  );
  assert.equal(response.statusCode, 200);
  assert.equal(new URL(requestedUrl).searchParams.get("query"), "Severance");
});

test("returns successful TMDB JSON without exposing the key", async () => {
  process.env.TMDB_API_KEY = "secret-test-key";
  let requestedUrl;
  const response = await (
    await loadHandler()
  )(
    {
      httpMethod: "GET",
      queryStringParameters: { path: "search/movie", query: "Dune", page: "2" },
    },
    {
      fetch: async (url) => {
        requestedUrl = url;
        return new Response(JSON.stringify({ page: 2, results: [] }), {
          status: 200,
        });
      },
    },
  );
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { page: 2, results: [] });
  assert.match(requestedUrl, /query=Dune/);
  assert.doesNotMatch(response.body, /secret-test-key/);
  assert.equal(
    response.headers["Cache-Control"],
    "public, max-age=300, s-maxage=600",
  );
});

for (const [upstream, expected, code] of [
  [401, 502, "authentication"],
  [404, 404, "not_found"],
  [429, 429, "rate_limited"],
  [500, 502, "upstream"],
]) {
  test(`maps upstream ${upstream} to ${code}`, async () => {
    process.env.TMDB_API_KEY = "test-key";
    const response = await (
      await loadHandler()
    )(
      { httpMethod: "GET", queryStringParameters: { path: "movie/1" } },
      {
        fetch: async () =>
          new Response(
            JSON.stringify({ status_message: "private upstream detail" }),
            { status: upstream },
          ),
      },
    );
    assert.equal(response.statusCode, expected);
    assert.equal(JSON.parse(response.body).error.code, code);
    assert.doesNotMatch(response.body, /private upstream detail/);
  });
}

test("maps network failures to a safe service error", async () => {
  process.env.TMDB_API_KEY = "test-key";
  const response = await (
    await loadHandler()
  )(
    { httpMethod: "GET", queryStringParameters: { path: "tv/popular" } },
    {
      fetch: async () => {
        throw new TypeError("socket detail");
      },
    },
  );
  assert.equal(response.statusCode, 502);
  assert.equal(JSON.parse(response.body).error.code, "network");
});

test("rejects malformed successful upstream JSON", async () => {
  process.env.TMDB_API_KEY = "test-key";
  const response = await (
    await loadHandler()
  )(
    { httpMethod: "GET", queryStringParameters: { path: "movie/1/videos" } },
    { fetch: async () => new Response("not-json", { status: 200 }) },
  );
  assert.equal(response.statusCode, 502);
  assert.equal(JSON.parse(response.body).error.code, "invalid_response");
});
