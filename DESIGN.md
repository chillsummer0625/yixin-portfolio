## 2026-10-11 — Equal rectangular open covers (local only)

Both cover boards now share the same rectangular bounds (6–90% height) and mirror opening angles of 2 degrees, producing an almost flat 176-degree spread. Colored leaves retain small distinct fan angles inside that opening. Removed asymmetric trapezoid corners; the whole orbit supplies camera tilt. Illustrated faces have hidden backs so their reverse side does not protrude below the rear cover. Interior background/person/desk depths are unchanged.

## 2026-10-11 — Complete cover artwork and clean top edge (local only)

The complete cover artwork is projected onto the four corners of each hinged board on layout/resize, so lace borders are not cut by the board silhouette. The outside cover top encloses the scene at the spine. The room image mask follows its painted top edge, excluding the black source background. Desktop rear/front tilt and mobile rear views checked; authored interior depth remains unchanged. Build and JS syntax checks passed.

## 2026-10-11 — Restore interior relief (local only)

Removed the shared 0.16 Z compression. Background returns to -100px, people to 30/90/45px, and the foreground desk to 135px; mobile retains the authored -50px, 15/40/20px, and 65px depths. Role targets use the same person depths. The separate hinged paper construction is anchored behind the background instead of compressing the illustrated scene.

## 2026-10-11 — Shared hinged construction (local only)

Front and rear now share ten real colored leaves and two separate cover wings, all hinged at x=50%. Leaves have distinct fan angles, 1.6px edges, and small binding offsets; cover wings follow the same fan and have 6px board edges. The solid rectangular page block is removed. Only the source image's painted outer wings are masked, and real leaves replace them; the illustrated room and base remain. Free rotation exposes the same pages from either side.

## 2026-10-11 — Solid bound page block (local only)

The open room has a closed six-face body: an interior paper face, the existing outer cover, continuous fore-edges and top/bottom page edges, plus a central binding. Desktop thickness is 24–42px; mobile is 16px. Paper rules run across five solid pink, mint, blue, pale-yellow and lavender page bands; both covers meet the side faces. Illustration relief remains compact independently of the book body's thickness.

## 2026-10-11 — Compact room construction (local only)

The full room illustration supplies its original colored wings and paper base. Duplicate CSS leaves and added paper tabs have been removed. All illustration layers and object hit targets share a 0.16 Z scale: desktop wall-to-island separation is now 37.6px instead of 235px. Role crystals use the same scaled depth, and the reverse cover sits 4px behind the wall. This retains free rotation and layered relief while avoiding an exploded stack and blank support sheets.

## 2026-10-11 — Resume reverse cover correction (local only)

Applied the cream rear treatment to the separate Resume closing-book reverse face as well. Removed its lace background and contact rectangle; used cover-relative small italic name, foil flower and underlined email/CV copy. Verified by entering through Resume and rotating that book to its reverse; build passed. The previous change affected only the room reverse cover.

## 2026-10-11 — Plain cream rear cover (local only)

The room's rear cover now follows the supplied reference: uninterrupted cream paper, a small foil flower, centered italic name, and small underlined email/CV copy. Removed the reused lace artwork and rectangular contact panel from this face. Text scales with cover width during rotation and on mobile. Desktop and 390px rear views checked; static build passed. No deployment.

# Design System

## 2026-10-11 — Work skin warmth (local only)

Work uses `chapter-work-warm-skin-v8.png`: a localized warmer ivory/peach skin-color edit to reduce the main character's porcelain-white face, with coordinated neck and hands. The fine-line illustration style and composition are retained. Build passed; no deployment.

## 2026-10-11 — Updated Create scene and finer Work contours (local only)

Create uses the user's updated sunset illustration with the Monthly Echoes turntable, edited only to retain separate tinted outer glass leaves (`chapter-create-solid-glass-v10.png`). Removed the stale desktop-only scene override so desktop and mobile share this image. Work uses `chapter-work-fine-lines-v7.png` with finer contours and softer local shadow colors around the character and props, preserving its composition and solid-tint glass. Original assets are retained. Build and local desktop/mobile previews checked; no deployment.

## 2026-10-11 — Chapter outer glass leaves (local only)

