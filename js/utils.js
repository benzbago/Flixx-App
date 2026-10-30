export const PLACEHOLDER_IMAGE = "images/no-image.jpg";

export function parseDetailId(search) {
  const raw = new URLSearchParams(search).get("id");
  if (!/^[1-9]\d*$/.test(raw || "")) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export function parseSearchContext(search) {
  const params = new URLSearchParams(search);
  const type = params.get("type");
  const term = (params.get("search-term") || "").trim();
  if (!["movie", "tv"].includes(type) || !term) return null;
  return Object.freeze({ type, term });
}

export function safeExternalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function imageUrl(path, size = "w500") {
  return path
    ? `https://image.tmdb.org/t/p/${size}${path.startsWith("/") ? "" : "/"}${path}`
    : PLACEHOLDER_IMAGE;
}

export function formatDate(value) {
  if (!value) return "Date unknown";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return "Date unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US")
    : "Unknown";
}

export function mediaTitle(item, type) {
  return (
    (type === "movie" ? item?.title : item?.name || item?.title) || "Untitled"
  );
}

export function mediaDate(item, type) {
  return type === "movie" ? item?.release_date : item?.first_air_date;
}
