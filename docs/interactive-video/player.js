const video = document.querySelector("video");
const chapters = [...document.querySelectorAll("button[data-start]")];

function updateChapter() {
  const active = chapters.findLast((button) => video.currentTime >= Number(button.dataset.start) - 0.01);
  for (const button of chapters) {
    if (button === active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
}

for (const button of chapters) {
  button.addEventListener("click", () => {
    video.currentTime = Number(button.dataset.start);
    updateChapter();
    video.play().catch(() => {});
  });
}
video.addEventListener("timeupdate", updateChapter);
video.addEventListener("seeked", updateChapter);
updateChapter();
