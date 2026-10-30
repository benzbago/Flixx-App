import assert from "node:assert/strict";
import test from "node:test";
import { createLoadingManager } from "../../js/state.js";

test("keeps spinner visible until every concurrent request settles", async () => {
  const spinner = {
    hidden: true,
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const loading = createLoadingManager(spinner);
  let firstResolve;
  let secondReject;
  const first = loading.track(
    new Promise((resolve) => {
      firstResolve = resolve;
    }),
  );
  const second = loading.track(
    new Promise((_, reject) => {
      secondReject = reject;
    }),
  );
  assert.equal(spinner.hidden, false);
  firstResolve("ok");
  await first;
  assert.equal(spinner.hidden, false);
  secondReject(new Error("failed"));
  await assert.rejects(second);
  assert.equal(spinner.hidden, true);
  assert.equal(spinner["aria-hidden"], "true");
});