Learn, Work and Create now use sibling `chapter-*-solid-glass-*.png` backgrounds. Each exposed outer leaf has its own translucent pink, mint, blue, yellow or lavender tint, matching the homepage material. The existing chapter layout and navigation remain intact. Local build and desktop/mobile preview checks passed; no deployment.

## 2026-10-11 — Single-color outer glass leaves (local only)

Follow-up: the painted outer stack is clipped away from the wall texture. Four actual tinted leaf planes per wing now hinge at the center with separate depths and fan angles; the rear cover sits behind the last leaf. Each leaf has a single hue, a thin outer edge and a translucent face. This replaces the flat color-band illusion during room rotation.

The wall masks now trace the artwork's actual sloping top silhouette, including the lower center fold, so the source image's black exterior cannot appear as a solid strip in front of the transparent leaves.

The room wall uses `assets/room-background-solid-glass-v15.png`. Exposed side leaves each carry one pink, mint, blue, yellow or violet tint with translucent shading and fine bright edges, replacing the rainbow facets inside each leaf. The existing wall geometry, character and object layers remain in place. Desktop front/rotated views and the 390px mobile layout were visually checked; the static build passed. No deployment.

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

- Display and body share Avenir Next / Helvetica Neue / system sans, as requested; size and weight retain the existing hierarchy.
- Interface and body: Avenir Next / Helvetica Neue / system sans.
- Chinese: PingFang SC throughout headings, body, and controls.
- Body line length: 65-72 characters maximum.

## Layout

- Desktop: one centered book object with a visible spine; the outer website frame is the book, so chapter artwork never draws a second open book inside it.
- Every desktop interior spread carries one restrained center fold below the toolbar: a narrow paper depression, a hairline crease, and asymmetric inner-page light. The fold fades at the page edges, never captures pointer events, and disappears on mobile where the layout becomes a single page.
- Room: full-bleed 16:9 illustration with overlaid semantic hotspots.
- Chapter pages: asymmetric two-column compositions that change with the content rather than repeated cards.
- The Learn chapter is one flat book page that feels physically continuous with the homepage without repeating its object-discovery room. Four directly readable HTML book spines form an abstract learning archive on the left; Student Yixin occupies the sunlit right field. A plum, paper-shadow, and amber diagonal rule separates the two fields without turning either side into a card. The active toolbar label supplies `LEARN`; the accessible page heading remains visually hidden instead of adding a second oversized title.
- The Work chapter is a cross-border dossier rather than a resume grid. One live paper file occupies the left field, and six company tabs expose SUMEC, China Daily, Honey Verse, Sichuan Radio & Television, Chengdu Radio & Television, and China Eastern Airlines. Professional Yixin works in the indigo/coral right field. A cobalt paper-edge diagonal separates the fields without copying Learn's book-spine interaction. The accessible page heading is visually hidden; the company name leads every active file.
- Mobile: the book becomes a single vertical page. Buttons, keyboard-equivalent navigation, and horizontal touch swipes remain direct, but chapter changes use a short directional crossfade instead of forcing the desktop 3D leaf into a narrow viewport.

## Components

- The illustrated room is the public first page; the book cover remains a reusable opening scene for a later full-book sequence.
- Persistent book toolbar: name, Learn / Work / Create, language, sound, Resume.
- Character hotspots with visible focus states.
- Semantic object hotspots: the Crete and NUAA shelf pieces, burgundy HKU crest artwork, illustrated campus involvement group portrait, medals, SUMEC catalogue, China Daily paper, broadcast headphones, China Eastern announcement notebook, Creator collage, and HKU Compass screen are separate accessible destinations. Every evidence-bearing object, including Collage, first opens the same concise bilingual detail dialog containing only identity, timeframe or context, concrete evidence, and an action; explanatory object-summary prose is deliberately omitted. Crete covers Academic Experience, the campus group portrait covers Campus Involvement, Collage continues to the Create chapter, and HKU Compass opens a project window before the verified live site.
- Page-turn controls and keyboard/touch navigation.
- Learn archive layout: Educational Background, Academic Experience, Campus Involvement, and Awards & Certificates are visible together as four semantic HTML book buttons on one continuous shelf. The cel-shaded lavender, burgundy, indigo, and ivory spines share the same amber rules and small four-diamond ornament. They deliberately avoid leather grain and photorealistic volume. Selecting a spine turns the left surface into a scan-friendly detail page while the portrait remains anchored on the right.
- Work archive layout: six semantic ARIA tabs control six company-specific dossier panels. Every panel presents company, role, right-aligned date, a task chain, handled work, moved outcomes, and evidence links. Sichuan Radio & Television, Chengdu Radio & Television, and China Eastern Airlines remain separate companies rather than being grouped under a generic Broadcast category. Public evidence links target an irreversible rasterized PDF with identifiers and scan QR codes removed; Honey Verse links directly to its bilingual internship certificate on page 5.
- Resume drawer with scan-friendly facts and a PDF download.
- Contact page with one clear email CTA.

