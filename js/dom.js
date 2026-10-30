import {
  formatDate,
  imageUrl,
  mediaDate,
  mediaTitle,
  PLACEHOLDER_IMAGE,
} from "./utils.js";

export function createElement(tag, options = {}, documentRef = document) {
  const element = documentRef.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = String(options.text);
  for (const [name, value] of Object.entries(options.attributes || {}))
    element.setAttribute(name, value);
  return element;
}

export function createSafeImage(src, alt, documentRef = document) {
  const image = createElement(
    "img",
    {
      attributes: {
        src,
        alt,
        loading: "lazy",
        width: "500",
        height: "750",
        decoding: "async",
      },
    },
    documentRef,
  );
  image.addEventListener(
    "error",
    () => {
      if (!image.getAttribute("src")?.endsWith(PLACEHOLDER_IMAGE))
        image.setAttribute("src", PLACEHOLDER_IMAGE);
    },
    { once: true },
  );
  return image;
}

export function createMediaCard(
  item,
  type,
  documentRef = document,
  options = {},
) {
  const card = createElement("article", { className: "card" }, documentRef);
  const link = createElement(
    "a",
    {
      attributes: {
        href: `${type === "movie" ? "movie" : "tv"}-details.html?id=${Number(item.id)}`,
      },
    },
    documentRef,
  );
  link.append(
    createSafeImage(
      imageUrl(item.poster_path),
      mediaTitle(item, type),
      documentRef,
    ),
  );
  const body = createElement("div", { className: "card-body" }, documentRef);
  body.append(
    createElement(
      "h2",
      { className: "card-title", text: mediaTitle(item, type) },
      documentRef,
    ),
  );
  body.append(
    createElement(
      "p",
      {
        className: "card-text",
        text: `${type === "movie" ? "Release" : "First aired"}: ${formatDate(mediaDate(item, type) || item.date)}`,
      },
      documentRef,
    ),
  );
  const actions = createElement(
    "div",
    { className: "card-actions" },
    documentRef,
  );
  if (options.onRemove) {
    const button = createElement(
      "button",
      {
        className: "btn watchlist-remove",
        text: "Remove",
        attributes: { type: "button" },
      },
      documentRef,
    );
    button.addEventListener("click", () => options.onRemove(item));
    actions.append(button);
  }
  if (options.onStatus) {
    const label = createElement(
      "label",
      { className: "watchlist-status-label", text: "Watch status" },
      documentRef,
    );
    const select = createElement(
      "select",
      {
        className: "watchlist-status",
        attributes: {
          "aria-label": `Watch status for ${mediaTitle(item, type)}`,
        },
      },
      documentRef,
    );
    for (const [value, text] of [
      ["want", "Want to Watch"],
      ["watched", "Watched"],
    ]) {
      const option = createElement(
        "option",
        { text, attributes: { value } },
        documentRef,
      );
      option.selected = item.status === value;
      select.append(option);
    }
    select.addEventListener("change", () => options.onStatus(select.value));
    label.append(select);
    actions.append(label);
  }
  if (options.watchlist) {
    const button = createElement(
      "button",
      {
        className: "btn card-watchlist-toggle",
        attributes: { type: "button" },
      },
      documentRef,
    );
    const refresh = () => {
      const saved = options.watchlist.has(type, item.id);
      button.textContent = saved ? "Remove from Watchlist" : "Add to Watchlist";
      button.setAttribute("aria-pressed", String(saved));
    };
    button.addEventListener("click", () => {
      const wasSaved = options.watchlist.has(type, item.id);
      const changed = wasSaved
        ? options.watchlist.remove(type, item.id)
        : options.watchlist.add({
            type,
            id: item.id,
            title: mediaTitle(item, type),
            poster_path: item.poster_path,
            date: mediaDate(item, type),
          });
      if (changed && options.feedback)
        options.feedback.textContent = `${mediaTitle(item, type)} ${wasSaved ? "removed from" : "added to"} your watchlist.`;
      refresh();
    });
    refresh();
    actions.append(button);
  }
  if (actions.childElementCount) body.append(actions);
  card.append(link, body);
  return card;
}

export function createStatus(
  container,
  { kind = "loading", message, onRetry } = {},
  documentRef = document,
) {
  container.replaceChildren();
  container.setAttribute(
    "aria-live",
    kind === "error" ? "assertive" : "polite",
  );
  container.setAttribute("aria-busy", String(kind === "loading"));
  const box = createElement(
    "div",
    { className: `content-state content-state-${kind}` },
    documentRef,
  );
  box.append(
    createElement(
      "p",
      {
        text: message || (kind === "loading" ? "Loading…" : "No items found."),
      },
      documentRef,
    ),
  );
  if (onRetry) {
    const retry = createElement(
      "button",
      { className: "btn", text: "Retry", attributes: { type: "button" } },
      documentRef,
    );
    retry.addEventListener("click", onRetry);
    box.append(retry);
  }
  container.append(box);
  return box;
}
