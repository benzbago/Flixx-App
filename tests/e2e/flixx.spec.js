import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const movie = {
  id: 1,
  title: "Dune",
  overview: "A desert epic.",
  backdrop_path: "/backdrop.jpg",
  poster_path: null,
  vote_average: 8.2,
  release_date: "2024-03-01",
};

async function mockTMDB(page, resolver) {
  await page.route("**/.netlify/functions/tmdb?**", async (route) => {
    const url = new URL(route.request().url());
    const result = await resolver(
      url.searchParams.get("path"),
      Object.fromEntries(url.searchParams),
    );
    await route.fulfill({
      status: result.status || 200,
      contentType: "application/json",
      body: JSON.stringify(result.body ?? result),
    });
  });
}

test("home shares mocked now-playing data across hero and slider", async ({
  page,
}) => {
  let nowPlaying = 0;
  await mockTMDB(page, (path) => {
    if (path === "movie/now_playing") {
      nowPlaying += 1;
      return { results: [movie] };
    }
    if (path === "movie/popular") return { results: [movie] };
    return { results: [] };
  });
  await page.goto("/");
  await expect(page.locator("#featured-movie h1")).toHaveText("Dune");
  await expect(page.locator(".swiper-slide").first()).toBeVisible();
  await expect(page.locator("#popular-movies .card")).toHaveCount(1);
  expect(nowPlaying).toBe(1);
});

test("home error exposes Retry and recovers with mocked response", async ({
  page,
}) => {
  let attempts = 0;
  await mockTMDB(page, (path) => {
    if (path === "movie/now_playing" && attempts++ === 0)
      return {
        status: 502,
        body: { error: { code: "network", message: "offline" } },
      };
    return { results: [movie] };
  });
  await page.goto("/");
  await expect(
    page.locator("#featured-movie button", { hasText: "Retry" }),
  ).toBeVisible();
  await page.locator("#featured-movie button", { hasText: "Retry" }).click();
  await expect(page.locator("#featured-movie h1")).toHaveText("Dune");
});

