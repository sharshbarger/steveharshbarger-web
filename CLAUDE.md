# Ravenette

Static single-page site for the Ravenette music project. All content lives in [index.html](index.html); audio and waveform data live alongside it.

## Layout

- [index.html](index.html) — the entire site (markup + CSS + JS inline)
- [audio/](audio/) — track audio files (`.m4a`)
- [peaks/](peaks/) — pre-computed waveform JSON, one per audio file (same stem)
- [images/](images/) — hero/thumb art
- [scripts/generate-peaks.mjs](scripts/generate-peaks.mjs) — regenerates [peaks/](peaks/) from [audio/](audio/)

## The common maintenance task: managing songs

Songs appear in three places in [index.html](index.html):

1. **Hero player** (currently Ravenous) — single `<div class="audio-player">` inside `.hero-player`.
2. **Ideas grid** — the `<div class="tracks-grid">` block. Each song is a `<div class="track-item">` with a manually-numbered `<div class="track-number">01</div>`.
3. **Previous Work / Cult of Helios** — the `.coh-tracks` block. Same player markup, no track numbers.

### Adding / removing / reordering a track in the Ideas grid

Each `track-item` repeats the title in **four** spots — keep them in sync:

- `<div class="track-number">NN</div>` — sequential, manually maintained
- `<div class="track-name">Title</div>`
- `<div class="audio-player" data-src="audio/<stem>.m4a" data-peaks="peaks/<stem>.json" data-title="Title">`
- `<button ... aria-label="Play Title">` and `<div class="ap-title">Title</div>`

When reordering or removing tracks, **renumber the `track-number` values** so they stay 01, 02, 03… with no gaps.

The `<stem>` (filename without extension) must match between [audio/](audio/) and [peaks/](peaks/).

### After adding or replacing an audio file

Run:

```
npm run generate-peaks
```

Requires `ffmpeg` on PATH. The script scans every supported file in [audio/](audio/) and (re)writes the matching `<stem>.json` in [peaks/](peaks/). Removing audio files does not auto-clean [peaks/](peaks/) — delete the stale JSON by hand.

## Local preview

```
PORT=3000 npm start
```

Serves the directory via `npx serve`.
