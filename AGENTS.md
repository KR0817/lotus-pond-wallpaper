# Project rules

- Runtime: plain JavaScript and Canvas 2D; no build step or external requests.
- Keep Lively property names and their saved-value compatibility intact.
- Preserve MIT license and original author attribution.
- Check syntax with `node --check script.js` and `node --check pond-scene.js`.
- Run `node tests/behavior.cjs` and `node tests/motion.cjs` after behavior changes.
- Review desktop and portrait rendering in a browser; verify Lively output separately.
- Do not commit local settings, credentials, generated test outputs or installation paths.

- Run `node tests/growth.cjs` for feeding/save changes. Preserve growth save key and slot indices; keep the runtime koi-only.
