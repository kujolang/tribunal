import { spring } from "motion";

// Sample the spring once so HyperFrames and the renderer can seek to any frame.
const travel = spring({ keyframes: [0, 1], duration: 1000, bounce: 0 });
const end = travel.next(1000).value;
window.tribunalZoomEase = (progress) => travel.next(progress * 1000).value / end;
