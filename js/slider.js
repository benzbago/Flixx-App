export function createSliderController({
  button,
  prefersReducedMotion,
  createSwiper,
}) {
  let playing = !prefersReducedMotion;
  const swiper = createSwiper({
    slidesPerView: 1,
    spaceBetween: 30,
    freeMode: true,
    loop: true,
    autoplay: playing ? { delay: 3000, disableOnInteraction: false } : false,
    breakpoints: {
      500: { slidesPerView: 2 },
      700: { slidesPerView: 3 },
      1200: { slidesPerView: 4 },
    },
  });
  const render = () => {
    button.textContent = playing ? "Pause slider" : "Play slider";
    button.setAttribute("aria-pressed", String(playing));
  };
  button.addEventListener("click", () => {
    playing = !playing;
    if (playing) swiper.autoplay?.start();
    else swiper.autoplay?.stop();
    render();
  });
  render();
  return { button, swiper };
}
