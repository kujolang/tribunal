window.__timelines = window.__timelines || {};
window.buildTribunalScene = function (id) {
  const host = document.getElementById(id);
  const scene = host.matches("[data-length]") ? host : host.querySelector("[data-length]");
  const timeline = gsap.timeline({ paused: true });
  const zoomEase = window.tribunalZoomEase;
  const focus = Number(scene.dataset.focus);
  const duration = Number(scene.dataset.length);
  const camera = scene.querySelector(".camera");
  const copy = scene.querySelector(".copy");
  const viewport = scene.querySelector(".viewport");

  timeline.fromTo(copy, { y: 24, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.85, ease: zoomEase, immediateRender: false,
  }, 0.08);
  timeline.fromTo(viewport, { y: 18, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.75, ease: zoomEase, immediateRender: false,
  }, 0);
  timeline.fromTo(camera, { scale: 1, x: 0, y: 0 }, {
    scale: Number(scene.dataset.scale), x: Number(scene.dataset.x), y: Number(scene.dataset.y),
    duration: 1.22, ease: zoomEase, immediateRender: false,
  }, focus - 0.45);
  timeline.to(camera, { scale: 1, x: 0, y: 0, duration: 0.93, ease: zoomEase }, duration - 1.05);

  if (id !== "scene-verify") {
    timeline.to([viewport, copy], { opacity: 0, y: -10, duration: 0.26, ease: "power2.in" }, duration - 0.28);
  }
  timeline.to({}, { duration: 0.01 }, duration - 0.01);
  window.__timelines[id] = timeline;
};
