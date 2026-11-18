#!/usr/bin/env python3
"""Pin user-selected YouTube links as shared DVD entries (no downloads)."""
import json, os, re
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

ROOT=Path(__file__).resolve().parent.parent
VALID=re.compile(r"^[A-Za-z0-9_-]{11}$")

def video_id(source):
    try:
        u=urlsplit(source.strip())
        if u.scheme not in ("https","http"): return None
        host=(u.hostname or "").lower()
        if host in ("youtube.com","www.youtube.com","m.youtube.com","music.youtube.com"):
            parts=u.path.strip("/").split("/")
            if parts==["watch"]: ident=parse_qs(u.query).get("v",[""])[0]
            elif len(parts)==2 and parts[0] in ("live","shorts","embed"): ident=parts[1]
            else: return None
        elif host in ("youtu.be","www.youtu.be"): ident=u.path.strip("/").split("/")[0]
        else: return None
        return ident if VALID.fullmatch(ident) else None
    except ValueError:
        return None

def entries(value,kind,max_items):
    output=[]; seen=set()
    for linenum,raw in enumerate(value.splitlines(),1):
        raw=raw.strip()
        if not raw or raw.startswith("#"): continue
        url,sep,title=raw.partition("|")
        ident=video_id(url)
        if not ident: raise SystemExit(f"Invalid YouTube URL on line {linenum}. Please use a public watch, live, or youtu.be link.")
        if ident in seen: continue
        seen.add(ident)
        output.append({"id":ident,"title":(title.strip() if sep else "")[:160] or f"UGN {kind.title()} {len(output)+1:02d}","published":"","kind":kind})
        if len(output)>=max_items: break
    return output

def save(filename,key,new,limit):
    p=ROOT/filename; archive=json.loads(p.read_text(encoding="utf-8"))
    result=[]; seen=set()
    for entry in new+archive.get(key,[]):
        if not isinstance(entry,dict): continue
        ident=entry.get("id")
        if not isinstance(ident,str) or not VALID.fullmatch(ident) or ident in seen: continue
        seen.add(ident); result.append(entry)
        if len(result)>=limit: break
    archive[key]=result
    p.write_text(json.dumps(archive,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"{filename}: {len(result)} saved disc(s)")

if __name__=="__main__":
    links=os.environ.get("UGN_LIVE_LINKS","").strip()
    videos=os.environ.get("UGN_VIDEO_LINKS","").strip()
    if links: save("lives.json","lives",entries(links,"LIVE REPLAY",10),10)
    if videos: save("videos.json","videos",entries(videos,"OFFICIAL UPLOAD",60),60)
    if not links and not videos: print("No manual YouTube links provided; automatic discovery will run.")