## Motion and Sound

- Desktop navigation into or out of the illustrated room turns the complete book construction through a temporary 3D hinge at the spine. The room's current drag orientation remains nested inside the hinge, so its figures, walls, base, and spectral edges travel together. A 250ms inward turn passes into a 400ms opening with a restrained settle. The room is excluded from both rectangular leaf engines; Learn's backward swipe uses the same whole-volume return. Mobile keeps its directional crossfade, and reduced-motion navigation lands immediately.

- The book enters with a restrained pitched 3D reveal, then responds to fine-pointer movement with no more than roughly two degrees of tilt. The approach borrows the physical spine, perspective, and moving-shadow principles of an interactive picture book without reproducing its visual content.
- Desktop page turns use the vendored MIT-licensed StPageFlip 2.0.7 geometry engine as a temporary, inert visual layer. Pressing and holding a non-interactive area gently lifts the sheet after about 90ms; the fold then follows the captured pointer continuously until release. A committed drag settles across the spine, an incomplete drag falls back, and a plain click does not latch the page to the cursor. Button and keyboard turns run for about 620ms and never overlap. The portfolio's own HTML remains the canonical interactive layer; the older native turn stays available as a loading fallback.
- The desktop turning leaf keeps the live outgoing half on its front and the destination half on its back. The bottom spread remains the outgoing page until the leaf reaches roughly 90 degrees, then changes to the target page while the edge is thinnest. A stationary outgoing half, a moving angle-driven shadow, restrained paper lift, and a narrow traveling curl highlight preserve continuity. Thin stacked-paper bands remain visible along the right and bottom book edges without copying the reference component's split-flap geometry.
- Chapter templates are prepared during browser idle time, cloned rather than reparsed when a turn begins, and reused at the end of a committed turn. During motion, the large paper layers change only compositor-friendly transforms and opacity; full-page shadow gradients are not repainted every frame.
- Direct chapter navigation may imply several pages turning quickly, but never blocks the destination for more than 650ms.
- The Student-to-Learn transition uses the shared book page turn and lands directly on the four-book index. The books arrive with one restrained stagger; hover/focus pulls one spine upward by less than 8px, and selection holds that pulled state while the detail paper is revealed. A narrow sheen travels along the diagonal divider and the portrait's window light breathes at very low amplitude. Closing reverses the paper reveal and restores focus to the originating book. Reduced-motion mode removes the stagger, sheen, light loop, and spatial pull.
- Work tab changes use a short paper-slide reveal, a low-amplitude divider sheen, and a breathing coral window glow. Arrow keys, Home, and End move between tabs while keeping focus in the tab list. Reduced-motion mode removes all spatial movement, the sheen, and the light loop.
- Hover and focus movement stays under 8px and communicates clickability; object dots and character chapter labels lift as one system.
- The room uses low-amplitude ambient loops for sunlight and dust. Do not paste independently generated hands, arms, or heads over the room: if a properly separated whole-character rig is unavailable, preserve the original character pose rather than introducing a disconnected joint. Future character motion must use matched whole-character or authored keyframe artwork.
- Object hover is drawn from the artwork itself: a softly feathered clean-plate silhouette replaces only the stationary prop while an alpha-masked copy of the original prop rises a few pixels with a fine contour. Hotspot geometry stays invisible; only the object and its plain text label move. Never use rectangular or polygon-clipped copies of the full scene; those seams visibly split faces, bodies, and furniture.
- `prefers-reduced-motion` resolves turns instantly while keeping keyboard and button navigation intact.
- Sound is opt-in and uses the same bundled local WAV files on desktop and mobile so browser audio-engine differences cannot change the result: quiet tonal touches acknowledge object hover/focus, a soft tactile note confirms selection, and paper swishes accompany opening a detail page or turning into a chapter. There is no background music.

