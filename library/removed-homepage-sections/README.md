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
| `intro-integrate-section.html` | The "We integrate with every member of your team, from shovel-holder to stakeholder" section, its two buttons and the latitude timeline (Vancouver, Port Alice, KSM Mine, Baffin Island) |
| `intro-headline-lines.js` | The line-by-line headline reveal for that section |
| `intro-traverse-and-stations.js` | The timeline's station buttons and its self-running traverse line |
| `featured-projects-section.html` | "Real jobs, real latitudes": the three featured project cards |

## Putting a section back
1. Paste the HTML back into `index.html` at the point you want it. Original order was `expertise` → `setup` → `capture` → `teasers.feat` → `about`.
2. Append the matching `.js` file(s) to `assets/app.js`. The setup sequence needs all three `setup-*` files. The old order was rig2D, then WebGL, then (later in the file) readings. The sky for `.setup-sky` was also started with `nightSky(document.querySelector('.setup-sky'), {rate:0.0045, aurora:true});` next to the other `nightSky(...)` calls.
3. The CSS for all of these is still in `assets/style.css` (`.setup*`, `.rig*`, `.beat*`, `.capture*`, `.teasers`, `.teaser*`, `.feat`), and `assets/station.glb` and the `assets/card-*.jpg` images are still in place, so nothing else needs restoring.
4. In `assets/portfolio-demo.js`, add steps for the section back into `STEPS`.
5. The `.about` section now carries a phone-only mountain break at its top. Remove that ridge block if the featured projects section returns above it.

The Projects page and all project data are untouched; the same three projects still live there.


The "We integrate…" message now lives in the About section's copy. To restore the standalone section, put `intro-integrate-section.html` back before the contact section, add `intro-traverse-and-stations.js` back at the top of the first `(function(){ ... })` block in `assets/app.js` (before the parallax code), and re-add the headline code from `intro-headline-lines.js` to the hero choreography block, where `splitLines`, `setup()` and the observer need `var intro = document.querySelector('.intro');` defined first. Its CSS is still in `assets/style.css`.

## Update
The total-station sequence and the point-cloud visualization now live on `services.html` (scripts concatenated, unchanged, in `assets/services-motion.js`; sky canvas started in `assets/app.js`). The files here remain the reference copies.
