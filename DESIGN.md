# Design System

## Concept

An interactive illustrated book titled **Different Sides of Me**. The closed cover opens into a wide cinematic room, then turns into three distinct editorial chapter treatments: an annotated study notebook, a working archive, and a collage table. The visual reference is a sunlit graphic-novel scene, not a vintage scrapbook or a generic magazine layout.

## Brand Voice

- Cinematic: deep shadows, radiant late-afternoon light, confident pacing.
- Curious: layered details and optional discoveries reward attention.
- Worldly: international work and study are present without flag-icon shorthand.

## Color

Use OKLCH tokens only.

- Background: `oklch(0.10 0 0)` - a neutral black stage around the book.
- Page: `oklch(0.98 0.006 8)` - near-white pulled subtly toward the rose anchor.
- Ink: `oklch(0.18 0.025 8)`.
- Muted ink: `oklch(0.43 0.025 8)`.
- Primary rose: `oklch(0.55 0.20 3.4)`.
- Amber: `oklch(0.72 0.15 72)`.
- Cobalt: `oklch(0.48 0.17 260)`.
- Teal: `oklch(0.53 0.10 170)`.

Strategy: full palette. Rose identifies the book as one system; amber belongs to Learn, cobalt to Work, and teal/coral combinations to Create.

## Typography

- Display: Baskerville / Georgia fallback. It feels like a well-used literary book rather than a fashion-magazine affectation.
- Interface and body: Avenir Next / Helvetica Neue / system sans.
- Chinese: Songti SC for large chapter titles; PingFang SC for body and controls.
- Body line length: 65-72 characters maximum.

## Layout

- Desktop: one centered book object with a visible spine; the outer website frame is the book, so chapter artwork never draws a second open book inside it.
- Room: full-bleed 16:9 illustration with overlaid semantic hotspots.
- Chapter pages: asymmetric two-column compositions that change with the content rather than repeated cards.
- The Learn chapter is one flat book page that feels physically continuous with the homepage without repeating its object-discovery room. Four directly readable HTML book spines form an abstract learning archive on the left; Student Yixin occupies the sunlit right field. A plum, paper-shadow, and amber diagonal rule separates the two fields without turning either side into a card. The active toolbar label supplies `LEARN`; the accessible page heading remains visually hidden instead of adding a second oversized title.
- The Work chapter is a cross-border dossier rather than a resume grid. One live paper file occupies the left field, and six company tabs expose SUMEC, China Daily, Honey Verse, Sichuan Radio & Television, Chengdu Radio & Television, and China Eastern Airlines. Professional Yixin works in the indigo/coral right field. A cobalt paper-edge diagonal separates the fields without copying Learn's book-spine interaction. The accessible page heading is visually hidden; the company name leads every active file.
- Mobile: the book becomes a single vertical page; navigation remains direct and page turns become restrained crossfades.

## Components

- The illustrated room is the public first page; the book cover remains a reusable opening scene for a later full-book sequence.
- Persistent book toolbar: name, Learn / Work / Create, language, sound, Resume.
- Character hotspots with visible focus states.
- Semantic object hotspots: the Crete and NUAA shelf pieces, burgundy HKU crest artwork, illustrated campus involvement group portrait, medals, SUMEC catalogue, China Daily paper, broadcast headphones, China Eastern announcement notebook, Creator collage, and HKU Compass screen are separate accessible destinations. Every evidence-bearing object, including Collage, first opens the same concise bilingual detail dialog containing only identity, timeframe or context, concrete evidence, and an action; explanatory object-summary prose is deliberately omitted. Crete covers Academic Experience, the campus group portrait covers Campus Involvement, Collage continues to the Create chapter, and HKU Compass opens a project window before the verified live site.
- Page-turn controls and keyboard/touch navigation.
- Learn archive layout: Educational Background, Academic Experience, Campus Involvement, and Awards & Certificates are visible together as four semantic HTML book buttons on one continuous shelf. The cel-shaded lavender, burgundy, indigo, and ivory spines share the same cobalt dot, amber rules, and small four-diamond ornament. They deliberately avoid leather grain and photorealistic volume. Selecting a spine turns the left surface into a scan-friendly detail page while the portrait remains anchored on the right.
- Work archive layout: six semantic ARIA tabs control six company-specific dossier panels. Every panel presents company, role, right-aligned date, a task chain, handled work, moved outcomes, and evidence links. Sichuan Radio & Television, Chengdu Radio & Television, and China Eastern Airlines remain separate companies rather than being grouped under a generic Broadcast category. Public evidence links target an irreversible rasterized PDF with identifiers and scan QR codes removed; Honey Verse links directly to its bilingual internship certificate on page 5.
- Resume drawer with scan-friendly facts and a PDF download.
- Contact page with one clear email CTA.

## Motion and Sound