## Imagery

The chapter scenes use `assets/chapter-learn-topfill-v3.png`, `assets/chapter-work-cover-view-v5-crisp.png`, and `assets/chapter-create-cover-view-v5-crisp.png`, matched to the current homepage figures and clean golden-hour room. HKU wall art uses a green field with a full-color shield only in the learning area. Work and Create exclude the learning-area crest; their scenes derive from the cover room and add no substitute artwork. Desktop uses the full spread; mobile crops the right-hand scene from the same asset through `--chapter-scene`, so generated navigation or content is never shown as a raster image. Real chapter content remains HTML. The obsolete illustrated header flap is removed from all chapter scenes and the homepage backdrop (`room-background-topfill-v14.png`); paper and scenery continue to the upper silhouette beneath the external navigation.

The homepage uses `assets/homepage-room-v12.png`, a precise-object revision of the luminous v11 composition. Its rendering language remains contemporary 2D animation: selective tapered plum contours, mature elongated facial design, simplified glossy hair masses, clean cel-shadow planes with restrained soft edge bloom, and sparse chromatic offsets. The restricted palette is led by coral/apricot light and saturated aubergine/indigo shadow, with pale blue reserved for screens and papers. Crete occupies the shelf immediately left of NUAA; the burgundy crest artwork with large `HKU` lettering behind Student is the HKU entry point, while the former purple HKU book has been replaced by tightly arranged aubergine and indigo book spines so the shelf remains full; the former open book beside it is now a loose six-person Campus Involvement snapshot with adult proportions, fashion-illustration faces, and saturated coral/teal/mustard color blocking rather than a realistic class photo or cute promotional group; all three character versions have bare ears; Professional uses one correctly oriented laptop whose plain lid faces the viewer; and the foreground differentiates one SUMEC clothing and textile catalogue from separate China Eastern announcement-training notes. Evidence is grouped into Student, Professional, and Creator clusters so the first read is one cinematic scene and the second read reveals the CV. The room continues through the upper-left behind the HTML introduction, and a chromatic low-opacity vignette preserves copy contrast without a black block. Important destinations and click targets remain HTML so they are localizable and accessible. Earlier room images remain as non-destructive visual-history assets. The Create chapter follows the same light archive-page structure as Learn and Work: the pale rose studio groups Content Creating and Vibe Coding into equal-format archive indexes on the left, keeps all four selected real collage thumbnails visible below them, and reserves the sunset field on the right exclusively for `assets/create-portrait-v2.png`. The Content Creating heading itself links to the Xiaohongshu profile and sits above the verified creator metrics. The adjacent Vibe Coding index uses the real HKU Compass preview as a clickable project thumbnail; its title opens the live site, while the practical guide remains a secondary link. External destinations remain live HTML and are never baked into the illustration.

The Creator homepage hint uses `Creative tech` / `创意技术` rather than `Digital projects` or `Vibe coding`: it names a durable field of output that includes HKU Compass and AI-assisted making, while `Vibe coding` remains the title and method of the specific humanities-student guide.

The Learn chapter follows the approved `assets/learn-book-page-concept-v12-balanced-books.png` direction. The clean production crop is `assets/learn-portrait-v13-balanced.webp`; it preserves the mature low twin ponytails, curtain bangs, bare ears, plum contours, glossy black hair, and coral/apricot window light while removing the concept image's toolbar and left-side book artwork. The four books, shelf, heading, diagonal divider, bilingual navigation, section titles, preview copy, and detail evidence are live HTML/CSS rather than rasterized text, so they remain responsive, localizable, and keyboard accessible. No maps, certificates, medals, or additional room props appear on the page.

