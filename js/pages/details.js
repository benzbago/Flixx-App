import { apiErrorMessage } from "../api.js";
import { createElement, createSafeImage, createStatus } from "../dom.js";
import { createWatchlist } from "../watchlist.js";
import {
  formatDate,
  formatNumber,
  imageUrl,
  mediaDate,
  mediaTitle,
  parseDetailId,
  safeExternalUrl,
} from "../utils.js";

function labeledItem(label, value, documentRef) {
  const li = createElement("li", {}, documentRef);
  li.append(
    createElement(
      "span",
      { className: "text-secondary", text: `${label}: ` },
      documentRef,
    ),
    documentRef.createTextNode(value),
  );
  return li;
}

export function renderDetails(
  container,
  item,
  type,
  { documentRef = document, storage, feedback } = {},
) {
  container.replaceChildren();
  if (item.backdrop_path) {
    const backdrop = createElement(
      "div",
      { className: "details-backdrop", attributes: { "aria-hidden": "true" } },
      documentRef,
    );
    backdrop.style.backgroundImage = `url("${imageUrl(item.backdrop_path, "w1280")}")`;
    container.append(backdrop);
  }
  const top = createElement("div", { className: "details-top" }, documentRef);
  const poster = createElement("div", {}, documentRef);
  poster.append(
    createSafeImage(
      imageUrl(item.poster_path),
      mediaTitle(item, type),
      documentRef,
    ),
  );
  const info = createElement("div", {}, documentRef);
  info.append(
    createElement("h1", { text: mediaTitle(item, type) }, documentRef),
  );
  info.append(
    createElement(
      "p",
      { text: `★ ${Number(item.vote_average || 0).toFixed(1)} / 10` },
      documentRef,
    ),
  );
  info.append(
    createElement(
      "p",
      {
        className: "text-muted",
        text: `${type === "movie" ? "Release date" : "First air date"}: ${formatDate(mediaDate(item, type))}`,
      },
      documentRef,
    ),
  );
  info.append(
    createElement(
      "p",
      { text: item.overview || "No overview is available." },
      documentRef,
    ),
  );
  info.append(createElement("h2", { text: "Genres" }, documentRef));
  const genres = createElement("ul", { className: "list-group" }, documentRef);
  const genreItems = Array.isArray(item.genres) ? item.genres : [];
  if (genreItems.length)
    genreItems.forEach((genre) =>
      genres.append(
        createElement("li", { text: genre.name || "Unknown" }, documentRef),
      ),
    );
  else
    genres.append(
      createElement("li", { text: "Genres unavailable" }, documentRef),
    );
  info.append(genres);

  const watchlist = createWatchlist(storage);
  const button = createElement(
    "button",
    { className: "btn watchlist-toggle", attributes: { type: "button" } },
    documentRef,
  );
  const refresh = () => {
    const saved = watchlist.has(type, item.id);
    button.textContent = saved ? "Remove from Watchlist" : "Add to Watchlist";
    button.setAttribute("aria-pressed", String(saved));
    statusSelect.hidden = !saved;
    if (saved)
      statusSelect.value = watchlist.get(type, item.id)?.status || "want";
  };
  button.addEventListener("click", () => {
    const wasSaved = watchlist.has(type, item.id);
    const changed = wasSaved
      ? watchlist.remove(type, item.id)
      : watchlist.add({
          type,
          id: item.id,
          title: mediaTitle(item, type),
          poster_path: item.poster_path,
          date: mediaDate(item, type),
        });
    if (changed && feedback)
      feedback.textContent = `${mediaTitle(item, type)} ${wasSaved ? "removed from" : "added to"} your watchlist.`;
    refresh();
  });
  const statusSelect = createElement(
    "select",
    {
      className: "detail-watchlist-status",
      attributes: {
        "aria-label": `Watch status for ${mediaTitle(item, type)}`,
      },
    },
    documentRef,
  );
  for (const [value, text] of [
    ["want", "Want to watch"],
    ["watched", "Watched"],
  ])
    statusSelect.append(
      createElement("option", { text, attributes: { value } }, documentRef),
    );
  statusSelect.addEventListener("change", () => {
    if (watchlist.setStatus(type, item.id, statusSelect.value) && feedback)
      feedback.textContent = `${mediaTitle(item, type)} marked ${statusSelect.value === "watched" ? "Watched" : "Want to watch"}.`;
  });
  refresh();
  info.append(button, statusSelect);
  const homepage = safeExternalUrl(item.homepage);
  if (homepage)
    info.append(
      createElement(
        "a",
        {
          className: "btn homepage-link",
          text: "Visit Official Homepage",
          attributes: {
            href: homepage,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
        documentRef,
      ),
    );
  top.append(poster, info);

  const bottom = createElement(
    "div",
    { className: "details-bottom" },
    documentRef,
  );
  bottom.append(
    createElement(
      "h2",
      { text: `${type === "movie" ? "Movie" : "Show"} Info` },
      documentRef,
    ),
  );
  const facts = createElement("ul", {}, documentRef);
  if (type === "movie") {
    facts.append(
      labeledItem(
        "Budget",
        item.budget ? `$${formatNumber(item.budget)}` : "Unknown",
        documentRef,
      ),
    );
    facts.append(
      labeledItem(
        "Revenue",
        item.revenue ? `$${formatNumber(item.revenue)}` : "Unknown",
        documentRef,
      ),
    );
    facts.append(
      labeledItem(
        "Runtime",
        item.runtime ? `${item.runtime} minutes` : "Unknown",
        documentRef,
      ),
    );
  } else {
    facts.append(
      labeledItem(
        "Number of episodes",
        Number.isFinite(item.number_of_episodes)
          ? String(item.number_of_episodes)
          : "Unknown",
        documentRef,
      ),
    );
    facts.append(
      labeledItem(
        "Last episode",
        item.last_episode_to_air?.name || "Last episode unavailable",
        documentRef,
      ),
    );
  }
  facts.append(labeledItem("Status", item.status || "Unknown", documentRef));
  bottom.append(
    facts,
    createElement("h2", { text: "Production Companies" }, documentRef),
  );
  const companies = createElement(
    "p",
    {
      text:
        (Array.isArray(item.production_companies)
          ? item.production_companies
          : []
        )
          .map((company) => company.name)
          .filter(Boolean)
          .join(", ") || "Production companies unavailable",
    },
    documentRef,
  );
  bottom.append(companies);
  container.append(top, bottom);
}

export async function initDetailsPage({
  type,
  documentRef = document,
  locationRef = location,
  fetchData,
  loading,
  storage = localStorage,
  feedback,
}) {
  const container = documentRef.querySelector(
    type === "movie" ? "#movie-details" : "#show-details",
  );
  const id = parseDetailId(locationRef.search);
  if (!id)
    return createStatus(
      container,
      {
        kind: "error",
        message:
          "This detail link is invalid. Return to the listings and choose a title.",
      },
      documentRef,
    );
  const load = async () => {
    createStatus(container, { kind: "loading" }, documentRef);
    try {
      const item = await loading.track(fetchData(`${type}/${id}`));
      renderDetails(container, item, type, { documentRef, storage, feedback });
    } catch (error) {
      createStatus(
        container,
        { kind: "error", message: apiErrorMessage(error), onRetry: load },
        documentRef,
      );
    }
  };
  await load();
}
