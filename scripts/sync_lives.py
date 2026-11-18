#!/usr/bin/env python3
"""Save up to 10 real, completed YouTube livestreams as shared UGN Media DVDs.

GitHub Actions installs yt-dlp (no YouTube API key) to inspect the channel's
Live tab. Only video IDs actually returned by that page are accepted. Previously
saved entries remain pinned unless the owner changes lives.json deliberately.

The video files themselves remain on YouTube; the site saves the *links*.
"""
import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / 'lives.json'
CHANNEL_ID = 'UCSZKqTk0dxDgN_krIsSa16Q'
CHANNEL_URL = 'https://www.youtube.com/@_UniversalGaming/streams'
MAX_LIVES = 10
ID_PATTERN = re.compile(r'^[A-Za-z0-9_-]{11}$')


def normalize(entry):
    if not isinstance(entry, dict):
        return None
    vid = entry.get('id')
    # A flat-playlist entry may contain the /watch or /live URL.
    if not isinstance(vid, str) or not ID_PATTERN.fullmatch(vid):
        url = str(entry.get('url') or '')
        match = re.search(r'(?:[?&]v=|/live/|youtu\.be/)([A-Za-z0-9_-]{11})(?:$|[?&#/])', url)
        vid = match.group(1) if match else ''
    if not ID_PATTERN.fullmatch(vid):
        return None
    if entry.get('availability') in ('private', 'premium_only', 'subscriber_only', 'needs_auth'):
        return None
    if entry.get('live_status') in ('is_upcoming', 'is_live', 'post_live'):
        return None
    title = entry.get('title')
    if not isinstance(title, str) or not title.strip() or title.strip().lower() in ('private video', 'deleted video'):
        return None
    # A livestream archive returned from the Live tab is considered a replay;
    # yt-dlp's flat entries sometimes omit live_status altogether.
    published = entry.get('published') or entry.get('release_date') or entry.get('upload_date') or ''
    if isinstance(published, str) and re.fullmatch(r'\d{8}', published):
        published = f'{published[:4]}-{published[4:6]}-{published[6:]}T00:00:00Z'
    if not published:
        stamp = entry.get('timestamp') or entry.get('release_timestamp')
        if isinstance(stamp, (int, float)):
            published = datetime.fromtimestamp(stamp, tz=timezone.utc).isoformat()
    return {
        'id': vid,
        'title': title.strip()[:160],
        'description': 'Archived livestream from Universal Gaming Network.',
        'published': str(published)[:40],
        'kind': 'LIVE REPLAY',
    }


def discover(payload):
    entries = payload.get('entries', []) if isinstance(payload, dict) else []
    if not isinstance(entries, list):
        return []
    result, seen = [], set()
    for candidate in entries:
        video = normalize(candidate)
        if video and video['id'] not in seen:
            seen.add(video['id'])
            result.append(video)
    return result


def query_live_tab():
    # Flat mode obtains titles and IDs from the channel tab without downloading
    # videos, and avoids 10 slow per-video extraction requests.
    command = [
        'yt-dlp', '--flat-playlist', '--playlist-end', '80', '--skip-download',
        '--no-warnings', '--dump-single-json',
        CHANNEL_URL,
    ]
    try:
        process = subprocess.run(command, capture_output=True, text=True, timeout=160, check=False)
    except FileNotFoundError as error:
        raise RuntimeError('yt-dlp not installed. GitHub Actions installs it automatically.') from error
    except subprocess.TimeoutExpired as error:
        raise RuntimeError('YouTube Live-tab request timed out.') from error
    if process.returncode != 0:
        raise RuntimeError('Cannot read channel Live tab: '+process.stderr[-1200:])
    try:
        payload = json.loads(process.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError('yt-dlp did not return a JSON playlist') from error
    # Fail safely rather than replacing discs if YouTube redirects or blocks the tab.
    if not isinstance(payload, dict) or not isinstance(payload.get('entries'), list):
        raise RuntimeError('YouTube did not return a valid Live-tab playlist')
    return payload


def run(fixture=None):
    original = json.loads(ARCHIVE.read_text(encoding='utf-8'))
    if original.get('channelId') != CHANNEL_ID:
        raise RuntimeError('lives.json references the wrong YouTube channel')
    payload = json.loads(Path(fixture).read_text(encoding='utf-8')) if fixture else query_live_tab()
    fetched = discover(payload)
    if not fetched:
        raise RuntimeError('No completed livestream replays were detected; kept existing lives.json unchanged.')

    # First preserve owner-curated saved entries. On the first run, select the
    # 10 most recent items returned by the channel Live tab. Never replace them
    # automatically on future runs: a stable curated collection.
    previous = original.get('lives', [])
    saved, seen = [], set()
    for entry in [*previous, *fetched]:
        video = normalize(entry)
        if not video or video['id'] in seen:
            continue
        seen.add(video['id'])
        saved.append(video)
        if len(saved) == MAX_LIVES:
            break
    output = dict(original)
    output.update({'lastSynced': datetime.now(timezone.utc).isoformat(), 'maxFeatured': MAX_LIVES, 'lives': saved})
    ARCHIVE.write_text(json.dumps(output, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(f'UGN livestream discs: {len(saved)}/{MAX_LIVES} saved to lives.json; discovered {len(fetched)} completed broadcasts.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--fixture', help='Local JSON test fixture in yt-dlp playlist format (no network)')
    args = parser.parse_args()
    try:
        run(args.fixture)
    except RuntimeError as error:
        raise SystemExit(f'UGN livestream sync skipped (your saved discs were preserved): {error}') from error
