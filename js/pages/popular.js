import { apiErrorMessage } from "../api.js";
import { createMediaCard, createStatus } from "../dom.js";
import { createWatchlist } from "../watchlist.js";

export async function initPopularPage({
  type,
  container,
  documentRef = document,
  fetchData,
  loading,
  storage,
  feedback,
}) {
  const watchlist = createWatchlist(storage);
  const load = async () => {
    createStatus(container, { kind: "loading" }, documentRef);
    try {
      const data = await loading.track(fetchData(`${type}/popular`));
      const items = Array.isArray(data.results) ? data.results : [];
      container.replaceChildren();
      if (!items.length)
        return createStatus(
          container,
          {
            kind: "empty",
            message: `No popular ${type === "tv" ? "TV shows" : "movies"} are available.`,
          },
          documentRef,
        );
      items.forEach((item) =>
        container.append(
          createMediaCard(item, type, documentRef, { watchlist, feedback }),
        ),
      );
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