The Work chapter uses `assets/work-professional-v2-balanced.webp`, a clean vertical production illustration derived from the approved Work composition while preserving the Learn portrait's softer cel-shaded editorial finish and the homepage character identity. Professional Yixin has straight long black hair with curtain bangs, an indigo blazer, a laptop, and restrained fabric/editorial/broadcast desk cues. All folder tabs, dossier papers, task flows, labels, dates, buttons, and evidence links are live HTML/CSS; none are rasterized into the portrait.

## Content Rules

- Only use metrics present in the supplied CV or verified source files.
- Do not expose raw certificate scans or identity numbers publicly. Evidence files must be flattened public copies with private fields and source metadata removed.
- Do not place logos in the room; use meaningful objects.
- Phone number stays off the public page; email is the primary contact.

## 2026-10-11 — Rotatable book entry

The square cover now uses a six-face CSS 3D volume with a sharp, orthographic front texture, an ivory back cover, a named spine, and paper edges. Pointer drag rotates continuously through 360 degrees; vertical drag tilts within 24 degrees. Arrow keys rotate and Enter opens the room. A drag is distinguished from a click so releasing a rotation does not navigate.

The entry has a black background with a much quieter warm light projection. Both entry and room motion run by default without Motion or pause buttons; system reduced-motion preferences and background/offscreen pauses remain.

Validation: syntax checks, static build, desktop drag past the back cover, a further 360-degree keyboard turn, Enter navigation, and 390 × 844 viewport drag with no horizontal overflow. The room mounts without console errors and has no motion-toggle controls.

## 2026-10-11 — Slightly open book and contact back cover

The front cover hinges open by 24 degrees, with four separately hinged ivory, muted green and blush inner sheets. Their depth is derived from the responsive book thickness to prevent sheets covering the front on mobile. The black entry and continuous rotation remain.

The back cover now contains the existing HKU email and a direct link to the existing public PDF CV. These are real accessible anchors, not raster text. Only the facing side is interactive; pointer dragging suppresses navigation, while clicking a back link leaves rotation alone. The front is a separate open button inside the rotatable group.

Opening unfolds the cover and sheets before entering the room. The header includes an accessible close-book control that folds the current page away while the small book closes into its resting pose. System reduced-motion uses an immediate change.

Validation: syntax/static build; desktop intermediate frames of both unfolding and closing; return overlay cleanup; mobile Enter/open/close and drag to back without navigation or overflow; direct CV navigation to the PDF; email mailto readback; no console errors.

## 2026-10-11 — Repair detached fore-edge

Side rotation exposed a geometry error: the rigid fore-edge and bottom of the previous closed box remained in place while the inner sheets fanned outward. Removed these stationary box faces. Each sheet is now a two-sided, 2px thick volume with attached top, bottom and fore-edge faces under the same hinge transform. Added clearance between the foremost sheet and cover. Email, CV links, rotation and opening/closing behavior are retained.

Validation: syntax/static build, staged-only export, and runtime asset readback. Browser verification is recorded separately from build checks.

## 2026-10-11 — Book spring flip

Adapted the React Bits Flip Card interaction concept to the existing hinged book using a native damped spring: click, horizontal drag and release velocity turn the complete volume and settle to front/back poses. Pointer tilt and a restrained paper sheen follow the cursor; a ground shadow narrows as the book turns edge-on. The ivory cover, named spine, slightly open sheets, black background and warm ambient light are retained. Click flips; a separate understated entry below the book opens the portfolio. Enter opens, arrows/Space flip. Back-cover contact links remain native anchors and do not start a drag. Reduced-motion uses immediate settling, and the spring is canceled on unmount.

## 2026-10-11 — Recorded book choreography and prismatic glow

The supplied 12.6-second recording shows a rotating physical book, a fan opening, a short page flutter, then a closing pose. The entry now repeats a 12-second version of that sequence using the existing cover and individually hinged sheets. Opening changes the viewing angle and scale to keep the whole fan in frame. Pointer/keyboard interaction hands control to the visitor; the back links and portfolio entry remain. Reduced-motion disables the automatic sequence. Hidden/offscreen time does not advance the sequence.

The user's follow-up asks for seven-color light emitted by their book. Added a soft prismatic aura behind the book, colored rim highlights on covers and sheet edges, and stronger light during the fan pose. The ivory face texture and black stage remain.

## 2026-10-11 — Direct entry and free book positioning

