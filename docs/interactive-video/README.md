# Tribunal interactive walkthrough

Run `python3 -m http.server 8080` from this directory and open [the interactive player](http://localhost:8080/watch.html). Select a chapter to jump to that part of the film. The player also has English captions and an expandable transcript. The standalone 1080p film is at `assets/tribunal.mp4`.

## Edit and render

Use Node.js 22 or newer, FFmpeg, and Chrome. Run `npm ci`, then `npm run preview` to edit in HyperFrames. Run `npm run check` and `npm run render` after an edit.

The five scene sources are in `scripts/film-scenes.html`, and the narration is in `chapters.json`. `python3 scripts/assemble.py` rebuilds the composition, player and captions from the measured take timings in `timing.json`. The camera uses Motion spring easing on seekable GSAP timelines. The included MP4 was assembled in software from HyperFrames-compiled scene plates, Motion spring samples, and the HyperFrames audio mix.

If you change the narration, remove only the replaced takes before running `ELEVENLABS_API_KEY=… python3 scripts/narrate.py`. Narration uses ElevenLabs Eleven v4 with the Siren preset. Regenerate the original music and sound cues with `python3 scripts/score.py` (requires NumPy). Run the assembly script after regenerating the timings.

## Source evidence

The film follows the repository's `examples/product-decision.md` through a real offline mock run on Tribunal source commit `fa4ffd2c9bb6ee5d8285dfb5c161b844e6e75b7c`. The docket, testimony and decision packet are typeset excerpts. The dashboard image is a capture of the actual local dashboard export.

Run `2026-11-26-product-decision-md-8414` completed with a conditional proceed ruling. `tribunal verify` checked 21 artifacts against manifest SHA-256 `f5ca2f6d99c2e6fd298ac6260062f189cfddf3fb19900862fd13b7184535e0d1`.
