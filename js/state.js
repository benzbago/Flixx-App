export function createLoadingManager(spinner) {
  let pending = 0;
  const update = () => {
    const active = pending > 0;
    if (spinner) {
      spinner.hidden = !active;
      spinner.setAttribute?.("aria-hidden", String(!active));
    }
  };
  return {
    async track(promise) {
      pending += 1;
      update();
      try {
        return await promise;
      } finally {
        pending = Math.max(0, pending - 1);
        update();
      }
    },
    get pending() {
      return pending;
    },
  };
}
