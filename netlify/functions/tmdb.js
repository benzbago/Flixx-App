const API_ROOT = "https://api.themoviedb.org/3/";
const ALLOWED_QUERY_KEYS = new Set(["path", "language", "query", "page"]);
const LIST_PATH = /^(movie\/(popular|now_playing)|tv\/popular)$/;
const SEARCH_PATH = /^search\/(movie|tv)$/;
const DETAIL_PATH = /^(movie|tv)\/([1-9]\d*)(\/videos)?$/;

const messages = {
  authentication: "Movie service authentication failed.",
  not_found: "The requested title was not found.",
  rate_limited: "Movie service rate limit reached. Please retry shortly.",
  upstream: "Movie service is temporarily unavailable.",
  network: "Could not reach the movie service.",
  invalid_response: "Movie service returned an invalid response.",
};

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function error(statusCode, code) {
  return json(statusCode, { error: { code, message: messages[code] } });
}

function validPath(path) {
  if (!path || path.includes("..") || path.includes("%")) return false;
  const detail = path.match(DETAIL_PATH);
  if (detail) {
    if (detail[3] && detail[1] !== "movie") return false;
    const id = Number(detail[2]);
    return Number.isSafeInteger(id) && id > 0;
  }
  return LIST_PATH.test(path) || SEARCH_PATH.test(path);
}

function validRequest(params) {
  if (!validPath(params.path)) return false;
  if (params.language && !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(params.language))
    return false;
  const keys = Object.keys(params);
  if (keys.some((key) => !ALLOWED_QUERY_KEYS.has(key))) return false;
  const allowed = SEARCH_PATH.test(params.path)
    ? new Set(["path", "language", "query", "page"])
    : LIST_PATH.test(params.path)
      ? new Set(["path", "language", "page"])
      : new Set(["path", "language"]);
  if (keys.some((key) => !allowed.has(key))) return false;
  if (
    params.page &&
    (!/^\d+$/.test(params.page) ||
      Number(params.page) < 1 ||
      Number(params.page) > 500)
  )
    return false;
  if (SEARCH_PATH.test(params.path)) {
    const query = params.query?.trim();
    // eslint-disable-next-line no-control-regex -- reject ASCII control characters in user input
    if (!query || query.length > 100 || /[\u0000-\u001f\u007f]/.test(query))
      return false;
  }
  return true;
}

export async function handler(event, context = {}) {
  if (event.httpMethod !== "GET") {
    return json(
      405,
      { error: { code: "method", message: "Method not allowed." } },
      { Allow: "GET" },
    );
  }

  const params = event.queryStringParameters || {};
  if (!validRequest(params)) {
    return json(400, {
      error: {
        code: "invalid_request",
        message: "Invalid movie service request.",
      },
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: {
        code: "configuration",
        message: "Movie service is not configured.",
      },
    });
  }

  const url = new URL(params.path, API_ROOT);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", params.language || "en-US");
  if (params.query) url.searchParams.set("query", params.query.trim());
  if (params.page) url.searchParams.set("page", params.page);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await (context.fetch || fetch)(url.toString(), {
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        return error(502, "authentication");
      if (response.status === 404) return error(404, "not_found");
      if (response.status === 429) return error(429, "rate_limited");
      return error(502, "upstream");
    }
    let data;
    try {
      data = await response.json();
    } catch {
      return error(502, "invalid_response");
    }
    return json(200, data, {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    });
  } catch {
    return error(502, "network");
  } finally {
    clearTimeout(timeout);
  }
}
