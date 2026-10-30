export class ApiError extends Error {
  constructor(message, { code = "unknown", status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function fetchTMDB(path, params = {}, options = {}) {
  const url = new URL("/.netlify/functions/tmdb", "https://flixx.local");
  url.searchParams.set("path", path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "")
      url.searchParams.set(key, value);
  }
  try {
    const response = await (options.fetch || fetch)(
      `${url.pathname}${url.search}`,
      { signal: options.signal },
    );
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Movie service returned an invalid response.", {
        code: "invalid_response",
        status: response.status,
      });
    }
    if (!response.ok) {
      throw new ApiError(
        data?.error?.message || "Movie service request failed.",
        {
          code: data?.error?.code || "request_failed",
          status: response.status,
        },
      );
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new ApiError("Movie service returned an invalid response.", {
        code: "invalid_response",
        status: response.status,
      });
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to reach the movie service.", {
      code: error?.name === "AbortError" ? "timeout" : "network",
    });
  }
}

export function apiErrorMessage(error) {
  const messages = {
    authentication:
      "The movie service could not authenticate. Please contact the site owner.",
    configuration: "The movie service is not configured yet.",
    not_found: "The requested title could not be found.",
    rate_limited: "Too many requests. Please wait a moment and retry.",
    network: "You appear to be offline. Check your connection and retry.",
    timeout: "The movie service took too long to respond. Please retry.",
    invalid_response:
      "The movie service returned unexpected data. Please retry.",
  };
  return messages[error?.code] || "Unable to load this content. Please retry.";
}