test("search paginates and renders API text as text", async ({ page }) => {
  await mockTMDB(page, (_path, params) =>
    params.page === "2"
      ? {
          page: 2,
          total_pages: 2,
          total_results: 2,
          results: [{ id: 2, title: "Part Two" }],
        }
      : {
          page: 1,
          total_pages: 2,
          total_results: 2,
          results: [{ id: 1, title: "<img src=x onerror=alert(1)>" }],
        },
  );
  await page.goto("/search.html?type=movie&search-term=%20Dune%20");
  await expect(page.locator("#search-results .card-title")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  await page.locator("#next").click();
  await expect(page.locator("#search-results .card-title")).toHaveText(
    "Part Two",
  );
  await expect(page.locator(".page-counter")).toHaveText("Page 2 of 2");
});

test("detail watchlist persists and removes on watchlist page", async ({
  page,
}) => {
  await mockTMDB(page, () => ({
    id: 9,
    name: "Safe Show",
    genres: [],
    production_companies: [],
    last_episode_to_air: null,
    poster_path: null,
  }));
  await page.goto("/tv-details.html?id=9");
  await expect(page.getByText("Last episode unavailable")).toBeVisible();
  await page.locator(".watchlist-toggle").click();
  await page.goto("/watchlist.html");
  await expect(page.locator(".card-title")).toHaveText("Safe Show");
  await page.locator(".watchlist-remove").click();
  await expect(page.getByText(/watchlist is empty/i)).toBeVisible();
});

test("trailer modal is keyboard closable and restores focus", async ({
  page,
}) => {
  await mockTMDB(page, (path) =>
    path.endsWith("/videos")
      ? {
          status: 502,
          body: { error: { code: "network", message: "offline" } },
        }
      : { results: [movie] },
  );
  await page.goto("/");
  const opener = page.getByRole("button", { name: /watch trailer/i });
  await opener.click();
  await expect(page.locator("#close-trailer")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test("trailer modal traps forward and reverse keyboard focus", async ({
  page,
}) => {
  await mockTMDB(page, (path) =>
    path.endsWith("/videos")
      ? {
          status: 502,
          body: { error: { code: "network", message: "offline" } },
        }
      : { results: [movie] },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /watch trailer/i }).click();
  const close = page.locator("#close-trailer");
  const retry = page.locator("#trailer-player button", { hasText: "Retry" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(retry).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
});

test("core pages have no automatically detectable accessibility violations", async ({
  page,
}) => {
  await mockTMDB(page, (path) => {
    if (path.startsWith("tv/")) {
      return {
        id: 9,
        name: "Safe Show",
        genres: [],
        production_companies: [],
        last_episode_to_air: null,
      };
    }
    return { results: [movie] };
  });
  const paths = [
    "/",
    "/shows.html",
    "/search.html?type=movie&search-term=Dune",
    "/tv-details.html?id=9",
    "/watchlist.html",
    "/credits.html",
  ];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      `${path}: ${results.violations.map((item) => item.id).join(", ")}`,
    ).toEqual([]);
  }
});

test("card controls, statuses, and filters work across the watchlist", async ({
  page,
}) => {
  await mockTMDB(page, (path) =>
    path === "movie/popular" || path === "movie/now_playing"
      ? { results: [movie] }
      : { results: [] },
  );
  await page.goto("/");
  const add = page.locator("#popular-movies .card-watchlist-toggle");
  await add.click();
  await expect(add).toHaveAttribute("aria-pressed", "true");
  await page.goto("/watchlist.html");
  await page.locator(".watchlist-status").selectOption("watched");
  await expect(page.locator("#watchlist-feedback")).toContainText("Watched");
  await page.locator("#watchlist-status-filter").selectOption("want");
  await expect(page.getByText(/no saved titles match/i)).toBeVisible();
  await page.locator("#watchlist-status-filter").selectOption("watched");
  await expect(page.locator(".card-title")).toHaveText("Dune");
});

test("watchlist card status control aligns at desktop and narrow widths", async ({
  page,
}) => {
  await mockTMDB(page, () => ({ results: [movie] }));
  await page.goto("/");
  await page.locator("#popular-movies .card-watchlist-toggle").click();

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/watchlist.html");
    const label = page.locator(".watchlist-status-label");
    const select = page.locator(".watchlist-status");
    const styles = await label.evaluate((element) => {
      const labelStyle = getComputedStyle(element);
      const selectElement = element.control;
      const selectStyle = getComputedStyle(selectElement);
      const labelRect = element.getBoundingClientRect();
      const selectRect = selectElement.getBoundingClientRect();
      return {
        display: labelStyle.display,
        direction: labelStyle.flexDirection,
        gap: labelStyle.gap,
        selectHeight: selectRect.height,
        selectWidth: selectRect.width,
        labelWidth: labelRect.width,
        fontFamily: selectStyle.fontFamily,
        bodyFontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: selectStyle.fontSize,
        paddingLeft: selectStyle.paddingLeft,
      };
    });
    expect(styles.display).toBe("flex");
    expect(styles.direction).toBe("column");
    expect(styles.gap).toBe("8px");
    expect(styles.selectHeight).toBeGreaterThanOrEqual(44);
    expect(styles.selectWidth).toBeCloseTo(styles.labelWidth, 0);
    expect(styles.fontFamily).toBe(styles.bodyFontFamily);
    expect(Number.parseFloat(styles.fontSize)).toBeGreaterThanOrEqual(16);
    expect(Number.parseFloat(styles.paddingLeft)).toBeGreaterThanOrEqual(12);
    await expect(select).toBeVisible();
  }
});

test("shared cards align actions and preserve poster ratio across pages", async ({
  page,
}) => {
  const longTitle = {
    ...movie,
    id: 2,
    title:
      "A Very Long Movie Title That Wraps Across Several Lines Without Clipping",
    name: "A Very Long Television Title That Wraps Across Several Lines Without Clipping",
  };
  await mockTMDB(page, (path) => {
    if (path.startsWith("search/"))
      return {
        page: 1,
        total_pages: 1,
        total_results: 2,
        results: [movie, longTitle],
      };
    return { results: [movie, longTitle] };
  });

  const pages = [
    { path: "/", grid: "#popular-movies" },
    { path: "/shows.html", grid: "#popular-shows" },
    {
      path: "/search.html?type=movie&search-term=Dune",
      grid: "#search-results",
    },
  ];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const target of pages) {
      await page.goto(target.path);
      const cards = page.locator(`${target.grid} .card`);
      await expect(cards).toHaveCount(2);
      const layout = await cards.evaluateAll((elements) =>
        elements.map((card) => {
          const body = card.querySelector(".card-body");
          const actions = card.querySelector(".card-actions");
          const button = actions.querySelector(".card-watchlist-toggle");
          const image = card.querySelector("img");
          const cardStyle = getComputedStyle(card);
          const bodyStyle = getComputedStyle(body);
          const buttonStyle = getComputedStyle(button);
          const imageStyle = getComputedStyle(image);
          const titleRect = card
            .querySelector(".card-title")
            .getBoundingClientRect();
          const actionsRect = actions.getBoundingClientRect();
          const imageRect = image.getBoundingClientRect();
          return {
            cardDisplay: cardStyle.display,
            bodyDisplay: bodyStyle.display,
            bodyGrow: bodyStyle.flexGrow,
            actionsTop: actionsRect.top,
            cardHeight: card.getBoundingClientRect().height,
            buttonHeight: button.getBoundingClientRect().height,
            buttonWidth: button.getBoundingClientRect().width,
            actionsWidth: actions.getBoundingClientRect().width,
            buttonFontSize: Number.parseFloat(buttonStyle.fontSize),
            buttonFontFamily: buttonStyle.fontFamily,
            bodyFontFamily: getComputedStyle(document.body).fontFamily,
            imageRatio: imageRect.width / imageRect.height,
            imageFit: imageStyle.objectFit,
            noOverlap: titleRect.bottom <= actionsRect.top,
          };
        }),
      );
      for (const item of layout) {
        expect(item.cardDisplay).toBe("flex");
        expect(item.bodyDisplay).toBe("flex");
        expect(item.bodyGrow).toBe("1");
        expect(item.buttonHeight).toBeGreaterThanOrEqual(44);
        expect(item.buttonWidth).toBeCloseTo(item.actionsWidth, 0);
        expect(item.buttonFontSize).toBeGreaterThanOrEqual(14);
        expect(item.buttonFontFamily).toBe(item.bodyFontFamily);
        expect(item.imageRatio).toBeCloseTo(2 / 3, 1);
        expect(item.imageFit).toBe("contain");
        expect(item.noOverlap).toBe(true);
      }
      if (viewport.width >= 768) {
        expect(layout[0].cardHeight).toBeCloseTo(layout[1].cardHeight, 0);
        expect(layout[0].actionsTop).toBeCloseTo(layout[1].actionsTop, 0);
      }
    }
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  const toggle = page.locator("#popular-movies .card-watchlist-toggle").first();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(
    await toggle.evaluate(
      (element) => getComputedStyle(element, "::before").content,
    ),
  ).not.toBe("none");
  await page.goto("/watchlist.html");
  await expect(page.locator("#watchlist .card-actions")).toHaveCount(1);
});

test("malformed saved watchlist data is reported and preserved", async ({
  page,
}) => {
  await page.goto("/watchlist.html");
  await page.evaluate(() => localStorage.setItem("flixx-watchlist", "{broken"));
  await page.reload();
  await expect(page.getByText(/left unchanged/i)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("flixx-watchlist")),
  ).toBe("{broken");
});

