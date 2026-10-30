import { createMediaCard, createStatus } from "./dom.js";

const STORAGE_KEY = "flixx-watchlist";
const VERSION = 2;
const STATUSES = new Set(["want", "watched"]);

function validItem(item) {
  return (
    item &&
    ["movie", "tv"].includes(item.type) &&
    Number.isSafeInteger(Number(item.id)) &&
    Number(item.id) > 0
  );
}

function normalizeItem(item) {
  const type = item.type;
  const id = Number(item.id);
  return {
    key: `${type}:${id}`,
    type,
    id,
    title: String(item.title || "Untitled"),
    poster_path: item.poster_path || null,
    date: item.date || "",
    status: STATUSES.has(item.status) ? item.status : "want",
  };
}

export function createWatchlist(storage) {
  let issue = null;
  function read() {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) {
        issue = null;
        return [];
      }
      const parsed = JSON.parse(raw);
      if (
        ![1, VERSION].includes(parsed?.version) ||
        !Array.isArray(parsed.items)
      ) {
        issue = "malformed";
        return [];
      }
      issue = null;
      return parsed.items.filter(validItem).map(normalizeItem);
    } catch {
      issue = "malformed";
      return [];
    }
  }
  function write(items) {
    read();
    if (issue) return false;
    try {
      storage?.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: VERSION, items }),
      );
      return true;
    } catch {
      return false;
    }
  }
  read();
  return {
    get issue() {
      return issue;
    },
    all: read,
    get: (type, id) =>
      read().find((item) => item.key === `${type}:${Number(id)}`) || null,
    has: (type, id) =>
      read().some((item) => item.key === `${type}:${Number(id)}`),
    filter({ type = "all", status = "all" } = {}) {
      return read().filter(
        (item) =>
          (type === "all" || item.type === type) &&
          (status === "all" || item.status === status),
      );
    },
    add(item) {
      if (!validItem(item)) return false;
      read();
      if (issue) return false;
      const items = read().filter(
        (entry) =>
          !(entry.type === item.type && Number(entry.id) === Number(item.id)),
      );
      items.push(normalizeItem(item));
      return write(items);
    },
    remove(type, id) {
      return write(
        read().filter(
          (item) => !(item.type === type && Number(item.id) === Number(id)),
        ),
      );
    },
    setStatus(type, id, status) {
      if (!STATUSES.has(status)) return false;
      const key = `${type}:${Number(id)}`;
      const items = read();
      if (issue || !items.some((item) => item.key === key)) return false;
      return write(
        items.map((item) => (item.key === key ? { ...item, status } : item)),
      );
    },
  };
}

export function renderWatchlistPage({
  container,
  storage = localStorage,
  documentRef = document,
} = {}) {
  const watchlist = createWatchlist(storage);
  const feedback = documentRef.querySelector("#watchlist-feedback");
  const typeFilter = documentRef.querySelector("#watchlist-type-filter");
  const statusFilter = documentRef.querySelector("#watchlist-status-filter");
  const announce = (message) => {
    if (feedback) feedback.textContent = message;
  };
  const render = () => {
    if (watchlist.issue) {
      createStatus(
        container,
        {
          kind: "error",
          message:
            "Saved watchlist data is malformed. It has been left unchanged. Clear this site's storage manually only if you want to start over.",
        },
        documentRef,
      );
      return;
    }
    const allItems = watchlist.all();
    const items = watchlist.filter({
      type: typeFilter?.value || "all",
      status: statusFilter?.value || "all",
    });
    if (!allItems.length) {
      createStatus(
        container,
        {
          kind: "empty",
          message:
            "Your watchlist is empty. Add movies or TV shows from cards or detail pages.",
        },
        documentRef,
      );
      return;
    }
    if (!items.length) {
      createStatus(
        container,
        {
          kind: "empty",
          message: "No saved titles match these filters.",
        },
        documentRef,
      );
      return;
    }
    container.replaceChildren();
    items.forEach((item) =>
      container.append(
        createMediaCard(item, item.type, documentRef, {
          onRemove: () => {
            if (watchlist.remove(item.type, item.id))
              announce(`${item.title} removed from your watchlist.`);
            render();
          },
          onStatus: (status) => {
            if (watchlist.setStatus(item.type, item.id, status))
              announce(
                `${item.title} marked ${status === "watched" ? "Watched" : "Want to watch"}.`,
              );
            render();
          },
        }),
      ),
    );
  };
  typeFilter?.addEventListener("change", render);
  statusFilter?.addEventListener("change", render);
  render();
}
