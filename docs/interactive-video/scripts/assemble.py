"""Build the editable film and the chaptered player from the measured voice takes."""
from html import escape
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
chapters = json.loads((root / "timing.json").read_text())
duration = chapters[-1]["end"]
templates = dict(re.findall(
    r'<template id="([^"]+)">(.*?)</template>',
    (root / "scripts/film-scenes.html").read_text(), re.S,
))
framing = {
    "proposal": (1.18, 55, 15), "hearing": (1.12, 24, 3),
    "challenge": (1.20, 60, 20), "ruling": (1.18, 55, 15),
    "verify": (1.13, 42, -7),
}

def timestamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1_000)
    return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"

def audio(id, path, start, length, track, volume):
    return (f'<audio id="{id}" class="clip" src="{path}" data-start="{start:.4f}" '
            f'data-duration="{length:.4f}" data-track-index="{track}" data-volume="{volume}"></audio>')

scenes = []
tracks = [audio("score", "assets/score.m4a", 0, duration, 2, 0.8),
          audio("effects", "assets/effects.m4a", 0, duration, 3, 0.7)]
captions = ["WEBVTT"]
navigation = []
transcript = []
for chapter in chapters:
    id, title, headline, start, end, cues = (
        chapter[key] for key in ("id", "title", "headline", "start", "end", "cues")
    )
    scale, x, y = framing[id]
    scenes.append(f'''
    <div id="scene-{id}" class="clip" data-composition-id="scene-{id}"
      data-composition-src="compositions/{id}.html" data-start="{start:.4f}"
      data-duration="{end-start:.4f}" data-track-index="0" data-track-kind="graphics"></div>''')
    (root / "compositions" / f"{id}.html").write_text(f'''<template>
  <style>#root {{ position: absolute; inset: 0 }}</style>
  <section id="root" data-composition-id="scene-{id}" data-width="1920" data-height="1080"
    data-focus="{cues[1]['start']-start:.4f}" data-length="{end-start:.4f}"
    data-scale="{scale}" data-x="{x}" data-y="{y}">
    <div class="copy"><p class="eyebrow">{escape(title)}</p><h1 class="headline">{escape(headline)}</h1></div>
    <div class="viewport" data-layout-allow-overflow>{templates[id]}</div>
  </section>
  <script>window.buildTribunalScene("scene-{id}");</script>
</template>
''')
    navigation.append(f'<button type="button" data-start="{start:.4f}">{escape(title)}</button>')
    transcript.append(f'<div><h3>{escape(title)}</h3><p>{escape(" ".join(chapter["narration"]))}</p></div>')
    for index, cue in enumerate(cues, 1):
        tracks.append(audio(f"voice-{id}-{index}", cue["asset"], cue["start"], cue["duration"], 1, 0.93))
        captions.append(f"{timestamp(cue['start'])} --> {timestamp(cue['start'] + cue['duration'])}\n{cue['text']}")

(root / "index.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><title>Tribunal · Decision evidence</title>
  <link rel="stylesheet" href="film.css">
  <script src="assets/gsap.min.js"></script>
  <script src="assets/motion-spring.js"></script>
  <script src="film.js"></script>
</head>
<body>
<main id="film" data-composition-id="tribunal-film" data-start="0" data-duration="{duration:.4f}"
  data-width="1920" data-height="1080" data-fps="30" data-no-timeline>
  <header class="mast"><span class="brand">Tribunal</span><span class="meta">Decision review · Worked example</span></header>
{"".join(scenes).lstrip(chr(10))}
  <footer class="footer"><span>Kujo · Tribunal</span><span>Local mock hearing</span></footer>
  {"".join(tracks)}
</main>
</body>
</html>
""")
(root / "assets/captions.vtt").write_text("\n\n".join(captions) + "\n")
player = (root / "scripts/player.html").read_text()
(root / "watch.html").write_text(player.replace("<!-- Chapters -->", "\n".join(navigation))
    .replace("<!-- Transcript -->", "\n".join(transcript)))