Removed the text entry beneath the book. The actual front cover opens the room; back email/CV anchors remain independent. Horizontal and vertical pointer movement control yaw and pitch continuously, and the release keeps the exact pose instead of snapping front/back. Arrow keys move each axis by 15 degrees; Enter/Space opens. Pitch extends through horizontal poses. User interaction stops the automatic showcase.

Paper faces now use distinct pink, turquoise, gold and violet light, with a full rainbow on the thin sheet edges and spine. The front face remains ivory. Desktop Student moves to the floor at bottom left; Creator moves upward over the right figure's trousers. Mobile retains the separate stacked chapter links.

## 2026-10-11 — Restore object click lift

The old object sprites are absent from the updated room artwork, and L’Oréal/KOL/link routes bypassed the activation delay. Object activation now consistently plays a 380ms lift before a dialog, Work case or external navigation. The single-texture room shader displaces the selected image region upward and back with feathered boundaries, so the actual pictured object moves instead of only its invisible hotspot. Existing hover selection supplies a smaller lift. System reduced motion opens immediately. Modified external-link clicks keep native browser behavior.

## 2026-10-11 — Black stage and click to recall

Removed the window-light canvas, dust, broad rainbow aura and ground glow. Only the book's colored rims and page edges emit light against a pure black stage. The entrance plays once and holds the distant fan pose. Clicking recalls the book smoothly; a subsequent front-cover click enters the portfolio. Dragging preserves distance and pose, while back-cover anchors remain independent. Hidden/offscreen time pauses the sequence; reduced motion presents the near pose immediately.

## 2026-10-11 — Capped book geometry and reversible distance

Cover boards now have their own four thickness faces; the binding has inner and end-cap faces. Binding and thin edge materials remain visible from either side, and page hinges align at the binding. This removes missing surfaces at low and rear viewing angles without restoring detached fixed fore-edges. Empty black-stage clicks retreat the book; distant-book clicks recall it. Both transitions interpolate from the current pose and ignore repeated activation until finished.

## 2026-10-11 — Any book surface opens contents (local only)

After recall, front/back boards, spine, binding caps and sheets all route through the same content-entry animation. Drag releases still suppress navigation; empty black-stage clicks retreat. Email and CV anchors retain their specific destinations. Per user request, this change remains local until the remaining edits are approved for a combined deployment.

## 2026-10-11 — Restore spectral atmosphere and center suspended book (local only)

Restored the seven-color aura on the black stage without the former warm window light. Removed the distance-based left offset. The visible cover/page bounds now determine centering after rotation and fanning, including resize; the unrotated square's hinge no longer biases the resting position. Opacity-only entrance avoids overriding the centering transform. Changes remain local per the user's batching preference.

## 2026-10-11 — Spectral contact typography (local only)

Email and CV links on the back cover now use deeper rainbow ink and a restrained pink/cyan text glow, with a stronger hover/focus glow. Removed the CV arrow and bottom rule. Shared styling applies on desktop and mobile, with a 13px email minimum; mailto and PDF destinations are unchanged. Not published.

## 2026-10-11 — New cover statement (local only)

Replaced the printed tagline with live cover text: “I'm a student, a professional, and a creator.” A blank strip from the original paper texture covers the baked-in old line, preserving the original cover image and allowing future copy changes without regenerating it. Updated the accessible image description. Not published.

## 2026-10-11 — Return without folding the stage (local only)

Cover entry is now excluded from the full-page flip engine, including desktop drag and mobile swipe routes. Return fades the room and animates only the physical book's hinged cover/sheets on the stationary black/spectral stage. It settles in the near pose without restarting the entrance showcase. Removed the cloned full-screen return sheet responsible for folding the background.

## 2026-10-11 — Restore spectral floor reflection (local only)

Restored the low elliptical rainbow projection beneath the floating book. It sits on the stationary stage, follows the visible book's lower edge and width during near/far travel, and never rotates with the pages. Background aura remains. Not published.

## 2026-10-11 — English cover and black underlined links (local only)

Back-cover CV label is always “Read My CV”, including when the portfolio language is Chinese. Email and CV use black text with a clear underline; removed spectral text fills and glow. The cover statement and back-cover name/mark also use black ink. Mailto/PDF destinations, surrounding aura and floor reflection remain. Not published.

