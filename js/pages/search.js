import { apiErrorMessage } from "../api.js";
import { createElement, createMediaCard, createStatus } from "../dom.js";
import { parseSearchContext } from "../utils.js";
import { createWatchlist } from "../watchlist.js";

export async function initSearchPage({
  documentRef = document,
  locationRef = location,
  fetchData,
  loading,
  storage,
  feedback,
}) {
  const resultsContainer = documentRef.querySelector("#search-results");
  const heading = documentRef.querySelector("#search-results-heading");
  const pagination = documentRef.querySelector("#pagination");
  const context = parseSearchContext(locationRef.search);
  const watchlist = createWatchlist(storage);
  const controller = {
    state: { page: 1, totalPages: 1, totalResults: 0 },
    pending: Promise.resolve(),
    busy: false,
  };
  if (!context) {
    createStatus(
      resultsContainer,
      {
        kind: "error",
        message: "Choose Movie or TV Shows and enter a search term.",
      },
      documentRef,
    );
    return controller;
  }

  const renderPagination = () => {
    pagination.replaceChildren();
    const wrapper = createElement(
      "div",
      { className: "pagination" },
      documentRef,
    );
    const prev = createElement(
      "button",
      {
        className: "btn btn-primary",
        text: "Prev",
        attributes: { id: "prev", type: "button" },
      },
      documentRef,
    );
    const next = createElement(
      "button",
      {
        className: "btn btn-primary",
        text: "Next",
        attributes: { id: "next", type: "button" },
      },
      documentRef,
    );
    prev.disabled = controller.busy || controller.state.page <= 1;
    next.disabled =
      controller.busy || controller.state.page >= controller.state.totalPages;
    wrapper.append(
      prev,
      next,
      createElement(
        "div",
        {
          className: "page-counter",
          text: `Page ${controller.state.page} of ${controller.state.totalPages}`,
        },
        documentRef,
      ),
    );
    pagination.append(wrapper);
    prev.addEventListener("click", () =>
      requestPage(controller.state.page - 1),
    );
    next.addEventListener("click", () =>
      requestPage(controller.state.page + 1),
    );
  };

  const renderResults = (data) => {
    const results = Array.isArray(data.results) ? data.results : [];
    resultsContainer.replaceChildren();
    heading.textContent = `${data.total_results || 0} results for “${context.term}”`;
    if (!results.length)
      createStatus(
        resultsContainer,
        { kind: "empty", message: "No results found. Try another search." },
        documentRef,
      );
    else
      results.forEach((item) =>
        resultsContainer.append(
          createMediaCard(item, context.type, documentRef, {
            watchlist,
            feedback,
          }),
        ),
      );
    renderPagination();
  };

  const requestPage = (page) => {
    if (controller.busy || page < 1) return controller.pending;
    controller.busy = true;
    renderPagination();
    controller.pending = (async () => {
      try {
        const data = await loading.track(
          fetchData(`search/${context.type}`, { query: context.term, page }),
        );
        controller.state = {
          page: Number(data.page) || page,
          totalPages: Math.max(1, Number(data.total_pages) || 1),
          totalResults: Number(data.total_results) || 0,
        };
        renderResults(data);
      } catch (error) {
        createStatus(
          pagination,
          {
            kind: "error",
            message: apiErrorMessage(error),
            onRetry: () => requestPage(page),
          },
          documentRef,
        );
      } finally {
        controller.busy = false;
        if (pagination.querySelector(".pagination")) renderPagination();
      }
    })();
    return controller.pending;
  };

  await requestPage(1);
  return controller;
}
