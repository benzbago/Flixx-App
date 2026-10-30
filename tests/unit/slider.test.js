import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createSliderController } from "../../js/slider.js";

test("starts paused for reduced motion and exposes a play control", () => {
  const { document } = new JSDOM('<button id="toggle"></button>').window;
  let starts = 0;
  let stops = 0;
  const controller = createSliderController({
    button: document.querySelector("#toggle"),
    prefersReducedMotion: true,
    createSwiper: (options) => {
      assert.equal(options.autoplay, false);
      return {
        autoplay: {
          start: () => {
            starts += 1;
          },
          stop: () => {
            stops += 1;
          },
        },
      };
    },
  });
  assert.equal(controller.button.textContent, "Play slider");
  assert.equal(controller.button.getAttribute("aria-pressed"), "false");
  controller.button.click();
  assert.equal(starts, 1);
  assert.equal(controller.button.textContent, "Pause slider");
  assert.equal(stops, 0);
});

test("allows a running slider to be paused", () => {
  const { document } = new JSDOM('<button id="toggle"></button>').window;
  let stops = 0;
  const controller = createSliderController({
    button: document.querySelector("#toggle"),
    prefersReducedMotion: false,
    createSwiper: (options) => {
      assert.equal(options.autoplay.delay, 3000);
      return {
        autoplay: {
          start() {},
          stop: () => {
            stops += 1;
          },
        },
      };
    },
  });
  controller.button.click();
  assert.equal(stops, 1);
  assert.equal(controller.button.textContent, "Play slider");
});
