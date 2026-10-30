import { apiErrorMessage } from "./api.js";
import { createElement, createStatus } from "./dom.js";

const SAFE_KEY = /^[A-Za-z0-9_-]{6,32}$/;

export function selectTrailer(videos = []) {
  const valid = videos.filter(
    (video) =>
      video?.site === "YouTube" &&
      SAFE_KEY.test(video.key || "") &&
      ["Trailer", "Teaser"].includes(video.type),
  );
  return (
    valid.find((video) => video.type === "Trailer" && video.official) ||
    valid.find((video) => video.type === "Trailer") ||
    valid.find((video) => video.type === "Teaser") ||
    null
  );
}

export function createTrailerModal({ documentRef = document, fetchData }) {
  const modal = createElement(
    "div",
    {
      className: "trailer-modal",
      attributes: {
        id: "trailer-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "trailer-title",
      },
    },
    documentRef,
  );
  modal.hidden = true;
  const content = createElement(
    "div",
    { className: "trailer-modal-content" },
    documentRef,
  );
  const title = createElement(
    "h2",
    {
      className: "sr-only",
      text: "Movie trailer",
      attributes: { id: "trailer-title" },
    },
    documentRef,
  );
  const closeButton = createElement(
    "button",
    {
      className: "close-trailer",
      text: "×",
      attributes: {
        id: "close-trailer",
        type: "button",
        "aria-label": "Close trailer",
      },
    },
    documentRef,
  );
  const player = createElement(
    "div",
    { className: "trailer-player", attributes: { id: "trailer-player" } },
    documentRef,
  );
  content.append(title, closeButton, player);
  modal.append(content);
  documentRef.body.append(modal);
  let opener = null;
  let requestVersion = 0;
  let activeController = null;
  let backgroundState = [];

  const isolateBackground = () => {
    backgroundState = [...documentRef.body.children]
      .filter((element) => element !== modal)
      .map((element) => ({
        element,
        inert: element.hasAttribute("inert"),
        ariaHidden: element.getAttribute("aria-hidden"),
      }));
    backgroundState.forEach(({ element }) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });
  };

  const restoreBackground = () => {
    backgroundState.forEach(({ element, inert, ariaHidden }) => {
      if (!inert) element.removeAttribute("inert");
      if (ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", ariaHidden);
    });
    backgroundState = [];
  };

  const close = () => {
    requestVersion += 1;
    activeController?.abort();
    activeController = null;
    modal.hidden = true;
    modal.classList.remove("show");
    player.replaceChildren();
    documentRef.body.classList.remove("trailer-open");
    restoreBackground();
    opener?.focus?.();
  };
  const open = async (movieId, trigger) => {
    requestVersion += 1;
    const version = requestVersion;
    activeController?.abort();
    activeController = new AbortController();
    opener = trigger || documentRef.activeElement;
    modal.hidden = false;
    modal.classList.add("show");
    documentRef.body.classList.add("trailer-open");
    restoreBackground();
    isolateBackground();
    createStatus(
      player,
      { kind: "loading", message: "Loading trailer…" },
      documentRef,
    );
    closeButton.focus();
    const load = async () => {
      try {
        const data = await fetchData(
          `movie/${Number(movieId)}/videos`,
          {},
          { signal: activeController.signal },
        );
        if (version !== requestVersion || modal.hidden) return;
        const trailer = selectTrailer(
          Array.isArray(data.results) ? data.results : [],
        );
        if (!trailer)
          return createStatus(
            player,
            {
              kind: "empty",
              message: "No YouTube trailer is available for this movie.",
            },
            documentRef,
          );
        const iframe = createElement(
          "iframe",
          {
            attributes: {
              src: `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`,
              title: `${trailer.name || "Movie"} — trailer`,
              allow:
                "autoplay; encrypted-media; picture-in-picture; fullscreen",
              referrerpolicy: "strict-origin-when-cross-origin",
            },
          },
          documentRef,
        );
        iframe.allowFullscreen = true;
        if (version === requestVersion && !modal.hidden)
          player.replaceChildren(iframe);
      } catch (error) {
        if (
          version !== requestVersion ||
          modal.hidden ||
          error?.name === "AbortError"
        )
          return;
        createStatus(
          player,
          { kind: "error", message: apiErrorMessage(error), onRetry: load },
          documentRef,
        );
      }
    };
    await load();
  };
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  documentRef.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) close();
    if (event.key === "Tab" && !modal.hidden) {
      const focusable = [
        ...modal.querySelectorAll(
          'button:not([disabled]), a[href], select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  return { open, close, element: modal };
}
