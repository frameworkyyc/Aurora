# Animated surveyor — delivery spec

The homepage mountain band has a slot for a transparent, looping animation of a
surveyor. Until files are supplied, the static SVG figure is shown. This file
lives in `library/` and is not deployed.

## What the animation shows

A white silhouette of a surveyor, a total station on a tripod and an equipment
case, standing on level ground. Over 4–6 seconds the surveyor bends down to
take something from the case, stands up, and adjusts the total station. The
last frame must match the first so the loop is seamless.

## Files

| Purpose | Format | Notes |
|---|---|---|
| Chrome, Edge, Firefox | **WebM, VP9 with alpha** (`yuva420p`) | e.g. `surveyor.webm` |
| Safari / iOS | **HEVC with alpha** (`.mov` or `.mp4`, `hvc1`) | e.g. `surveyor-hevc.mov`, exported from Apple Compressor / Final Cut / After Effects |
| Reduced motion | **PNG with transparency** (optional) | A single still, ideally the first frame. Without it, the static SVG figure is shown. |

- Canvas: **square, 800 × 800 px** (1:1). Any other ratio works if `data-aspect` is changed to width ÷ height.
- Background: fully transparent. Figure, tripod, instrument and case in solid white (#FFFFFF), no shadow, no glow.
- Ground line: the surveyor's feet and the tripod feet rest on one horizontal line at **96% of the frame height** from the top, with the scene centred horizontally. Keep the case and the tripod within the middle ~70% of the width so everything stays on the summit.
- Scale: the surveyor standing upright about **45–50%** of the frame height.
- Frame rate 24 or 30 fps, no audio. Aim for under ~1.5 MB per file.

A quick WebM conversion from a transparent PNG sequence:

```
ffmpeg -framerate 30 -i frame_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -an surveyor.webm
```

## Installing

1. Put the files in `assets/anim/`.
2. In `index.html`, fill the slot's attributes (inside `.wwd-ridge`):

```html
<div class="wr-anim" data-anchor="1472 108" data-width="128" data-aspect="1" data-foot="0.5 0.96"
     data-webm="assets/anim/surveyor.webm" data-hevc="assets/anim/surveyor-hevc.mov"
     data-poster="assets/anim/surveyor-still.png" aria-hidden="true"></div>
```

- `data-anchor` — the summit point in the mountain SVG's own coordinates (do not change unless the range changes).
- `data-width` — the animation's width in those coordinates (128 ≈ 96 px wide on a 1440 px screen, ≈ 58 px on a phone).
- `data-foot` — where the feet sit in the frame, as fractions of width and height.

The page loads the video only when the mountains come near the screen, swaps it
in once it is actually playing, loops while visible, pauses off screen or in a
hidden tab, and never plays it with reduced motion.
