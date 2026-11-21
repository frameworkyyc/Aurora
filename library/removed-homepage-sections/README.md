# Homepage sections removed from the live page (kept for reuse)

Removed from `index.html` in one commit. This folder is not deployed (`library/` is in `.assetsignore`).

| File | What it is |
|---|---|
| `setup-section.html` | "Every observation starts the same way": the dark total-station sequence (backdrop sky and ridge, the instrument stage with its readout annotations, and the three beats) |
| `setup-total-station-webgl.js` | The WebGL total station (three.js from a CDN, loading `assets/station.glb`) and its scroll-driven stages |
| `setup-rig2d-fallback.js` | The canvas-2D renderer used when WebGL or the CDN is unavailable |
| `setup-instrument-readings.js` | The instrument's readouts and leader lines resolving as the sequence advances |
| `capture-section.html` | "Ten million points…": the reality-capture sequence markup |
| `capture-visualization.js` | The point-cloud canvas (raw returns to registered cloud to surface mesh to deliverable) and the heading that recedes as the first note arrives |
| `featured-projects-section.html` | "Real jobs, real latitudes": the three featured project cards |

## Putting a section back
1. Paste the HTML back into `index.html` at the point you want it. Original order was `expertise` → `setup` → `capture` → `teasers.feat` → `about`.
2. Append the matching `.js` file(s) to `assets/app.js`. The setup sequence needs all three `setup-*` files. The old order was rig2D, then WebGL, then (later in the file) readings. The sky for `.setup-sky` was also started with `nightSky(document.querySelector('.setup-sky'), {rate:0.0045, aurora:true});` next to the other `nightSky(...)` calls.
3. The CSS for all of these is still in `assets/style.css` (`.setup*`, `.rig*`, `.beat*`, `.capture*`, `.teasers`, `.teaser*`, `.feat`), and `assets/station.glb` and the `assets/card-*.jpg` images are still in place, so nothing else needs restoring.
4. In `assets/portfolio-demo.js`, add steps for the section back into `STEPS`.
5. The `.about` section now carries a phone-only mountain break at its top. Remove that ridge block if the featured projects section returns above it.

The Projects page and all project data are untouched; the same three projects still live there.