## 2026-10-11 — Approved A pop-up room (local only)

User selected the translucent pop-up book concept. Replaced the sunset room with a crisp ivory book diorama, translucent folded walls and rainbow edge light; cleaned all baked-in navigation, chapter headings and invented slogans from the generated artwork. Existing toolbar markup/order and routes are preserved. Desktop chapter labels sit above the three figures; mobile shows the uncropped scene followed by three accessible chapter entries. Remapped the object hit areas and seamless reach/typing/cutting animation regions, retaining object hover/click lift and reduced-motion fallback. Cover/contact edits remain intact. No deployment.

Validation: source syntax and static build passed. Local desktop and 390px mobile rendering checked; no horizontal overflow, WebGL room motion ready, L’Oréal object opened the correct Work dossier and home navigation returned. Concept is an illustrated diorama with subtle motion, not a freely orbitable 3D room mesh.

Chapter content starts at 7% of the desktop spread beneath the external toolbar. Work files use compact typographic spacing and wrapped company tabs; all seven entries retain full text and evidence links without a nested scrolling panel at standard desktop sizes. Mobile Work starts directly with the active dossier beneath navigation to prioritize complete entries while retaining readable body text and natural page scrolling on shorter screens. The Halloween project remains in Create, and its pumpkin bottle is restored as a separate clickable homepage object on the desk beside the Monthly Echoes record player.

Homepage spread sizing shares the chapter viewport width budget (7rem reserved for controls), with desktop orbit scale .89 and mobile .94. This brings the opened homepage book closer to chapter size while preserving all scene layers and hotspot transforms.

The Student, Professional and Creator crystal reveals share an ivory paper label with a fine warm border and brown serif text in the main stylesheet, including mobile and reduced-motion styling. On phones labels sit beside the crystals to clear the navigation above. Previews inherit this production stylesheet rather than adding a separate label experiment.

## 2026-10-11 — Printed chapter perspective and fitted dossiers (local only)

Desktop Learn, Work and Create content follows the illustrated left leaf with a shared 4.8-degree vertical shear. Insets leave clearance at the center fold and lower paper edge. Learn details use smaller type and compact spacing; the 19-item awards archive has two selectable pages with every original certificate link retained. Work measures each active dossier and adjusts its type scale to the available page height, enlarging shorter entries such as L’Oréal. Resize, language changes and case selection recompute the fit; mobile retains natural page flow. Create's gallery and project objects stay within the left page, with complete thumbnail images and wrapped project labels.

Validation: JavaScript syntax and static build passed. At 1440×900, all seven English work dossiers fit without scrolling; education, academic and campus details fit one page, and both awards pages fit. Chinese layout and 390px mobile flow were checked; mobile Work/Create have no horizontal overflow. Chapter navigation and return to the cover were exercised. No production deployment.

## 2026-10-11 — Restore Work illustration on narrow screens (local only)

Restored the Work chapter illustration above the professional archive at widths up to 820px. The earlier mobile rule hid this figure, leaving only the dossier visible. Desktop perspective and adaptive dossier type remain intact.

Archive heading hierarchy is shared by Learn, Work and Create: 2.8cqw on desktop and 28px on mobile, with the same 9cqw (88px mobile) spectrum underline. Company names use the subordinate 2.05cqw / 23px tier and do not expand with dossier body fitting.

## 2026-10-11 — Soft spectrum paper, without refraction (local only)

Removed the diagonal refraction bands after user review. Mobile keeps its original soft rainbow paper treatment. Desktop chapter leaves and Learn detail pages use only gentle spectral color washes inside the printed page boundary.

### Closing cover volume

The cream closing page uses a separate desktop 3D cover, rear board, rounded spine and striped paper edges. Live copy and contact actions stay on the front face. Dragging the non-interactive cover rotates the solid volume; double-click or Home restores the readable pose, and Shift + arrow keys rotate it from keyboard focus. Its multicolor floor projection remains on the black stage. Mobile keeps the vertical cream artwork and readable live actions, with touch scrolling. `closing-book.js` mounts and disposes with the existing page renderer.

