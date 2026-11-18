# UGN Media — The Galactic Video Archive

A complete, **static GitHub Pages site** based on an original interpretation of the late-night 3D desk concept, branded for Universal Gaming Network. Source code, procedural graphics, a cinematic DVD library, interactive CRT and sound are included. No backend and no YouTube API key are needed.

**Live links:** [Universal Gaming Network](https://universalgaming.us/) · [UGN YouTube](https://www.youtube.com/@_UniversalGaming) · [Discord](https://discord.universalgaming.us/)

## Publish on GitHub Pages

1. On GitHub, create a repository named **UGN-Media** under **Universal-Gaming** (or your own account). Set it to **Public** to use GitHub Pages on a free GitHub plan.
2. Upload the **contents** of this project folder into the repository's top level, including the hidden `.github/workflows` directory. Commit the files to the **main** branch.
3. Open repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Select **main** and **/(root)**, then **Save**.
4. Open `https://universal-gaming.github.io/UGN-Media/` (if using that exact account/repository). The GitHub Pages site is served over HTTPS. It may take a short time for GitHub to publish.
5. Open **Actions → Sync UGN YouTube DVDs → Run workflow**. The workflow fetches ordinary uploads from official RSS into `videos.json` and scans the same channel’s **Live** tab using `yt-dlp` for **up to 10 completed livestream replays**. It saves those 10 as playable site-wide discs in `lives.json`. The workflow then commits both archives back to `main` so every visitor sees the same saved cases. The schedule checks daily, but once 10 livestreams are filled they **stay pinned**, not replaced by new broadcasts. If prompted, enable Actions and give **Workflow permissions: Read and write permissions** under **Settings → Actions → General**.

**Until you run the sync, the LIVE REPLAYS tab shows 0/10 saved, not fabricated videos.** GitHub Actions needs the public Live tab to be readable; a failure shows in the run log without deleting saved entries. If the channel has fewer than 10 public finished livestreams, fewer than 10 cases will appear.

**What works immediately before the video sync:** The **all uploads** disc plays the YouTube channel's uploads playlist, the full desk and all controls are available, and the viewer can use **Add Video Link** to import an individual YouTube video to this browser. The manual browser collection is local, not published to every visitor.

**YouTube note:** YouTube embeds remain hosted and played by YouTube, with its native controls. The CRT animation moves into a full-screen overlay for playback because a WebGL canvas cannot legally or technically render arbitrary cross-origin YouTube video as a texture. Embeds may be blocked for a particular video, by browser privacy settings, or by network restrictions. Use the **YOUTUBE ↗** button as fallback. To see new videos on the DVDs, the scheduled RSS workflow must run successfully. YouTube's official RSS feed provides only the most recent uploads at a time; older uploads are preserved as the updater runs.

## Controls

| Action | Desktop | Mobile / touch |
|---|---|---|
| Pick a video | Click a 3D DVD case; or open the Disc Library | Tap **DISCS** / menu |
| Load disc | **INSERT & PLAY** on open case | Same |
| CRT zoom | `Z` | **SCREEN** |
| Eject | `E` | **EJECT** |
| Raise/lower blinds | `W` | **WINDOW** |
| Lamp | `L` | **LAMP** |
| Ambient synthesized sound | `S` | **SOUND** |
| CRT power | `P` | **POWER** |
| Library | `B` | **DISCS** |
| Next/previous disc | `→` / `←` | Select from list |
| Close overlay | `Escape` | `✕` |

## Add or pin individual videos for everyone

Edit `videos.json` (it contains verified video IDs and titles) and commit. Example:

```json
{
  "channelId": "UCSZKqTk0dxDgN_krIsSa16Q",
  "channelUrl": "https://www.youtube.com/@_UniversalGaming",
  "lastSynced": null,
  "videos": [
    {"id": "YOUR_VIDEO_ID", "title": "Your UGN Episode", "published": "2026-11-18T00:00:00Z", "kind": "FEATURED VIDEO"}
  ]
}
```

Replace `YOUR_VIDEO_ID` with the **real 11-character ID** from a YouTube URL. The automatic sync retains valid existing entries, so manual additions remain in the archive (up to the most recent 60 unique records). The 3D desk displays up to 18 physical cases for performance; the full Library can show more than 60 total discs, including the uploads collection and your 10 saved livestreams.

## 10 saved LIVE REPLAY DVDs (new in v1.1)

Your livestream discs are **saved site-wide**, not just on the browser where you add them:

1. In your GitHub repository, include `lives.json`, `scripts/sync_lives.py`, and the revised `.github/workflows/sync-youtube.yml` along with the updated site files.
2. Under **Actions**, run **Sync UGN YouTube DVDs** manually. The workflow installs `yt-dlp`, reads the **Live** tab of `https://www.youtube.com/@_UniversalGaming/streams` and looks for up to 10 real, completed public broadcasts. It does not invent links, download videos or require an API key.
3. On a successful run, the workflow writes the selected IDs/titles to `lives.json` and commits the file. Visit the **DISCS → ● LIVE REPLAYS** tab and select one to open its case and play in the CRT.
4. **Your 10 stays saved.** Later syncs preserve already archived livestreams in `lives.json` and only fill any remaining slots. This persists across page reloads, browsers and GitHub Pages deployments. To replace a specific featured livestream, edit or remove it from `lives.json` in GitHub, then commit. If the Live tab can't be read, existing discs are not deleted.
5. To hand-pick your own 10 streams, edit `lives.json` directly. Each disc has a real 11-character YouTube ID and a title. The format is:

```json
{
  "id": "REAL_11_CHAR_VIDEO_ID",
  "title": "UGN Livestream Replay Title",
  "published": "2026-11-18T00:00:00Z",
  "kind": "LIVE REPLAY"
}
```

That object belongs inside the `lives` array and is **a format example, not a real video**. You can add up to 10 objects, using actual URLs from your channel’s YouTube Live tab. IDs do not need `https://` prefixes. Each save is a **link to a YouTube replay**, not a downloadable backup of the stream video. Replays must remain accessible and embedding permitted on YouTube to play on the CRT.

Alternatively, use **＋ ADD VIDEO LINK → Saved livestream replay** to save a live disc on *your current browser only*; publishing site-wide requires an entry in `lives.json` or the GitHub Action.

## Development

Run a local HTTP server from the project directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. Opening the HTML as `file://` can prevent module imports or JSON fetches. A modern browser with WebGL2 recommended. Three.js is imported from jsDelivr CDN; **internet access is required** to load the 3D engine and YouTube embeds. The site falls back to its functional text-based video library if WebGL or the CDN is unavailable. The synthesized ambience does not load third-party audio. Fonts require Google Fonts; system fallback fonts are included.

## Files

- `index.html` — semantic markup, overlays, controls, YouTube player.
- `styles.css` — cosmic UI, responsive layouts and animated DVD open case.
- `app.js` — video library, native embeds, actions, accessibility and local saved discs.
- `scene.js` — real-time Three.js geometry, night city, rain, CRT and desk interaction.
- `videos.json` — static shared normal video archive.
- `lives.json` — **10 pinned shared livestream replay DVD cases**, maintained by sync and by the owner.
- `scripts/sync_youtube.py` — YouTube RSS to JSON (Python stdlib only).
- `scripts/sync_lives.py` — optional 10-live-replay discovery via `yt-dlp`, run in GitHub Actions.
- `.github/workflows/sync-youtube.yml` — automatic/daily YouTube updater.
- `assets/` — original favicon and preview placeholder artwork.

## Limitations and privacy

The scene is **procedurally modeled**, not a pixel-identical copy of the screenshot or a photogrammetry scan. DVD opening is animated in the HTML interface; insertion is a 3D object transition. The player's actual video remains in a standard YouTube iframe for compatibility. The initial archive is not populated with guessed links or fabricated video IDs. No API secrets or access tokens are embedded in the site. Local added links are stored in your own browser's `localStorage`. The 10 shared replay links are stored permanently in the Git repository as `lives.json`. Viewer interactions are not tracked by this project, although YouTube's embedded player may handle information under YouTube's own policies.

UGN Media is an independent UGN-themed original implementation; the example site's proprietary source, art, and trade dress have not been copied.