- The book enters with a restrained pitched 3D reveal, then responds to fine-pointer movement with no more than roughly two degrees of tilt. The approach borrows the physical spine, perspective, and moving-shadow principles of an interactive picture book without reproducing its visual content.
- Page turns use 3D perspective around the inner spine, a moving paper shadow, and an exponential ease-out.
- Direct chapter navigation may imply several pages turning quickly, but never blocks the destination for more than 650ms.
- The Student-to-Learn transition uses the shared book page turn and lands directly on the four-book index. The books arrive with one restrained stagger; hover/focus pulls one spine upward by less than 8px, and selection holds that pulled state while the detail paper is revealed. A narrow sheen travels along the diagonal divider and the portrait's window light breathes at very low amplitude. Closing reverses the paper reveal and restores focus to the originating book. Reduced-motion mode removes the stagger, sheen, light loop, and spatial pull.
- Work tab changes use a short paper-slide reveal, a low-amplitude divider sheen, and a breathing coral window glow. Arrow keys, Home, and End move between tabs while keeping focus in the tab list. Reduced-motion mode removes all spatial movement, the sheen, and the light loop.
- Hover and focus movement stays under 8px and communicates clickability; object dots and character chapter labels lift as one system.
- The room uses low-amplitude ambient loops for sunlight and dust. Do not paste independently generated hands, arms, or heads over the room: if a properly separated whole-character rig is unavailable, preserve the original character pose rather than introducing a disconnected joint. Future character motion must use matched whole-character or authored keyframe artwork.
- Object hover is drawn from the artwork itself: a softly feathered clean-plate silhouette replaces only the stationary prop while an alpha-masked copy of the original prop rises a few pixels with a fine contour. Hotspot geometry stays invisible; only the object and its plain text label move. Never use rectangular or polygon-clipped copies of the full scene; those seams visibly split faces, bodies, and furniture.
- `prefers-reduced-motion` replaces turns with instant or short crossfades.
- Sound is opt-in and uses the same bundled local WAV files on desktop and mobile so browser audio-engine differences cannot change the result: quiet tonal touches acknowledge object hover/focus, a soft tactile note confirms selection, and paper swishes accompany opening a detail page or turning into a chapter. There is no background music.

## Imagery

The homepage uses `assets/homepage-room-v12.png`, a precise-object revision of the luminous v11 composition. Its rendering language remains contemporary 2D animation: selective tapered plum contours, mature elongated facial design, simplified glossy hair masses, clean cel-shadow planes with restrained soft edge bloom, and sparse chromatic offsets. The restricted palette is led by coral/apricot light and saturated aubergine/indigo shadow, with pale blue reserved for screens and papers. Crete occupies the shelf immediately left of NUAA; the burgundy crest artwork with large `HKU` lettering behind Student is the HKU entry point, while the former purple HKU book has been replaced by tightly arranged aubergine and indigo book spines so the shelf remains full; the former open book beside it is now a loose six-person Campus Involvement snapshot with adult proportions, fashion-illustration faces, and saturated coral/teal/mustard color blocking rather than a realistic class photo or cute promotional group; all three character versions have bare ears; Professional uses one correctly oriented laptop whose plain lid faces the viewer; and the foreground differentiates one SUMEC clothing and textile catalogue from separate China Eastern announcement-training notes. Evidence is grouped into Student, Professional, and Creator clusters so the first read is one cinematic scene and the second read reveals the CV. The room continues through the upper-left behind the HTML introduction, and a chromatic low-opacity vignette preserves copy contrast without a black block. Important destinations and click targets remain HTML so they are localizable and accessible. Earlier room images remain as non-destructive visual-history assets. The Create chapter follows the same light archive-page structure as Learn and Work: the pale rose studio groups Content Creating and Vibe Coding into equal-format archive indexes on the left, keeps all four selected real collage thumbnails visible below them, and reserves the sunset field on the right exclusively for `assets/create-portrait-v1.png`. The Content Creating heading itself links to the Xiaohongshu profile and sits above the verified creator metrics. The adjacent Vibe Coding index uses the real HKU Compass preview as a clickable project thumbnail; its title opens the live site, while the practical guide remains a secondary link. External destinations remain live HTML and are never baked into the illustration.

The Creator homepage hint uses `Creative tech` / `创意技术` rather than `Digital projects` or `Vibe coding`: it names a durable field of output that includes HKU Compass and AI-assisted making, while `Vibe coding` remains the title and method of the specific humanities-student guide.

The Learn chapter follows the approved `assets/learn-book-page-concept-v12-balanced-books.png` direction. The clean production crop is `assets/learn-portrait-v12-sunlit.webp`; it preserves the mature low twin ponytails, curtain bangs, bare ears, plum contours, glossy black hair, and coral/apricot window light while removing the concept image's toolbar and left-side book artwork. The four books, shelf, heading, diagonal divider, bilingual navigation, section titles, preview copy, and detail evidence are live HTML/CSS rather than rasterized text, so they remain responsive, localizable, and keyboard accessible. No maps, certificates, medals, or additional room props appear on the page.

The Work chapter uses `assets/work-professional-v1.webp`, a clean vertical production illustration derived from the approved Work composition while preserving the Learn portrait's softer cel-shaded editorial finish and the homepage character identity. Professional Yixin has straight long black hair with curtain bangs, an indigo blazer, a laptop, and restrained fabric/editorial/broadcast desk cues. All folder tabs, dossier papers, task flows, labels, dates, buttons, and evidence links are live HTML/CSS; none are rasterized into the portrait.

## Content Rules

- Only use metrics present in the supplied CV or verified source files.
- Do not expose certificate scans or identity numbers publicly.
- Do not place logos in the room; use meaningful objects.
- Phone number stays off the public page; email is the primary contact.