The closing volume's reverse now reuses the entry's unfolded cover: contact back panel, central spine and portfolio front cover. A deeper paper block, separate board rims, spine highlights, inset paper shadows and angle-dependent front lighting make the volume readable during rotation. Drag, keyboard reset, resume opening, cover return and mobile overflow checks passed locally.

### Resume boundary and light spectrum leaves

The closing page now has a thinner, translucent spectrum edge with fine separated bands rather than a dense striped paper block. Desktop entry to and return from Resume uses a separate 520ms object transition: the outgoing chapter recedes before the closing volume settles into its own pose. The black stage is not a turning sheet. Learn/Work/Create continue to use the original page-flip engine. The final Create drag routes to this boundary transition; mobile retains its existing directional crossfade and reduced motion resolves directly. Desktop shortcut, previous control, boundary drag, chapter flip, resume drawer, mobile overflow and reduced-motion checks passed. Local only.

## 2026-10-11 — CV spectrum paper (local only)

The resume drawer now carries the chapter leaves' soft lavender, blue, mint, yellow and rose paper washes, with a spectrum paper edge and short rainbow rule under the eyebrow. Text uses dark neutral ink and the PDF action shares the subtle spectrum finish. The close button stays reachable when scrolling; the entrance animation releases its transform after opening so viewport-fixed controls remain anchored. Desktop and 390px mobile reading, Chinese/English content, bottom scrolling and closing were checked locally. No production deployment.

### Air between the closing book leaves

The closing volume now uses four actual translucent leaf planes, hinged at the same left spine with separate offsets and angles matching the entry book's fan. The front cover opens by 24 degrees; the unfolded cover remains on the reverse. Colored hairline edges carry the light, and side/top/bottom solid blocks are removed. Rotation is centered using the projected cover and leaf bounds. Mobile retains the readable vertical cover. The Resume transition, drawer, rotation/reset and mobile overflow were checked; this remains local.

### Typography-only Resume spread

The latest direction replaces the cream ornamental front cover with a typography-only interior spread. The left field carries a large sans-serif next-chapter heading; the right field contains the existing introduction, italic invitation and email/resume actions. A narrow paper fold and short spectrum rule echo Work/Create without a character illustration. The generated scene was not integrated. The reverse still carries the name cover, and the translucent hinged leaf fan remains. Mobile stacks the live text on one paper page. English, Simplified Chinese and Traditional Chinese layout, resume drawer, Resume transition and cover return were checked locally.

### Center-bound closing spread

The closing book now has independent left and right wings hinged at the central fold, each with four translucent pink, mint, yellow and violet leaves using the entry book's original leaf fill. The outer cover wraps behind each fan so the name cover stays visible from the reverse. Soft spectrum paper washes, dark spectral headline ink and larger right-page text replace the flat cream treatment. The Resume boundary opens and folds the two wings independently; internal chapter flips retain their existing behavior. Link hover changes ink without moving the hit target within the 3D plane. Desktop front/side/reverse, Create return and Resume entry, drawer actions, three language layouts and 390px mobile were checked. Build and syntax checks passed. Local only.

The outer cover's hinge and its artwork orientation are now separate transforms. The cover sits beyond the last colored leaf, with an opaque white inner face and smaller interior leaves; rotating it no longer swings the cover through the opposite wing or exposes colored layers over its printed outside.

Rotation now caches local book corners on mount and layout resize, projects them mathematically for camera fitting, and coalesces pointer updates with requestAnimationFrame. Dragging no longer alternates transform writes with synchronous DOM measurements. A 100-move desktop drag dropped closing-page bounding-box reads from 2,475 to zero; both runs remained near 16.8ms at the 95th frame percentile on the local test machine. Front/side/reverse composition, drawer, Create return, Resume entry and mobile language layouts were rechecked locally.

### Quiet Work archive tabs

Company tabs no longer play hover or focus tones. A changed selection plays the existing short 150ms cue at one fixed pitch and one-third of its previous volume. Clicking the active tab is silent. A dedicated playback channel fades out the previous cue over 8ms during rapid switching, including the media-to-buffered startup handoff. Hover silence, mouse and keyboard selection, repeated-selection silence, rapid replacement, Sound off and mobile tab switching were checked locally; build passed.
