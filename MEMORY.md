# Architecture notes

- A local Canvas 2D pond derived from the MIT-licensed Interactive Koi Pond.
- Procedural scenery and individual leaf sprites are cached between resizes. Light caustics update at 15 Hz.
- Fish use smooth bounded turning, individual cruise/coast/hover states and gradual depth changes.
- Fish appearance and movement share a centerline; fine scales are reserved for enlarged views.
- Default settings are 60 koi, size 0.36 and speed 0.8. Lively can retain user settings independently of bundled defaults.
- Resize preserves relative positions to avoid packing fish along a screen edge.
- Timing measurements of JavaScript callbacks do not establish desktop GPU frame rate.

- Feeding growth uses stable numeric slots and localStorage key lotus-pond-growth-v1 (version 1). Preserve this key and existing meal counts during upgrades. Growth is capped at 1.75x; storage failure falls back to session-only growth. Runtime remains koi-only.
