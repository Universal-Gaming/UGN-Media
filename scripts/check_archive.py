#!/usr/bin/env python3
"""Print the actual saved disc count; fail loudly when automatic discovery finds nothing."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
videos=json.loads((root/"videos.json").read_text(encoding="utf-8")).get("videos",[])
lives=json.loads((root/"lives.json").read_text(encoding="utf-8")).get("lives",[])
print(f"UGN Media: {len(videos)} regular video DVDs, {len(lives)} archived livestream DVDs, plus the default channel collection.")
if not videos and not lives:
    raise SystemExit("No video or livestream DVDs were found. Review the upstream sync errors and provide replay_links and video_links in the manual workflow form as fallback.")
if not lives:
    print("No livestream DVDs yet. YouTube may be blocking Live-tab scraping, or the channel has no public completed replays. Use replay_links to pin real links.")
