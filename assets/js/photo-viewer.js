const viewer = document.querySelector("#photo-viewer");
const photos = [...document.querySelectorAll("[data-photo]")];

// The links remain ordinary image links without JavaScript or dialog support.
if (viewer && typeof viewer.showModal === "function" && photos.length) {
  const image = viewer.querySelector(".photo-full");
  const caption = viewer.querySelector("#photo-caption");
  const counter = viewer.querySelector(".photo-counter");
  const error = viewer.querySelector(".photo-error");
  const fallback = viewer.querySelector(".photo-fallback");
  let current = 0;
  let opener;

  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    error.hidden = true;
    image.alt = photo.querySelector("img").alt;
    caption.textContent = photo.dataset.caption;
    counter.textContent = `${current + 1} / ${photos.length}`;
    fallback.href = photo.href;
    image.src = photo.href;
  }

  photos.forEach((photo, index) => photo.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = photo;
    show(index);
    viewer.showModal();
    document.body.classList.add("photo-viewing");
  }));

  viewer.querySelector(".photo-close").addEventListener("click", () => viewer.close());
  viewer.querySelector("[data-photo-prev]").addEventListener("click", () => show(current - 1));
  viewer.querySelector("[data-photo-next]").addEventListener("click", () => show(current + 1));
  viewer.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    show(current + (event.key === "ArrowRight" ? 1 : -1));
  });
  viewer.addEventListener("close", () => {
    document.body.classList.remove("photo-viewing");
    opener?.focus({ preventScroll: true });
  });
  image.addEventListener("error", () => { error.hidden = false; });
}
