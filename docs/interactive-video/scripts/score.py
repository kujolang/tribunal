"""Synthesize the original ambient score and chapter/zoom sound cues."""
import json
from pathlib import Path
import subprocess

import numpy as np

root = Path(__file__).resolve().parents[1]
chapters = json.loads((root / "timing.json").read_text())
rate = 48000
length = round(chapters[-1]["end"] * rate)
score = np.zeros((length, 2))
effects = np.zeros_like(score)
rng = np.random.default_rng(1729)

def signal(seconds):
    return np.arange(round(seconds * rate)) / rate

def place(bus, wave, at, pan=0):
    index = round(at * rate)
    if index >= len(bus):
        return
    wave = wave[:len(bus) - index]
    bus[index:index + len(wave)] += wave[:, None] * [1 - max(0, pan), 1 + min(0, pan)]

def sine(hz, time):
    return np.sin(2 * np.pi * hz * time)

def hz(note):
    return 440 * 2 ** ((note - 69) / 12)

chords = [(45, 52, 55, 60, 64), (41, 48, 52, 55, 59), (48, 55, 59, 62, 64), (43, 50, 53, 57, 62)]
for bar, at in enumerate(np.arange(0, length / rate, 3.9)):
    chord = chords[bar % len(chords)]
    time = signal(5.35)
    envelope = np.clip(time / 1.5, 0, 1) * np.clip((5.35 - time) / 1.7, 0, 1)
    for index, note in enumerate(chord):
        frequency = hz(note)
        wave = sine(frequency, time) + 0.19 * sine(frequency * 2.002, time)
        place(score, wave * envelope * 0.020, at, (index - 2) * 0.24)
    time = signal(1.8)
    for index, beat in enumerate([0, 0.975, 1.95, 2.925]):
        frequency = hz(chord[2 + index % 3] + 12)
        tone = sine(frequency, time) + 0.28 * sine(frequency * 2.01, time)
        tone *= (1 - np.exp(-55 * time)) * np.exp(-3.8 * time) * 0.019
        place(score, tone, at + beat, 0.23 if index % 2 else -0.23)

for chapter in chapters:
    time = signal(0.82)
    bloom = (1 - np.exp(-110 * time)) * np.exp(-8 * time)
    place(effects, (sine(246.94, time) + 0.25 * sine(493.88, time)) * bloom * 0.13, chapter["start"])
    time = signal(0.72)
    noise = np.interp(time, time[::20], rng.uniform(-1, 1, len(time[::20])))
    envelope = np.sin(np.pi * time / 0.72) ** 3
    sweep = sine(400 - 100 * time, time)
    place(effects, (0.047 * noise + 0.035 * sweep) * envelope, chapter["cues"][1]["start"] - 0.45)

fade_in = round(rate * 0.9)
fade_out = round(rate * 1.15)
score[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
score[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
for name, bus in [("score", score), ("effects", effects)]:
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(rate), "-ac", "2", "-i", "-",
        "-c:a", "aac", "-b:a", "160k", root / f"assets/{name}.m4a",
    ], input=bus.astype("<f4").tobytes(), check=True)