test("reduced-motion users get a paused slider with an explicit play control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockTMDB(page, () => ({ results: [movie] }));
  await page.goto("/");
  await expect(page.locator("#slider-autoplay-toggle")).toHaveText(
    "Play slider",
  );
  await expect(page.locator("#slider-autoplay-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

for (const viewport of [
  { name: "narrow", width: 320, height: 700 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`${viewport.name} layout has no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockTMDB(page, () => ({ results: [movie] }));
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}

test("direct refresh works for every static page and detail links", async ({
  page,
}) => {
  await mockTMDB(page, (path) => {
    if (path === "movie/1")
      return { ...movie, genres: [], production_companies: [] };
    if (path === "tv/9")
      return { id: 9, name: "Show", genres: [], production_companies: [] };
    if (path.startsWith("search/"))
      return { page: 1, total_pages: 1, total_results: 1, results: [movie] };
    return { results: [movie] };
  });
  for (const path of [
    "/",
    "/shows.html",
    "/search.html?type=movie&search-term=Dune",
    "/movie-details.html?id=1",
    "/tv-details.html?id=9",
    "/watchlist.html",
    "/credits.html",
  ]) {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await page.reload();
    await expect(page.locator("header .logo")).toHaveText("FLIXX");
  }
});

test("captures finished interface screenshots", async ({ page }) => {
  await mockTMDB(page, () => ({ results: [movie] }));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  await page.locator("#popular-movies .card-watchlist-toggle").click();
  await page.goto("/watchlist.html");
  await page.screenshot({
    path: "docs/screenshots/watchlist-desktop.png",
    fullPage: true,
  });
});
