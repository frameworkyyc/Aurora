# Animated surveyor — how it is built and installed

This file lives in `library/`, which is not deployed.

## Current animation (approved)
A 12-second loop at 24 fps. The surveyor:
1. finishes sighting through the total station, steps back and turns;
2. walks to the equipment case, kneels, opens it and takes out two items, then closes it;
3. stands, walks back, adjusts the instrument and resumes sighting.

The tripod, instrument and case never move.

It was generated with Higgsfield MiniMax H3 as two 6-second clips. Clip A runs from the standing reference to the kneeling keyframe, and Clip B from the kneeling keyframe back to the reference. Both are white silhouettes on black. They were joined at the shared keyframe and retimed to exactly 12.0 s. The reference frames are in `library/surveyor/`.

## Website files (`assets/anim/`)
| File | Used by | Notes |
|---|---|---|
| `surveyor.webm` | Chrome, Edge, Firefox | VP9 with alpha (`yuva420p`), 340×240, ~205 KB |
| `surveyor.mp4` | Safari and every iOS browser | H.264 white-on-black, ~126 KB. The page blends it with `mix-blend-mode: screen`, so the black disappears without an alpha channel |
| `surveyor-still.png` | reduced motion; shown until the video plays | first frame, transparent |

The ProRes 4444 master with alpha (946×668) was handed over separately, since it is too large to keep in the repository.

The frames are a crop of the 1920×1080 master: x 459–1405, y 382–1050. The alpha channel is made from luminance, (Y − 24) × 255 / 200, clipped.

## Placement (`.wr-anim` in `index.html`)
```html
<div class="wr-anim" data-anchor="1488 108" data-width="80.8" data-aspect="1.4167" data-foot="0.836 0.9805"
     data-webm="assets/anim/surveyor.webm" data-mp4="assets/anim/surveyor.mp4"
     data-poster="assets/anim/surveyor-still.png" aria-hidden="true"></div>
```
- `data-anchor`: the point on the flat ledge in the mountain SVG's own units. The ledge runs from x 1412 to 1512 at y 108.
- `data-foot`: where that point sits in the video frame, as fractions of its width and height. This is the foot of the tripod's centre leg, on the ground line.
- `data-width`: the video's width in SVG units. 0.0854 units per master pixel keeps the surveyor at the size of the earlier static figure.

The page waits until the mountains come near the screen. It then shows the still in place of the static SVG figure and plays the video over it. The loop pauses off screen and in a hidden tab, and with reduced motion only the still is shown.
