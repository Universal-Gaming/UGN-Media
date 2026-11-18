#!/usr/bin/env python3
"""Sync official YouTube channel uploads into videos.json. Standard library only.

The static website requires no YouTube API key; this script is run by GitHub
Actions. YouTube's RSS feed exposes the most recent uploads (~15 videos).
Existing valid entries are kept so the archive can grow to 60 discs.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / 'videos.json'
CHANNEL = 'UCSZKqTk0dxDgN_krIsSa16Q'
NAMESPACES = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
URL = f'https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL}'


def main():
    old = json.loads(PATH.read_text(encoding='utf-8'))
    req = Request(URL, headers={'User-Agent': 'Mozilla/5.0 (compatible; UGNMediaSync/1.0)', 'Accept':'application/atom+xml, application/xml, text/xml'})
    try:
        with urlopen(req, timeout=25) as response:
            body = response.read(2_000_000)
    except (URLError, HTTPError, TimeoutError) as error:
        raise SystemExit(f'YouTube RSS fetch failed; videos.json unchanged: {error}') from error
    feed = ET.fromstring(body)
    fetched = []
    for entry in feed.findall('atom:entry', NAMESPACES):
        video_id = entry.findtext('yt:videoId', default='', namespaces=NAMESPACES)
        title = entry.findtext('atom:title', default='', namespaces=NAMESPACES)
        published = entry.findtext('atom:published', default='', namespaces=NAMESPACES)
        if len(video_id) != 11 or not title:
            continue
        fetched.append({'id': video_id, 'title': title[:160], 'published': published, 'kind': 'OFFICIAL UPLOAD'})
    if not fetched:
        raise SystemExit('RSS feed contained no valid videos; videos.json unchanged.')
    previous = old.get('videos', [])
    combined = fetched + [v for v in previous if isinstance(v,dict)]
    seen = set()
    unique = []
    for v in combined:
        if not isinstance(v.get('id'),str) or len(v['id']) != 11 or v['id'] in seen:
            continue
        seen.add(v['id'])
        unique.append(v)
        if len(unique) >= 60:
            break
    out = {'channelId': CHANNEL, 'channelUrl':'https://www.youtube.com/@_UniversalGaming', 'lastSynced': datetime.now(timezone.utc).isoformat(), 'videos': unique}
    PATH.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n', encoding='utf-8')
    print(f'Synced {len(fetched)} newest YouTube uploads; {len(unique)} archived discs in videos.json')


if __name__ == '__main__':
    main()
