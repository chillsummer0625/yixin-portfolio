# Yixin Cui - Interactive Portfolio

A dependency-free first version of Yixin's interactive personal book. It supports direct chapter navigation, page-turn motion and sound, English/Chinese content, keyboard and touch controls, and a downloadable resume.

## Run locally

```bash
npm run dev
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

No install step is required.

## Edit content

- `site-data.js`: bilingual copy, experience timeline, featured projects, and metrics.
- `styles.css`: design tokens, layout, motion, and responsive behavior.
- `assets/homepage-room.png`: replaceable homepage illustration.
- `assets/Cui-Yixin-CV.pdf`: resume download.

## Interaction

- Use the cover button, chapter navigation, character hotspots, or previous/next controls.
- Keyboard: Left/Right arrows change pages; Escape closes the resume drawer.
- Touch: swipe horizontally on the book to change pages.
- Sound is off by default and only plays for page turns after the visitor enables it.
