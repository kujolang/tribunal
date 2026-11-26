"""Generate one Eleven v4 take per caption cue and measure its duration."""
import json
import math
import os
from pathlib import Path
import subprocess
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[1]
chapters = json.loads((root / "chapters.json").read_text())
key = os.environ.get("ELEVENLABS_API_KEY")
if not key:
    raise SystemExit("Set ELEVENLABS_API_KEY in the environment.")

voice = os.environ.get("ELEVENLABS_VOICE_ID", "eXpIbVcVbLo8ZJQDlDnl")
endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
cursor = 0
for chapter in chapters:
    chapter["start"] = cursor
    chapter["cues"] = []
    cursor += 1.2
    for number, line in enumerate(chapter["narration"], 1):
        asset = f"assets/{chapter['id']}-{number}.mp3"
        path = root / asset
        if not path.exists():
            request = Request(
                endpoint,
                data=json.dumps({
                    "text": line, "model_id": "eleven_v4",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                }).encode(),
                headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
            )
            with urlopen(request, timeout=45) as response:
                path.write_bytes(response.read())
        duration = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path,
        ]))
        duration = math.ceil(duration * 30) / 30
        chapter["cues"].append({"asset": asset, "start": round(cursor, 4), "duration": duration, "text": line})
        cursor += duration + 0.22
    cursor = math.ceil((cursor + 1.2) * 30) / 30
    chapter["end"] = cursor
(root / "timing.json").write_text(json.dumps(chapters, indent=2) + "\n")
