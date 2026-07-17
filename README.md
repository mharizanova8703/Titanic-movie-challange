
# Titanic — A Love Story

A scroll-driven cinematic film inspired by *Titanic* (1997). The page itself is
the movie: scrolling scrubs through a pinned horizontal reel of full-screen
scenes with Ken Burns motion, crossfades, subtitle captions, a color grade that
turns cold at the iceberg, and a fade to black before the credits.

## The scroll timeline

| Scroll | Scene | Treatment |
|---|---|---|
| 0–15% | **Hero** | `film-hero.jpg` slowly zooming behind canvas waves, fog, and the opening quote; Enter starts the wave soundscape |
| — | **Chapter I · Boarding** | Pinned horizontal gallery: the ship, the ticket (3D tilt), luggage & Grand Staircase line art drawing itself |
| 15–35% | **Jack Meets Rose** | Crossfade `film-rose` → `film-captain` → `scene.jpg`, slow pans, floating gold dust, dialogue captions |
| 35–60% | **Falling in Love** | `film-bow` → `film-flying` → `scene-2.jpg`, warm grade, *"I'm flying, Jack."* |
| 60–80% | **The Iceberg** | Storm still, cold multiply grade sweeps in, 37-second countdown |
| 80–100% | **Never Let Go** | Typography only, frost particles, the promise — then fade to black |
| after | **Ending** | Calm canvas ocean, final quote, film-style rolling credits → *fin* |

## Craft

- **Motion** — GSAP ScrollTrigger (CDN): one master pinned timeline for the
  reel (hold/move rhythm per scene), a second pin for the boarding gallery,
  SVG stroke draw-on via `containerAnimation`, scrubbed credits roll
- **Sound** — procedural ocean surf (Web Audio brown noise + lowpass + swell
  LFO), started by the Enter gesture, toggle in the header
- **Atmosphere** — hand-rolled canvases (layered waves, starfield, gold dust,
  frost) that animate only while on screen; CSS fog
- **Fallbacks** — below 820px and under `prefers-reduced-motion` the reel
  stacks vertically with static stills and visible captions; the site works
  without the GSAP CDN
- **Grade** — all stills desaturated/darkened via CSS filters, 40–60% shade
  overlays keep text readable

## Note

The film stills in `assets/` keep this a **personal, local tribute** — not for
publication or profit. Swap in original or licensed imagery before sharing
publicly.

## Run

No build step. Open `index.html`, or serve locally:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```
