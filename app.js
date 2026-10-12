(() => {
  const data = window.SITE_DATA;
  const book = document.querySelector("#book");
  const bookStage = document.querySelector(".book-stage");
  const bookContent = document.querySelector("#book-content");
  const stationaryPage = document.querySelector(".page-turn-stationary");
  const stationarySnapshot = stationaryPage.querySelector(".page-turn__snapshot");
  const pageTurns = {
    next: document.querySelector(".page-turn--next"),
    prev: document.querySelector(".page-turn--prev")
  };
  const readerControls = document.querySelector("#reader-controls");
  const prevButton = document.querySelector("#prev-page");
  const nextButton = document.querySelector("#next-page");
  const pageStatus = document.querySelector("#page-status");
  const drawer = document.querySelector("#resume-drawer");
  const resumeContent = document.querySelector("#resume-content");
  const drawerClose = document.querySelector("#drawer-close");

  const pageKeys = ["cover", "room", "learn", "work", "create", "closing"];
  // The state belongs to this browser-history entry, so Back restores the
  // reader while a newly opened portfolio still starts at its cover.
  const returnState = history.state?.portfolioReader;
  const validReturnState = returnState?.version === 1 && pageKeys.includes(returnState.page);
  const supportedLanguages = ["zh", "zh-Hant", "en"];
  const savedLanguage = localStorage.getItem("yixin-language");
  let language = validReturnState && supportedLanguages.includes(returnState.language)
    ? returnState.language : supportedLanguages.includes(savedLanguage) ? savedLanguage : "en";
  let currentPage = validReturnState ? pageKeys.indexOf(returnState.page) : 0;
  let activeWorkCase = validReturnState && typeof returnState.workCase === "string"
    ? returnState.workCase : "loreal";
  let soundEnabled = true;
  let isTurning = false;
  let roleNavigationTimer = 0;
  let turnState = null;
  let libraryTurnState = null;
  let mobileSwipeState = null;
  let coverReturnGesture = null;
  let closingGesture = null;
  let roomReturnGesture = null;
  let turnAnimationFrame = 0;
  let turnRenderFrame = 0;
  let perspectiveFrame = 0;
  let lastObjectHoverAt = 0;
  let lastObjectHoverKey = "";
  const soundFiles = {
    crystal: "assets/crystal-reveal.wav",
    hover: "assets/object-hover.wav?v=20260822b",
    select: "assets/object-select.wav?v=20260822b",
    page: "assets/page-turn.wav"
  };
  const soundGain = 1.6;
  const soundTypeGain = {
    crystal: 0.8,
    hover: 1.55,
    select: 1.35,
    page: 1
  };
  const soundTemplates = new Map();
  const soundBuffers = new Map();
  const soundBufferPromises = new Map();
  const soundChannels = new Map();
  let soundContext = null;
  let soundResumePromise = null;
  let soundNeedsReset = false;

  const content = () => data[language];
  const pageIndex = (key) => pageKeys.indexOf(key);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileLayout = () => window.matchMedia("(max-width: 820px)").matches;
  const pageCrease = (extraClass = "") => `<div class="page-crease${extraClass ? ` ${extraClass}` : ""}" aria-hidden="true"></div>`;

  function toolbar(active) {
    const t = content();
    const navItem = (key, label) => `
      <button class="chapter-nav__item ${active === key ? "is-active" : ""}" type="button" data-page="${key}" ${active === key ? 'aria-current="page"' : ""}>
        <span class="toolbar-glass-text">${label}</span>
      </button>`;

    return `
      <header class="book-toolbar">
        <button class="wordmark" type="button" data-page="room" aria-label="${t.common.name}: home">
          <span class="toolbar-glass-text">${t.common.name}</span>
        </button>
        <nav class="chapter-nav" aria-label="Portfolio chapters">
          ${navItem("learn", t.common.learn)}
          ${navItem("work", t.common.work)}
          ${navItem("create", t.common.create)}
        </nav>
        <div class="book-tools">
          <button type="button" class="tool-button tool-button--language" data-language-toggle aria-expanded="false" aria-label="${t.common.language}">${{zh: "简中", "zh-Hant": "繁中", en: "English"}[language]} <span aria-hidden="true">⌄</span></button>
          <div class="language-menu" popover="auto" role="group" aria-label="${t.common.language}">${supportedLanguages.map(code => `<button type="button" data-language-choice="${code}" aria-pressed="${language === code}"><span aria-hidden="true">${language === code ? "✓" : ""}</span>${{zh: "简中", "zh-Hant": "繁中", en: "English"}[code]}</button>`).join("")}</div>
          <button type="button" class="tool-button tool-button--sound" data-action="sound" aria-pressed="${soundEnabled}" aria-label="${soundEnabled ? t.common.soundOn : t.common.soundOff}">
            <span class="sound-dot" aria-hidden="true"></span>
            <span class="tool-button__desktop-label toolbar-glass-text">${soundEnabled ? t.common.soundOn : t.common.soundOff}</span>
            <span class="tool-button__mobile-label toolbar-glass-text" aria-hidden="true">${t.common.soundShort}</span>
          </button>
          <button type="button" class="tool-button tool-button--cover" data-page="cover" aria-label="${t.common.returnToCover}"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 4h13v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M6 4v16M17 8h-7m3-3-3 3 3 3"/></svg></button>
          <button type="button" class="tool-button tool-button--resume" data-page="closing"><span class="toolbar-glass-text">${t.common.resume}</span></button>
        </div>
      </header>`;
  }

  function coverPage() {
    const t = content();
    const coverEdges = ['left','right','top','bottom'].map(side => `<span class="book-cover-edge book-cover-edge--${side}" aria-hidden="true"></span>`).join('');
    return `
      <article class="cover-page light-entry page-surface" data-page-key="cover">
        <h1 class="visually-hidden" tabindex="-1">Yixin Cui · A Personal Portfolio</h1>
        <div class="cover-book" tabindex="0" role="group" aria-label="${t.common.rotateCover}">
          <div class="book-volume">
            <span class="book-face book-face--back">
              ${coverEdges}<span class="book-back-inside" aria-hidden="true"></span>
              <span class="book-back-outside">
                <span class="back-flower" aria-hidden="true">✤</span>
                <span class="back-contact-title">Yixin Cui</span>
                <a class="back-email" href="mailto:${t.resume.email}">${t.resume.email}</a>
                <a class="back-cv" href="assets/Cui-Yixin-CV.pdf" target="_blank" rel="noreferrer">Read My CV</a>
              </span>
            </span>
            <span class="book-binding-cap book-binding-cap--top" aria-hidden="true"></span><span class="book-binding-cap book-binding-cap--bottom" aria-hidden="true"></span><span class="book-binding-inner" aria-hidden="true"></span>
            <span class="book-face book-face--spine" aria-hidden="true"></span>
            ${['#ff76b4','#ffb28a','#7af2e2','#91caff','#ffe47a','#b3f4a0','#aa94ff'].map((tint, i) => `<span class="book-leaf" aria-hidden="true" style="--leaf-angle:${-(i + 1) * 3}deg;--leaf-offset:calc(var(--book-depth) * ${(7 - i) / 8});--leaf-tint:${tint}"><span class="book-leaf__front"></span><span class="book-leaf__back"></span><span class="book-leaf__edge"></span><span class="book-leaf__hinge"></span><span class="book-leaf__top"></span><span class="book-leaf__bottom"></span></span>`).join('')}
            <button class="book-face book-face--front" type="button" data-page="room" aria-label="${t.common.openPortfolio}"><span class="book-front-outside"><img src="assets/portfolio-book-front-v2.webp" alt="Yixin Cui · A Personal Portfolio · I'm a student, a professional, and a creator." width="1024" height="1024" fetchpriority="high" /><span class="cover-flower-foil" aria-hidden="true"></span><span class="book-cover-caption">I'm a student, a professional, and a creator.</span></span><span class="book-front-inside" aria-hidden="true"></span>${coverEdges}</button>
          </div>
        </div>
        <span class="book-ground-shadow" aria-hidden="true"></span>
      </article>`;
  }

  function roomPage() {
    const t = content();
    const objects = t.room.objects;
    const objectButton = (key, className) => `
      <button class="object-hotspot object-hotspot--${className} object-hotspot--${objects[key].tone}" type="button" data-object="${key}" ${["hku", "crete", "nuaa", "awards"].includes(key) ? 'data-backdrop-target="true"' : ""} ${["hku", "crete", "nuaa", "awards", "campus"].includes(key) ? 'data-feedback-target="true"' : ""} aria-label="${objects[key].label}">
        <span class="object-hotspot__dot" aria-hidden="true"></span>
        <span class="object-hotspot__label">${objects[key].label}</span>
      </button>`;
    const wallPanel = (side) => `
      <svg class="room-space__wall room-space__wall--${side}" viewBox="0 0 1586 992" preserveAspectRatio="none" aria-hidden="true">
        <image href="assets/room-background-home-arch-v16.webp" width="1586" height="992" />
        ${side === "center" ? `
        <g class="room-hku-official" aria-hidden="true">
          <path d="M494 204 L583 197 L584 345 L494 352 Z" fill="#00734f" />
          <image href="assets/hku-official-shield-vector.svg" x="501" y="224" width="76" height="96" preserveAspectRatio="xMidYMid meet" />
        </g>
        <defs>
          <clipPath id="room-window-glass-mask">
            <path d="M315 43 L435 65 L435 452 L315 434 Z M600 178 L620 156 L620 500 L598 500 Z M1018 56 L1066 54 L1068 505 L1019 508 Z" />
          </clipPath>
          <linearGradient id="room-window-spectrum" x1="0" y1="0" x2=".55" y2="1">
            <stop offset="0" stop-color="#b89aff" stop-opacity="0" />
            <stop offset=".18" stop-color="#e6a1ff" stop-opacity=".55" />
            <stop offset=".34" stop-color="#9dccff" stop-opacity=".48" />
            <stop offset=".48" stop-color="#9affdf" stop-opacity=".38" />
            <stop offset=".59" stop-color="#fff2b0" stop-opacity=".5" />
            <stop offset=".72" stop-color="#ffb4dc" stop-opacity=".5" />
            <stop offset="1" stop-color="#b89aff" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="room-window-glint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0" />
            <stop offset=".43" stop-color="#c9fcff" stop-opacity=".1" />
            <stop offset=".5" stop-color="#fff8eb" stop-opacity=".85" />
            <stop offset=".57" stop-color="#ffbbee" stop-opacity=".2" />
            <stop offset="1" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <g class="room-window-light" clip-path="url(#room-window-glass-mask)">
          <g class="room-window-light__color">
            <rect x="460" y="-580" width="170" height="620" fill="url(#room-window-spectrum)" />
            <rect x="460" y="40" width="170" height="620" fill="url(#room-window-spectrum)" />
            <rect x="460" y="660" width="170" height="620" fill="url(#room-window-spectrum)" />
          </g>
          <g class="room-window-light__color room-window-light__color--right">
            <rect x="1016" y="-800" width="58" height="620" fill="url(#room-window-spectrum)" />
            <rect x="1016" y="-180" width="58" height="620" fill="url(#room-window-spectrum)" />
            <rect x="1016" y="440" width="58" height="620" fill="url(#room-window-spectrum)" />
          </g>
          <g class="room-window-light__glint">
            <path d="M472 -130 H484 V0 H472 Z M598 -130 H608 V0 H598 Z M1036 -30 H1044 V100 H1036 Z" fill="url(#room-window-glint)" />
          </g>
        </g>` : ""}
      </svg>`;
    const panelShape = (side, inset, top, bottom, hingeTop = 8.65, hingeBottom = 90) => {
      const left = side === "left", width = 1586 * (.5 - inset / 100);
      const topAngle = Math.atan((left ? hingeTop - top : top - hingeTop) * 9.92 / width);
      const bottomAngle = Math.atan((left ? hingeBottom - bottom : bottom - hingeBottom) * 9.92 / width);
      const points = left ? `0,${top} 100,${hingeTop} 100,${hingeBottom} 0,${bottom}` : `0,${hingeTop} 100,${top} 100,${bottom} 0,${hingeBottom}`;
      const clip = points.split(" ").map(point => point.split(",").map(n => n + "%").join(" ")).join(",");
      return {points, style:`--panel-clip:polygon(${clip});--edge-top:${left ? top : hingeTop}%;--edge-bottom:${left ? bottom : hingeBottom}%;--outer-top:${top}%;--outer-height:${bottom - top}%;--top-angle:${topAngle * 180 / Math.PI}deg;--bottom-angle:${bottomAngle * 180 / Math.PI}deg;--top-length:${100 / Math.cos(topAngle)}%;--bottom-length:${100 / Math.cos(bottomAngle)}%`};
    };
    const fanPages = ["left", "right"].map(side =>
      ["#d2b3ee", "#9dcbed", "#a8dfbb", "#f1dfa1", "#efa5c7"].map((tint, i) => {
        const inset = 9 - i * 1.875, top = 7 + i * 1.5, bottom = 83.3 - i * 1.5;
        const shape = panelShape(side, inset, top, bottom, 7, 83.3);
        const face = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${shape.points}" fill="${tint}" stroke="#f8f0ff" stroke-width="1" vector-effect="non-scaling-stroke" /></svg>`;
        return `<span class="room-book-leaf room-book-leaf--${side}" style="--leaf-tint:${tint};--leaf-angle:${(side === "left" ? -1 : 1) * (.3 + i * .3)}deg;--leaf-depth:${2 + i * 2.2}px;--leaf-inset:${inset}%;${shape.style}">
          <span class="room-leaf-face room-leaf-face--front">${face}</span><span class="room-leaf-face room-leaf-face--back">${face}</span>
          <span class="room-leaf-edge room-leaf-edge--outer"></span><span class="room-leaf-edge room-leaf-edge--top"></span><span class="room-leaf-edge room-leaf-edge--bottom"></span>
        </span>`;
      }).join("")
    ).join("");
    const frontCover = `<span class="room-cover-spread__front"><img src="assets/portfolio-book-front-v2.webp" alt="" draggable="false" /><span class="cover-flower-foil" aria-hidden="true"></span><span class="room-cover-spread__caption">I'm a student, a professional, and a creator.</span></span>`;
    const rearCover = `<span class="room-cover-spread__rear"><span class="room-cover-spread__contact"><span>✤</span><strong>Yixin Cui</strong><span>${t.resume.email}</span><span class="room-cover-spread__cv">Read My CV</span></span></span>`;
    const openCover = ["left", "right"].map(side => {
      const coverBottom = 6 + (1586 * .49 / 992) * 100;
      const shape = panelShape(side, 1, 6, coverBottom, 6, coverBottom);
      const corners = [6, 6, coverBottom, coverBottom];
      const outsideClip = `polygon(0 ${corners[0]}%,100% ${corners[1]}%,100% ${corners[2]}%,0 ${corners[3]}%)`;
      return `<div class="room-book-cover room-book-cover--${side}" style="${shape.style};--outside-clip:${outsideClip}"><span class="room-book-cover__inside"></span><span class="room-book-cover__outside"><span class="room-cover-art" data-cover-corners="${corners.join(',')}">${side === "left" ? frontCover : rearCover}</span></span><span class="room-cover-edge room-cover-edge--outer"></span><span class="room-cover-edge room-cover-edge--top"></span><span class="room-cover-edge room-cover-edge--bottom"></span></div>`;
    }).join("");
    return `
      <article class="room-page page-surface" data-page-key="room">
        ${toolbar("room")}
        <div class="room-scene">
          <div class="room-orbit" tabindex="0" role="group" aria-label="Drag to rotate the pop-up book through 360 degrees. Arrow keys rotate; Home resets.">
          <div class="room-volume" aria-hidden="true">${openCover}${fanPages}<span class="room-book-binding"></span></div>
          <div class="room-art-stage" data-spatial="true">
            <div class="room-space" aria-hidden="true">
              <div class="room-space__floor"></div>
              ${wallPanel("left")}
              ${wallPanel("center")}
              ${wallPanel("right")}
              <img class="room-space__person room-space__person--student" src="assets/room-standups-v2.webp" alt="" draggable="false" />
              <img class="room-space__person room-space__person--professional" src="assets/room-standups-v2.webp" alt="" draggable="false" />
              <img class="room-space__person room-space__person--creator" src="assets/room-standups-v2.webp" alt="" draggable="false" />
              <img class="room-space__desk" src="assets/room-island-no-cup-v5.webp" alt="" draggable="false" />
            </div>
            <img class="room-art" draggable="false" src="assets/homepage-popup-room.webp" alt="An ivory pop-up book with translucent rainbow-edged room panels: Yixin as a student reaching for books, a professional working at a laptop, and a creator cutting a collage. Explore the academic archive, professional projects, Monthly Echoes record player and HKU Compass." />
            <div class="room-vignette" aria-hidden="true"></div>

            ${objectButton("crete", "crete")}
            ${objectButton("hku", "hku-art")}
            ${objectButton("campus", "campus")}
            ${objectButton("nuaa", "nuaa")}
            ${objectButton("awards", "awards")}
            ${objectButton("sumec", "sumec")}
            ${objectButton("chinaDaily", "china-daily")}
            ${objectButton("broadcast", "broadcast")}
            ${objectButton("eastern", "eastern")}
            ${objectButton("loreal", "loreal")}
            ${objectButton("kol", "kol")}
            <a class="object-hotspot object-hotspot--monthly object-hotspot--create" data-object="monthlyEchoes" href="https://elwd84rz457j.meoo.zone/" target="_blank" rel="noopener noreferrer" aria-label="Monthly Echoes"><span class="object-hotspot__label">Monthly Echoes</span></a>
            <a class="object-hotspot object-hotspot--halloween object-hotspot--create" data-object="halloweenBeauty" href="${t.create.halloweenProject.url}" target="_blank" rel="noopener noreferrer" aria-label="${t.create.halloweenProject.title}">
              <img class="object-hotspot__illustration" src="${t.create.halloweenProject.objectImage}" alt="" draggable="false" />
              <span class="object-hotspot__label">${t.create.halloweenProject.title}</span>
            </a>
            <button class="object-hotspot object-hotspot--collage object-hotspot--create" type="button" data-object="collage" aria-label="${objects.collage.label}">
              <span class="object-hotspot__dot" aria-hidden="true"></span>
              <span class="object-hotspot__label">${objects.collage.label}</span>
            </button>
            <button class="object-hotspot object-hotspot--hku object-hotspot--create" type="button" data-object="hkuCompass" aria-label="${objects.hkuCompass.label}">
              <span class="object-hotspot__dot" aria-hidden="true"></span>
              <span class="object-hotspot__label">${objects.hkuCompass.label}</span>
            </button>
          </div>
          <div class="room-intro">
            <p>${t.room.eyebrow}</p>
            <h1 tabindex="-1">${t.room.title.replace("\n", "<br>")}</h1>
            <div class="room-intro__rule" aria-hidden="true"></div>
            <p class="room-intro__body">${t.room.intro}</p>
          </div>

          ${[ ["student", "learn"], ["professional", "work"], ["creator", "create"] ].map(([role, page]) => `
            <div class="role-selector role-selector--${role}">
              <button class="role-crystal" type="button" data-role-reveal="${role}" data-role-page="${page}" aria-expanded="false" aria-controls="role-name-${role}" aria-label="${t.common.openRole} ${t.room[role].label}">
                <svg viewBox="0 0 64 112" aria-hidden="true"><defs><linearGradient id="crystal-${role}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#97ffff"/><stop offset=".35" stop-color="#c5b2ff"/><stop offset=".65" stop-color="#ffc7de"/><stop offset="1" stop-color="#fff3ab"/></linearGradient></defs>
                  <path d="M32 3 4 50 32 109 60 50Z" fill="url(#crystal-${role})" fill-opacity=".7" stroke="#efffff" stroke-opacity=".85"/>
                  <path d="M32 3 19 50 4 50Z" fill="#74eadd" fill-opacity=".65"/><path d="M32 3 45 50 19 50Z" fill="#e9faff" fill-opacity=".45"/><path d="M32 3 60 50 45 50Z" fill="#ffd3e7" fill-opacity=".6"/>
                  <path d="M4 50 19 50 32 109Z" fill="#b8acff" fill-opacity=".65"/><path d="M19 50 45 50 32 109Z" fill="#a4efec" fill-opacity=".6"/><path d="M45 50 60 50 32 109Z" fill="#ffe6a2" fill-opacity=".65"/>
                  <path d="M32 3 19 50 32 109M4 50H60M32 3 45 50 32 109" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".6"/>
                </svg>
              </button>
              <span class="role-name" id="role-name-${role}" hidden>${t.room[role].label}</span>
            </div>`).join("")}


          </div>
          <nav class="room-mobile-chapters" aria-label="${t.common.explorePortfolio}">
            ${[["student", "learn"], ["professional", "work"], ["creator", "create"]].map(([role, page]) => `
              <button class="room-mobile-chapter" type="button" data-page="${page}">
                <span class="room-mobile-chapter__title">${t.common[page]}</span>
                <span class="room-mobile-chapter__role">${t.room[role].label}</span>
                <span class="room-mobile-chapter__hint">${t.room[role].hint}</span>
                <svg class="room-mobile-chapter__arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>`).join("")}
          </nav>
          ${pageCrease("book-gutter")}
        </div>
        <dialog class="experience-dialog" id="experience-dialog" aria-labelledby="experience-dialog-title">
          <div class="experience-dialog__accent" aria-hidden="true"></div>
          <button class="experience-dialog__close" type="button" data-action="close-experience" aria-label="${t.common.close}">×</button>
          <p class="experience-dialog__kicker" id="experience-dialog-kicker"></p>
          <h2 id="experience-dialog-title"></h2>
          <p class="experience-dialog__meta" id="experience-dialog-meta"></p>
          <ul class="experience-dialog__details" id="experience-dialog-details"></ul>
          <button class="experience-dialog__action" id="experience-dialog-action" type="button"></button>
        </dialog>
      </article>`;
  }

  function learnSectionCatalog() {
    const t = content();
    const objectSections = {
      academic: t.room.objects.crete,
      campus: t.room.objects.campus,
      awards: t.room.objects.awards
    };
    const educationDetails = t.learn.education.map((item) => ({
      title: item.school,
      date: item.date,
      subtitle: item.degree,
      detail: item.detail
    }));

    return ["education", "academic", "campus", "awards"].map((key) => {
      const section = t.learn.sections[key];
      const source = objectSections[key];
      const sectionDetails = key === "education"
        ? educationDetails
        : key === "awards"
          ? source.details.map((detail) => (
            typeof detail === "object"
              ? { ...detail, regularTitle: !detail.national }
              : detail
          ))
          : source.details;
      return {
        key,
        title: section.title,
        preview: section.preview,
        kicker: section.kicker || source.kicker,
        note: section.note || "",
        details: sectionDetails
      };
    });
  }

  function learnCertificateLink(markup, pageNumber, inline = false) {
    // Keep award descriptions public; the original certificate bundle stays local.
    return markup;
  }

  function learnDetailLink(markup, href, title, inline = false, extraClass = "") {
    return `<a
      class="learn-detail__certificate-link${inline ? " learn-detail__certificate-link--inline" : ""}${extraClass ? ` ${extraClass}` : ""}"
      href="${href}"
      target="_blank"
      rel="noopener noreferrer"
      title="${title}"
    >${markup}${inline ? "" : '<span class="learn-detail__certificate-icon" aria-hidden="true">↗</span>'}</a>`;
  }

  function learnDetailTitle(detail) {
    if (detail.titleParts) {
      return detail.titleParts.map((part) => {
        const emphasized = part.emphasis
          ? `<strong class="learn-detail__inline-emphasis">${part.html}</strong>`
          : part.html;
        return part.externalUrl
          ? learnDetailLink(emphasized, part.externalUrl, content().common.openScoreReport, true)
          : part.certificateHref
            ? learnDetailLink(emphasized, part.certificateHref, content().common.openCertificate, true)
          : part.certificatePage
            ? learnCertificateLink(emphasized, part.certificatePage, true)
            : emphasized;
      }).join("");
    }

    const linkedTitle = detail.externalUrl
      ? learnDetailLink(detail.title, detail.externalUrl, content().common.openArticle)
      : detail.certificateHref
        ? learnDetailLink(detail.title, detail.certificateHref, content().common.openCertificate)
      : detail.certificatePage
        ? learnCertificateLink(detail.title, detail.certificatePage)
        : detail.title;
    if (detail.regularTitle) return linkedTitle;
    const nationalClass = detail.national ? " learn-detail__national-award" : "";
    return `<strong class="learn-detail__item-name${nationalClass}">${linkedTitle}</strong>`;
  }

  function learnDetailLine(line) {
    const item = typeof line === "string" ? { html: line } : line;
    const linkedContent = item.certificatePage
      ? learnCertificateLink(item.html, item.certificatePage, true)
      : item.html;
    const articleLinks = (item.links || []).map((href, index) => {
      const label = String(index + 1).padStart(2, "0");
      return learnDetailLink(label, href, `${content().common.openArticle} ${index + 1}`, true, "learn-detail__article-link");
    }).join("");
    const contentMarkup = articleLinks
      ? `${linkedContent}<span class="learn-detail__article-links" aria-label="${content().common.openArticle}">${articleLinks}</span>`
      : linkedContent;
    const className = item.className ? ` class="${item.className}"` : "";
    return `<p${className}>${contentMarkup}</p>`;
  }

  function renderLearnDetail(detail) {
    if (typeof detail === "string") return detail;

    const dateMarkup = detail.date
      ? `<time class="learn-detail__date">${detail.date}</time>`
      : "";
    const subtitleMarkup = detail.subtitle ? `<span>${detail.subtitle}</span>` : "";
    const roleMarkup = detail.role ? `<p class="learn-detail__role">${detail.role}</p>` : "";
    const detailMarkup = detail.detail ? `<p>${detail.detail}</p>` : "";
    const linesMarkup = (detail.lines || []).map(learnDetailLine).join("");

    return `
      <div class="learn-detail__item-heading">
        <div class="learn-detail__item-title">${learnDetailTitle(detail)}</div>
        ${dateMarkup}
      </div>
      ${subtitleMarkup}
      ${roleMarkup}
      ${detailMarkup}
      ${linesMarkup}`;
  }

  function learnPage() {
    const t = content();
    const sections = learnSectionCatalog();
    const sectionBooks = sections.map((section, index) => `
      <li class="learn-section-item">
        <button
          class="learn-book learn-book--${section.key}"
          type="button"
          data-learn-section="${section.key}"
          aria-controls="learn-detail-panel"
          aria-expanded="false"
          style="--learn-book-index: ${index}"
        >
          <span class="learn-book__number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <span class="learn-book__title">${section.title}</span>
          <span class="learn-book__arrow" aria-hidden="true">→</span>
          <span class="learn-book__rules learn-book__rules--bottom" aria-hidden="true"></span>
          <span class="visually-hidden">${section.preview}</span>
        </button>
      </li>`).join("");
    const detailPages = sections.map((section) => `
      <section class="learn-detail__page" data-learn-detail="${section.key}" hidden>
        <p class="learn-detail__kicker">${section.kicker}</p>
        <h2 id="learn-detail-title-${section.key}" tabindex="-1">${section.title}</h2>
        ${section.note ? `<p class="learn-detail__list-note">${section.note}</p>` : ""}
        ${section.key === "awards" ? [section.details.slice(0, 10), section.details.slice(10)].map((items, index) => `<ul class="learn-detail__items learn-detail__items--with-note" data-learn-sheet-content="${index}" ${index ? "hidden" : ""}>${items.map(detail => `<li>${renderLearnDetail(detail)}</li>`).join("")}</ul>`).join("") : `<ul class="learn-detail__items${section.note ? " learn-detail__items--with-note" : ""}">${section.details.map(detail => `<li>${renderLearnDetail(detail)}</li>`).join("")}</ul>`}
        ${section.key === "awards" ? `<nav class="learn-sheet-nav" aria-label="${t.common.awardsPages}">${[0, 1].map(index => `<button type="button" data-learn-sheet="${index}" aria-current="${index === 0 ? "page" : "false"}">${t.common.pagePrefix}${index + 1}${t.common.pageSuffix}</button>`).join("")}<span>2 ${t.common.pagesUnit}</span></nav>` : ""}
      </section>`).join("");

    return `
      <article class="chapter-page chapter-page--learn page-surface" data-page-key="learn">

        <figure class="chapter-mobile-art chapter-mobile-art--learn" aria-hidden="true"></figure>
        <h1 class="visually-hidden" tabindex="-1">${t.learn.title}</h1>
        <div class="learn-shell">
          <section class="learn-index-panel" aria-label="${t.learn.sectionListLabel}">
            <p class="learn-archive-heading" aria-hidden="true">${t.learn.sectionListLabel}</p>
            <ul class="learn-section-list">
              ${sectionBooks}
            </ul>
          </section>
            <div class="learn-detail" id="learn-detail-panel" role="region" hidden>
              <button class="learn-detail__close" type="button" data-action="close-learn-detail" aria-label="${t.learn.closeDetail}">×</button>
              ${detailPages}
            </div>
          <div class="learn-portrait">
            <div class="learn-portrait__art" role="img" aria-label="${t.learn.portraitAlt}"></div>
            <div class="learn-portrait__light" aria-hidden="true"></div>
          </div>
        </div>
        ${pageCrease()}
      </article>`;
  }

  function workPage() {
    const t = content();
    const workDetailItem = (detail) => {
      const item = typeof detail === "string" ? { html: detail } : detail;
      const contentMarkup = item.href
        ? `<a class="work-source-link" href="${item.href}" target="_blank" rel="noopener noreferrer">${item.html}<span aria-hidden="true">↗</span></a>`
        : item.html;
      return `<li>${contentMarkup}</li>`;
    };
    const evidenceLink = (item) => `
      <a class="work-evidence-link" href="${item.href}" target="_blank" rel="noopener noreferrer">
        <span>${item.label}</span><span aria-hidden="true">↗</span>
      </a>`;
    const process = (items) => `
      <ol class="work-process">
        ${items.map((item) => `<li><span>${item}</span></li>`).join("")}
      </ol>`;
    const movedHeading = (item) => item.movedTitleHref
      ? `<a class="work-result-heading-link" href="${item.movedTitleHref}" target="_blank" rel="noopener noreferrer">${t.work.movedTitle}<span aria-hidden="true">↗</span></a>`
      : t.work.movedTitle;
    const standardPanel = (item) => `
      <div class="work-case-grid">
        <section class="work-case-column" aria-labelledby="work-handled-${item.key}">
          <h3 id="work-handled-${item.key}">${t.work.handledTitle}</h3>
          <ul>${item.handled.map(workDetailItem).join("")}</ul>
        </section>
        ${item.moved.length ? `<section class="work-case-column" aria-labelledby="work-moved-${item.key}">
          <h3 id="work-moved-${item.key}">${movedHeading(item)}</h3>
          <ul>${item.moved.map(workDetailItem).join("")}</ul>
        </section>` : ""}
      </div>
      ${item.evidence.length ? `<footer class="work-evidence">
        <p>${t.work.evidenceTitle}</p>
        <div>${item.evidence.map(evidenceLink).join("")}</div>
        ${item.evidenceNote ? `<small>${item.evidenceNote}</small>` : `<small>${t.work.publicEvidenceNote}</small>`}
      </footer>` : ""}`;
    const tabs = t.work.cases.map((item, index) => `
      <button
        class="work-tab work-tab--${item.key}"
        type="button"
        role="tab"
        id="work-tab-${item.key}"
        aria-controls="work-panel-${item.key}"
        aria-selected="${index === 0}"
        tabindex="${index === 0 ? 0 : -1}"
        data-work-tab="${item.key}"
      >${item.tabLabel || item.company}</button>`).join("");
    const panels = t.work.cases.map((item, index) => `
      <section
        class="work-panel${index === 0 ? " is-active" : ""}"
        id="work-panel-${item.key}"
        role="tabpanel"
        aria-labelledby="work-tab-${item.key}"
        data-work-panel="${item.key}"
        ${index === 0 ? "" : "hidden"}
      >
        <header class="work-panel__heading">
          <div><h2>${item.company}</h2><p>${item.role}</p>${item.context ? `<small class="work-context">${item.context}</small>` : ""}</div>
          <time>${item.date}</time>
        </header>
        ${process(item.process)}
        ${standardPanel(item)}
      </section>`).join("");

    return `
      <article class="chapter-page chapter-page--work page-surface" data-page-key="work" data-active-work-case="sumec">

        <figure class="chapter-mobile-art chapter-mobile-art--work" aria-hidden="true"></figure>
        <h1 class="visually-hidden" tabindex="-1">${t.work.title}</h1>
        <div class="work-shell">
          <section class="work-archive" aria-label="${t.work.archiveLabel}">
            <p class="work-archive__label">${t.work.archiveLabel}</p>
            <div class="work-tabs" role="tablist" aria-label="${t.work.tabListLabel}">${tabs}</div>
            <div class="work-dossier">
              <span class="work-paperclip" aria-hidden="true"></span>
              ${panels}
            </div>
          </section>
          <figure class="work-portrait">
            <img src="assets/work-professional-v2-balanced.webp" alt="${t.work.portraitAlt}" />
            <span class="work-portrait__light" aria-hidden="true"></span>
          </figure>
        </div>
        ${pageCrease()}
      </article>`;
  }

  function createPage() {
    const t = content();
    const featuredProject = t.create.featuredProject;
    const musicProject = t.create.musicProject;
    const halloweenProject = t.create.halloweenProject;
    const proof = t.create.stats.map((item) => `${item[0]} ${item[1]}`).join(" · ");
    const creatorStats = t.create.stats.map((item) => `
      <span class="create-stat">
        <strong>${item[0]}</strong>
        <small>${item[1]}</small>
      </span>`).join("");
    const mobileWorks = t.create.works.map((item, index) => `
      <a class="create-mobile-work create-mobile-work--${index + 1}" href="${item.url}" target="_blank" rel="noopener noreferrer" data-create-work="${index}">
        <img src="${item.image}" alt="${item.alt}" loading="lazy" />
        <span><strong>${item.title}</strong><small class="create-work-engagement">${item.engagement.join(" · ")}</small><small>${t.create.openWork} ↗</small></span>
      </a>`).join("");

    return `
      <article class="chapter-page chapter-page--create create-left-page page-surface" data-page-key="create">

        <figure class="chapter-mobile-art chapter-mobile-art--create" aria-hidden="true"></figure>
        <h1 class="visually-hidden" tabindex="-1">${t.create.title}</h1>
        <section class="chapter-create-content" aria-label="${t.create.archiveLabel}">
          <header class="chapter-create-heading">
            <h2 class="chapter-archive-title">${t.create.archiveLabel}</h2>
            <div class="chapter-create-account">
              <a class="chapter-profile-link" href="${t.create.profileUrl}" target="_blank" rel="noopener noreferrer">${t.create.profileLabel} ↗</a>
              <div class="create-stats" aria-label="${proof}">${creatorStats}</div>
            </div>
          </header>
          <h3 class="chapter-collage-title">${t.common.contentCollage}</h3>
          <div class="chapter-real-works">${mobileWorks}</div>
          <h3 class="chapter-digital-title">Vibe Coding</h3>
          <div class="chapter-projects">
            ${[featuredProject, musicProject, halloweenProject].map(project => `<a class="chapter-project${project === halloweenProject ? " chapter-project--halloween" : ""}" href="${project.url}" target="_blank" rel="noopener noreferrer">
              <img class="chapter-project__object" src="${project.objectImage}" alt="" />
              <span class="chapter-project__text"><strong>${project.title}</strong><small>${project.tag}</small></span>
              <span class="chapter-project__arrow" aria-hidden="true">→</span>
            </a>`).join("")}
          </div>
        </section>
      </article>`;
  }

  function closingPage() {
    const t = content();
    return `
      <article class="closing-page page-surface" data-page-key="closing">

        <span class="closing-ground" aria-hidden="true"></span>
        <div class="closing-book-orbit" role="group" tabindex="0" aria-label="${t.common.rotateClosingBook}">
          <div class="closing-inner closing-inner--editorial closing-spread">
            ${['left','right'].map(side => `<section class="closing-wing closing-wing--${side}">
              <div class="closing-reverse" aria-hidden="true"><div class="closing-reverse-face">${side === 'left' ? `<img src="assets/portfolio-book-front-v2.webp" alt="" draggable="false"><span class="cover-flower-foil" aria-hidden="true"></span><span class="room-cover-spread__caption">I'm a student, a professional, and a creator.</span>` : `<span class="closing-reverse-contact"><span>✤</span><strong>Yixin Cui</strong><span>${t.resume.email}</span><span>Read My CV</span></span>`}</div></div>
              ${['#ff76b4','#7af2e2','#ffe47a','#aa94ff'].map((tint,index) => `<span class="closing-sheet closing-sheet--${side}" aria-hidden="true" style="--leaf-tint:${tint};--sheet-angle:${(side === 'left' ? -1 : 1)*(4+index*5)}deg;--sheet-offset:${3+index*3}px"></span>`).join('')}
              <div class="closing-panel closing-panel--${side}">${side === 'left' ? `
                <p class="closing-kicker">${t.common.nextChapter}</p>
                <h1 class="closing-spread-title" tabindex="-1">${language === "en" ? "What’s the next<br>chapter?" : t.closing.title}</h1>` : `
                <div class="closing-spread-letter">
                  <p class="closing-spread-body">${t.closing.body}</p>
                  <p class="closing-spread-signoff">${t.closing.signoff}</p>
                  <div class="closing-actions closing-spread-actions">
                    <a class="primary-action" href="mailto:${t.resume.email}">${t.closing.emailLabel}<span aria-hidden="true">↗</span></a>
                    <button class="secondary-action" type="button" data-action="resume">${t.closing.resumeLabel}<span aria-hidden="true">↗</span></button>
                  </div>
                </div>`}</div>
            </section>`).join('')}
            <span class="closing-binding" aria-hidden="true"></span>
          </div>
        </div>
        ${pageCrease()}
      </article>`;
  }

  const renderers = [coverPage, roomPage, learnPage, workPage, createPage, closingPage];
  const pageMarkupCache = new Map();
  const pageTemplateCache = new Map();
  const warmedPageContexts = new Set();

  const pageCacheKey = (index) => `${language}:${soundEnabled ? 1 : 0}:${index}`;

  function renderedPageMarkup(index) {
    const cacheKey = pageCacheKey(index);
    if (!pageMarkupCache.has(cacheKey)) pageMarkupCache.set(cacheKey, renderers[index]());
    return pageMarkupCache.get(cacheKey);
  }

  function pageTemplate(index) {
    const cacheKey = pageCacheKey(index);
    if (!pageTemplateCache.has(cacheKey)) {
      const template = document.createElement("template");
      template.innerHTML = renderedPageMarkup(index);
      pageTemplateCache.set(cacheKey, template);
    }
    return pageTemplateCache.get(cacheKey);
  }

  function clonedPage(index) {
    return pageTemplate(index).content.cloneNode(true);
  }

  function schedulePageWarmup() {
    const contextKey = `${language}:${soundEnabled ? 1 : 0}`;
    if (warmedPageContexts.has(contextKey)) return;
    warmedPageContexts.add(contextKey);
    const warm = () => pageKeys.forEach((_, index) => pageTemplate(index));
    if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 1200 });
    else window.setTimeout(warm, 120);
  }

  function resetPageCaches() {
    pageMarkupCache.clear();
    pageTemplateCache.clear();
    warmedPageContexts.clear();
  }

  function resumeMarkup() {
    const t = content();
    const highlights = t.work.cases.map((item) => `<li>${item.company} · ${item.role}</li>`).join("");
    const linkGroups = t.resume.linkGroups.map((group) => `
      <div class="drawer-link-group">
        <h3 class="drawer-section-title">${group.label}</h3>
        ${group.description ? `<div class="drawer-creator-description">${group.description}</div>` : ""}
        <div>${group.links.map((link) => `<a class="drawer-highlight-link" href="${link.href}" target="_blank" rel="noopener noreferrer">${link.label}</a>`).join("")}</div>
      </div>`).join("");
    return `
      <p class="drawer-eyebrow">${t.resume.eyebrow}</p>
      <h2 id="resume-title">${t.resume.title}</h2>
      <a class="drawer-email drawer-email--intro" href="mailto:${t.resume.email}">${t.resume.email}</a>
      <p class="drawer-subtitle">${t.resume.subtitle}</p>
      <p class="drawer-summary">${t.resume.summary}</p>
      <div class="drawer-facts">
        <p>${t.resume.availability}</p>
        <p>${t.resume.proficiency}</p>
        <p>${t.resume.tools}</p>
      </div>
      <div class="drawer-link-groups">${linkGroups}</div>
      <h3 class="drawer-section-label drawer-section-title">${t.resume.experienceLabel}</h3>
      <ul class="drawer-highlights">${highlights}</ul>
      <div class="drawer-actions">
        <a class="primary-action" href="assets/Cui-Yixin-CV.pdf" target="_blank" rel="noreferrer">${t.resume.download}<span aria-hidden="true">↓</span></a>
      </div>`;
  }

  function updateReaderControls() {
    const t = content();
    readerControls.hidden = currentPage <= 1;
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pageKeys.length - 1;
    prevButton.querySelector("[data-i18n]").textContent = t.common.previous;
    nextButton.querySelector("[data-i18n]").textContent = t.common.next;
    prevButton.setAttribute("aria-label", t.common.previous);
    nextButton.setAttribute("aria-label", t.common.next);
    pageStatus.textContent = currentPage === 0
      ? ""
      : `${t.common.page} ${currentPage} ${t.common.of} ${pageKeys.length - 1}`;
  }

  // Fit complete dossiers to the printed leaf. Short entries gain larger type;
  // dense entries shrink within a readable range and retain a scroll fallback.
  let chapterFitFrame = 0;
  function fitChapterType() {
    cancelAnimationFrame(chapterFitFrame);
    chapterFitFrame = requestAnimationFrame(() => {
      if (!window.matchMedia("(min-width:821px)").matches) {
        bookContent.querySelectorAll(".work-dossier").forEach(dossier => {
          dossier.style.removeProperty("max-height");
          dossier.style.removeProperty("overflow-y");
        });
        return;
      }
      const archive = bookContent.querySelector(".work-archive");
      const detail = bookContent.querySelector(".learn-detail:not([hidden])");
      const host = archive || detail;
      const text = archive?.querySelector(".work-panel.is-active") || detail?.querySelector(".learn-detail__page:not([hidden])");
      if (!host || !text) return;
      const available = archive
        ? archive.clientHeight - archive.querySelector(".work-archive__label").offsetHeight
          - parseFloat(getComputedStyle(archive.querySelector(".work-archive__label")).marginBottom)
          - archive.querySelector(".work-tabs").offsetHeight
          - parseFloat(getComputedStyle(archive.querySelector(".work-dossier")).marginTop)
        : detail.clientHeight - parseFloat(getComputedStyle(detail).paddingTop) - parseFloat(getComputedStyle(detail).paddingBottom);
      let low = archive ? .78 : .85;
      let high = 1.5;
      for (let i = 0; i < 9; i++) {
        const scale = (low + high) / 2;
        host.style.setProperty("--page-type-scale", scale);
        if (text.offsetHeight <= available - 3) low = scale;
        else high = scale;
      }
      host.style.setProperty("--page-type-scale", low.toFixed(3));
      if (archive) {
        const dossier = archive.querySelector(".work-dossier");
        dossier.style.overflowY = text.offsetHeight > available ? "auto" : "visible";
        dossier.style.maxHeight = `${Math.max(0, available)}px`;
      }
    });
  }
  window.addEventListener("resize", fitChapterType, { passive: true });
  document.fonts.ready.then(fitChapterType);

  function render({ focusHeading = false, reuseContent = false, coverClosing = false, coverFar = false } = {}) {
    const t = content();
    document.documentElement.lang = { en: "en", zh: "zh-CN", "zh-Hant": "zh-Hant" }[language];
    document.title = t.meta.title;
    book.dataset.currentPage = pageKeys[currentPage];
    document.body.dataset.portfolioPage = pageKeys[currentPage];
    if (!reuseContent) {
      window.RoomMotion?.stop();
      window.LightEntry?.stop();
      window.ClosingBook?.stop();
      bookContent.replaceChildren(clonedPage(currentPage));
      window.RoomMotion?.mount(bookContent.querySelector(".room-art-stage"));
      window.LightEntry?.mount(bookContent.querySelector(".light-entry"), { closing: coverClosing, far: coverFar });
      window.ClosingBook?.mount(bookContent.querySelector(".closing-book-orbit"));
      if (pageKeys[currentPage] === "work") activateWorkCase(activeWorkCase);
      resumeContent.innerHTML = resumeMarkup();
    }
    window.clearTimeout(roleNavigationTimer);
    roleNavigationTimer = 0;
    document.querySelector(".portfolio-toolbar")?.remove();
    if (["room", "learn", "work", "create", "closing"].includes(pageKeys[currentPage])) {
      const roomClass = pageKeys[currentPage] === "room" ? " portfolio-toolbar--room" : "";
      document.body.insertAdjacentHTML("afterbegin", toolbar(pageKeys[currentPage]).replace('class="book-toolbar"', `class="book-toolbar portfolio-toolbar${roomClass}"`));
    }
    updateReaderControls();
    fitChapterType();
    schedulePageWarmup();
    if (focusHeading) {
      requestAnimationFrame(() => bookContent.querySelector("h1")?.focus({ preventScroll: true }));
    }
  }

  function saveReaderPosition() {
    const page = bookContent.firstElementChild;
    const scrollTargets = [".learn-detail", ".work-panel.is-active", ".work-tabs", ".chapter-create-content"];
    const scrolls = scrollTargets.map(selector => {
      const element = page?.querySelector(selector);
      return element ? { selector, top: element.scrollTop, left: element.scrollLeft } : null;
    }).filter(Boolean);
    const state = {
      version: 1, page: pageKeys[currentPage], language, workCase: activeWorkCase,
      learnSection: page?.dataset.activeLearnSection || "",
      scrollY: window.scrollY, scrolls
    };
    try {
      history.replaceState({ ...history.state, portfolioReader: state }, "");
    } catch (_) { /* Navigation must still work if a browser disallows state writes. */ }
  }

  function restoreReaderPosition() {
    if (!validReturnState) return;
    if (currentPage === pageIndex("learn") && returnState.learnSection) {
      const section = [...bookContent.querySelectorAll("[data-learn-section]")]
        .find(control => control.dataset.learnSection === returnState.learnSection);
      if (section) openLearnSection(returnState.learnSection);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const allowed = new Set([".learn-detail", ".work-panel.is-active", ".work-tabs", ".chapter-create-content"]);
      for (const item of returnState.scrolls || []) {
        if (!allowed.has(item.selector)) continue;
        const element = bookContent.querySelector(item.selector);
        if (element) {
          element.scrollTop = Number(item.top) || 0;
          element.scrollLeft = Number(item.left) || 0;
        }
      }
      window.scrollTo(0, Number(returnState.scrollY) || 0);
    }));
  }

  // Capture before the existing link handlers navigate, including PDFs and
  // illustrated object links. This also covers browser-managed navigation.
  document.addEventListener("click", event => {
    if (event.target.closest("a[href], [data-url]")) saveReaderPosition();
  }, { capture: true });
  window.addEventListener("pagehide", saveReaderPosition);

  function objectFrequency(key) {
    const tone = content().room.objects[key]?.tone;
    if (tone === "work") return 420;
    if (tone === "create") return 560;
    return 330;
  }

  function soundVolume(name, volume) {
    return Math.max(0, Math.min(1, volume * soundGain * (soundTypeGain[name] || 1)));
  }

  function ensureSoundTemplate(name) {
    let template = soundTemplates.get(name);
    if (!template) {
      template = document.createElement("audio");
      template.src = soundFiles[name];
      template.preload = "auto";
      template.hidden = true;
      template.setAttribute("playsinline", "");
      template.setAttribute("aria-hidden", "true");
      document.body.append(template);
      soundTemplates.set(name, template);
    }
    return template;
  }

  function updateSoundEngineStatus(context, status = context?.state || "unavailable") {
    if (context && context !== soundContext) return;
    document.documentElement.dataset.soundEngine = status;
  }

  function resetSoundContext() {
    const previousContext = soundContext;
    soundContext = null;
    soundResumePromise = null;
    soundNeedsReset = false;
    soundBuffers.clear();
    soundBufferPromises.clear();
    soundChannels.clear();
    if (previousContext && previousContext.state !== "closed") {
      void previousContext.close().catch(() => {});
    }
  }

  function ensureSoundContext({ reset = false } = {}) {
    if (reset || soundContext?.state === "closed") resetSoundContext();
    if (soundContext) return soundContext;
    const SoundContext = window.AudioContext || window.webkitAudioContext;
    if (!SoundContext) {
      updateSoundEngineStatus(null);
      return null;
    }
    try {
      soundContext = new SoundContext({ latencyHint: "interactive" });
    } catch (_) {
      soundContext = new SoundContext();
    }
    const context = soundContext;
    updateSoundEngineStatus(context);
    context.addEventListener("statechange", () => {
      if (context !== soundContext) return;
      updateSoundEngineStatus(context);
      if (context.state === "interrupted" || context.state === "closed") soundNeedsReset = true;
    });
    return soundContext;
  }

  function playSilentUnlockPulse(context) {
    try {
      const buffer = context.createBuffer(1, 1, context.sampleRate || 44100);
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = 0;
      source.connect(gain).connect(context.destination);
      source.addEventListener("ended", () => {
        source.disconnect();
        gain.disconnect();
      }, { once: true });
      source.start(0);
    } catch (_) {
      // The persistent media-element fallback remains available if Safari
      // declines the Web Audio unlock pulse.
    }
  }

  function resumeSoundContext({ fromUserGesture = false } = {}) {
    const context = ensureSoundContext({ reset: fromUserGesture && soundNeedsReset });
    if (!context) return Promise.resolve(null);
    if (fromUserGesture) playSilentUnlockPulse(context);
    if (context.state === "running") {
      soundNeedsReset = false;
      updateSoundEngineStatus(context);
      return Promise.resolve(context);
    }
    if (soundResumePromise && !fromUserGesture) return soundResumePromise;

    let resumeAttempt;
    try {
      // This call must happen synchronously inside the click/pointer gesture;
      // awaiting first can lose Safari's media-playback permission.
      resumeAttempt = context.resume();
    } catch (error) {
      soundNeedsReset = true;
      updateSoundEngineStatus(context, `blocked:${error.name}`);
      return Promise.resolve(null);
    }

    const attempt = Promise.race([
      Promise.resolve(resumeAttempt).then(() => context),
      new Promise((resolve) => window.setTimeout(() => resolve(null), 1200))
    ])
      .then((resumedContext) => {
        if (resumedContext === soundContext && resumedContext.state === "running") {
          soundNeedsReset = false;
          updateSoundEngineStatus(resumedContext);
          return resumedContext;
        }
        soundNeedsReset = true;
        updateSoundEngineStatus(context, `blocked:${context.state}`);
        return null;
      })
      .catch((error) => {
        soundNeedsReset = true;
        updateSoundEngineStatus(context, `blocked:${error.name}`);
        return null;
      })
      .finally(() => {
        if (soundResumePromise === attempt) soundResumePromise = null;
      });
    soundResumePromise = attempt;
    return attempt;
  }

  function decodeSoundData(context, data) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback) => (value) => {
        if (settled) return;
        settled = true;
        callback(value);
      };
      const onSuccess = finish(resolve);
      const onError = finish(reject);
      try {
        const result = context.decodeAudioData(data, onSuccess, onError);
        if (result?.then) result.then(onSuccess, onError);
      } catch (error) {
        onError(error);
      }
    });
  }

  function primeSoundBuffer(name) {
    if (soundBuffers.has(name)) return Promise.resolve(soundBuffers.get(name));
    if (soundBufferPromises.has(name)) return soundBufferPromises.get(name);
    const context = ensureSoundContext();
    if (!context || !soundFiles[name] || window.location.protocol === "file:") return Promise.resolve(null);
    const request = fetch(soundFiles[name], { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to preload ${name}`);
        return response.arrayBuffer();
      })
      .then((data) => decodeSoundData(context, data))
      .then((buffer) => {
        soundBuffers.set(name, buffer);
        soundBufferPromises.delete(name);
        return buffer;
      })
      .catch((error) => {
        soundBufferPromises.delete(name);
        document.documentElement.dataset.soundError = `${name}:${error.name}`;
        return null;
      });
    soundBufferPromises.set(name, request);
    return request;
  }

  function warmSoundEngine({ fromUserGesture = false } = {}) {
    const resumePromise = resumeSoundContext({ fromUserGesture });
    Object.keys(soundFiles).forEach((name) => {
      const template = ensureSoundTemplate(name);
      if (template.readyState === 0) template.load();
      void primeSoundBuffer(name);
    });
    return resumePromise;
  }

  function playBufferedSound(name, volume, playbackRate, channel = null) {
    const context = soundContext;
    const buffer = soundBuffers.get(name);
    if (!context || context.state !== "running" || !buffer) return false;
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = soundVolume(name, volume);
      if (channel) {
        // The first gesture can use the media fallback while buffers warm.
        // Stop that voice too when the next tab switches to buffered audio.
        soundTemplates.get(name)?.pause();
        const previous = soundChannels.get(channel);
        if (previous) {
          previous.gain.gain.cancelScheduledValues(context.currentTime);
          previous.gain.gain.setValueAtTime(previous.gain.gain.value, context.currentTime);
          previous.gain.gain.linearRampToValueAtTime(0, context.currentTime + .008);
          previous.source.stop(context.currentTime + .008);
        }
        soundChannels.set(channel, { source, gain });
      }
      source.connect(gain).connect(context.destination);
      document.documentElement.dataset.soundPlayback = `${name}:started:buffered`;
      source.addEventListener("ended", () => {
        if (channel && soundChannels.get(channel)?.source === source) soundChannels.delete(channel);
        document.documentElement.dataset.soundPlayback = `${name}:ended:buffered`;
        source.disconnect();
        gain.disconnect();
      }, { once: true });
      source.start(0);
      return true;
    } catch (error) {
      soundNeedsReset = true;
      document.documentElement.dataset.soundError = `${name}:${error.name}`;
      return false;
    }
  }

  function playMediaSound(name, volume, playbackRate) {
    const player = ensureSoundTemplate(name);
    try {
      player.pause();
      player.currentTime = 0;
    } catch (_) {
      // Safari can reject seeking before media metadata is ready; play() still
      // starts from the beginning on the element's first use.
    }
    player.volume = soundVolume(name, volume);
    player.playbackRate = playbackRate;
    document.documentElement.dataset.soundPlayback = `${name}:requested:media`;
    const playPromise = player.play();
    if (!playPromise?.then) {
      document.documentElement.dataset.soundPlayback = `${name}:started:media`;
      return;
    }
    playPromise
      .then(() => { document.documentElement.dataset.soundPlayback = `${name}:started:media`; })
      .catch((error) => {
        document.documentElement.dataset.soundPlayback = `${name}:blocked:${error.name}:media`;
      });
  }

  function playLocalSound(name, volume = 1, playbackRate = 1, channel = null) {
    if (!soundEnabled || !soundFiles[name]) return;
    if (playBufferedSound(name, volume, playbackRate, channel)) return;
    // Keep one persistent media element per sound. Safari grants playback
    // permission per element more reliably than it does for a fresh clone on
    // every interaction, while Web Audio finishes warming in the background.
    void warmSoundEngine();
    playMediaSound(name, volume, playbackRate);
  }

  function playObjectHoverSound(key) {
    if (!soundEnabled) return;
    const now = performance.now();
    if (key === lastObjectHoverKey && now - lastObjectHoverAt < 180) return;
    lastObjectHoverKey = key;
    lastObjectHoverAt = now;
    playLocalSound("hover", 0.48, objectFrequency(key) / 420);
  }

  function playLearnBookHoverSound(key) {
    if (!soundEnabled) return;
    const hoverKey = `learn-book:${key}`;
    const now = performance.now();
    if (hoverKey === lastObjectHoverKey && now - lastObjectHoverAt < 180) return;
    lastObjectHoverKey = hoverKey;
    lastObjectHoverAt = now;
    const bookTones = {
      education: 0.86,
      academic: 0.93,
      campus: 1,
      awards: 1.08
    };
    playLocalSound("hover", 0.38, bookTones[key] || 0.94);
  }

  function playCreateWorkSelectSound(index) {
    const workTones = [0.92, 0.98, 1.04, 1.1];
    playLocalSound("select", 0.44, workTones[Number(index)] || 1);
  }

  function playCreateWorkHoverSound(index) {
    if (!soundEnabled) return;
    const hoverKey = `create-work:${index}`;
    const now = performance.now();
    if (hoverKey === lastObjectHoverKey && now - lastObjectHoverAt < 180) return;
    lastObjectHoverKey = hoverKey;
    lastObjectHoverAt = now;
    const workTones = [0.9, 0.96, 1.02, 1.08];
    playLocalSound("hover", 0.38, workTones[Number(index)] || 0.98);
  }

  function playObjectSelectSound(key) {
    playLocalSound("select", 0.7, 0.92 + (objectFrequency(key) - 330) / 1150);
  }

  function playPageSound(direction = 1, intensity = 1) {
    playLocalSound("page", 0.72 * intensity, direction > 0 ? 1 : 0.86);
  }

  const libraryFlipSupported = () => Boolean(window.St?.PageFlip) && !mobileLayout();

  function pageFlipHalf(index, side, geometry) {
    const page = document.createElement("div");
    const surface = document.createElement("div");
    const pageClone = index === currentPage
      ? bookContent.firstElementChild.cloneNode(true)
      : clonedPage(index).firstElementChild;
    page.className = `page-flip__page page-flip__page--${side}`;
    surface.className = `page-flip__surface page-flip__surface--${side} book-content`;
    page.setAttribute("aria-hidden", "true");
    pageClone.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
    pageClone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    pageClone.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((element) => {
      element.tabIndex = -1;
    });
    // Preserve the artwork's original coordinate system inside the smaller leaf.
    surface.style.width = `${geometry.stageWidth}px`;
    surface.style.height = `${geometry.stageHeight}px`;
    surface.style.left = `${-geometry.x - (side === "right" ? geometry.width / 2 : 0)}px`;
    surface.style.top = `${-geometry.y}px`;
    surface.style.transform = "none";
    pageClone.classList.add("physical-turn-surface");
    pageClone.querySelectorAll(".book-toolbar, .closing-ground, .closing-close").forEach(node => node.remove());
    surface.append(pageClone);
    page.append(surface);
    return page;
  }

  function disposeLibraryTurn() {
    if (!libraryTurnState) return;
    const state = libraryTurnState;
    libraryTurnState = null;
    window.clearTimeout(state.holdTimer);
    window.cancelAnimationFrame(state.moveFrame);
    try {
      state.instance.destroy();
    } catch (_) {
      state.root.remove();
    }
    book.classList.remove("is-library-grabbed", "is-library-turning", "is-library-turning-next", "is-library-turning-prev");
  }

  function finishLibraryTurn(commit) {
    if (!libraryTurnState) return;
    const { targetIndex, direction, soundPlayed } = libraryTurnState;
    disposeLibraryTurn();
    isTurning = false;
    if (commit) currentPage = targetIndex;
    render({ focusHeading: commit });
    if (commit && !soundPlayed) playPageSound(direction, 0.82);
  }

  function prepareLibraryTurn(targetIndex, direction, { programmatic = false } = {}) {
    if ([0,1,5].includes(targetIndex) || [0,1,5].includes(currentPage)) return false;
    if (!libraryFlipSupported() || targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage) return false;
    if (libraryTurnState) disposeLibraryTurn();

    const bounds = book.getBoundingClientRect();
    const root = document.createElement("div");
    const sourceOrder = direction > 0
      ? [[currentPage, "left"], [currentPage, "right"], [targetIndex, "left"], [targetIndex, "right"]]
      : [[targetIndex, "left"], [targetIndex, "right"], [currentPage, "left"], [currentPage, "right"]];
    const chapterOnly = [2, 3, 4].includes(currentPage) && [2, 3, 4].includes(targetIndex);
    const geometry = {
      stageWidth: bounds.width, stageHeight: bounds.height,
      x: chapterOnly ? bounds.width * .01 : 0,
      y: chapterOnly ? bounds.height * .016 : 0,
      width: chapterOnly ? bounds.width * .96 : bounds.width,
      height: chapterOnly ? bounds.height * .974 : bounds.height
    };
    const pages = sourceOrder.map(([index, side]) => pageFlipHalf(index, side, geometry));
    const startPage = direction > 0 ? 0 : 2;
    const destinationPage = direction > 0 ? 2 : 0;

    root.className = "page-flip-engine";
    root.dataset.direction = direction > 0 ? "next" : "prev";
    Object.assign(root.style, {
      inset: "auto", left: `${geometry.x}px`, top: `${geometry.y}px`,
      width: `${geometry.width}px`, height: `${geometry.height}px`
    });
    root.setAttribute("aria-hidden", "true");
    book.append(root);

    const instance = new window.St.PageFlip(root, {
      width: Math.max(1, Math.round(geometry.width / 2)),
      height: Math.max(1, Math.round(geometry.height)),
      size: "stretch",
      minWidth: 100,
      maxWidth: 2400,
      minHeight: 100,
      maxHeight: 1800,
      startPage,
      flippingTime: 480,
      drawShadow: true,
      maxShadowOpacity: 0.42,
      usePortrait: false,
      autoSize: false,
      showCover: false,
      mobileScrollSupport: true,
      clickEventForward: false,
      useMouseEvents: true,
      showPageCorners: true,
      disableFlipByClick: false
    });

    libraryTurnState = {
      instance,
      root,
      geometry,
      targetIndex,
      direction,
      startPage,
      destinationPage,
      started: programmatic,
      soundPlayed: programmatic,
      pointerId: null,
      dragStartX: 0,
      dragStartY: 0,
      dragMoved: false,
      holdLifted: false,
      holdTimer: 0,
      moveFrame: 0,
      pendingPoint: null,
      pendingIsTouch: false
    };

    instance.on("changeState", (event) => {
      if (!libraryTurnState || libraryTurnState.instance !== instance) return;
      if (["user_fold", "flipping"].includes(event.data)) {
        libraryTurnState.started = true;
        isTurning = true;
        book.classList.add("is-library-turning", direction > 0 ? "is-library-turning-next" : "is-library-turning-prev");
      }
      if (event.data === "read" && libraryTurnState.started) {
        const commit = instance.getCurrentPageIndex() === destinationPage;
        window.requestAnimationFrame(() => finishLibraryTurn(commit));
      }
    });

    instance.loadFromHTML(pages);
    instance.getUI().removeHandlers?.();

    if (programmatic) {
      isTurning = true;
      playPageSound(direction, 0.82);
      book.classList.add("is-library-turning", direction > 0 ? "is-library-turning-next" : "is-library-turning-prev");
      window.requestAnimationFrame(() => {
        if (!libraryTurnState || libraryTurnState.instance !== instance) return;
        if (direction > 0) instance.flipNext("bottom");
        else instance.flipPrev("bottom");
      });
    }
    return true;
  }

  function setTurnSnapshot(snapshot, pageClone, side) {
    snapshot.className = `page-turn__snapshot page-turn__snapshot--${side}`;
    snapshot.replaceChildren(pageClone);
    snapshot.inert = true;
  }

  function prepareTurn(targetIndex, direction, { pointerId = null, startX = 0 } = {}) {
    if ([0,1,5].includes(targetIndex) || [0,1,5].includes(currentPage)) return false;
    if (targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage || isTurning) return false;

    const currentPageNode = bookContent.firstElementChild;
    const turnKey = direction > 0 ? "next" : "prev";
    const turningPage = pageTurns[turnKey];
    const frontSnapshot = turningPage.querySelector(".page-turn__face--front .page-turn__snapshot");
    const backSnapshot = turningPage.querySelector(".page-turn__face--back .page-turn__snapshot");
    const currentSide = direction > 0 ? "right" : "left";
    const targetSide = direction > 0 ? "left" : "right";
    const currentUnderlay = currentPageNode.cloneNode(true);
    const targetUnderlay = clonedPage(targetIndex).firstElementChild;

    window.cancelAnimationFrame(turnAnimationFrame);
    window.cancelAnimationFrame(turnRenderFrame);
    isTurning = true;
    turnState = {
      targetIndex,
      direction,
      soundPlayed: pointerId === null,
      pointerId,
      startX,
      lastX: startX,
      lastTime: performance.now(),
      velocity: 0,
      progress: 0,
      underlaySwapped: false,
      currentUnderlay,
      targetUnderlay,
      turningPage
    };

    if (turnState.soundPlayed) playPageSound(direction, 0.82);

    setTurnSnapshot(stationarySnapshot, currentPageNode.cloneNode(true), currentSide);
    setTurnSnapshot(frontSnapshot, currentPageNode.cloneNode(true), currentSide);
    setTurnSnapshot(backSnapshot, clonedPage(targetIndex), targetSide);
    stationaryPage.classList.toggle("is-left", currentSide === "left");
    stationaryPage.classList.toggle("is-right", currentSide === "right");
    book.classList.add("is-page-turning", direction > 0 ? "is-turning-next" : "is-turning-prev");
    book.dataset.turnDirection = turnKey;
    setTurnProgress(0);
    return true;
  }

  function syncTurnUnderlay(progress) {
    if (!turnState) return;
    const shouldShowTarget = progress >= 0.5;
    if (shouldShowTarget === turnState.underlaySwapped) return;
    bookContent.replaceChildren(shouldShowTarget ? turnState.targetUnderlay : turnState.currentUnderlay);
    turnState.underlaySwapped = shouldShowTarget;
  }

  function setTurnProgress(progress) {
    if (!turnState) return;
    const nextProgress = Math.max(0, Math.min(1, progress));
    const fold = Math.sin(nextProgress * Math.PI);
    const direction = turnState.direction;
    turnState.progress = nextProgress;
    syncTurnUnderlay(nextProgress);
    book.style.setProperty("--turn-progress", nextProgress.toFixed(4));
    book.style.setProperty("--turn-fold", fold.toFixed(4));
    book.style.setProperty("--turn-angle", `${(direction * -180 * nextProgress).toFixed(3)}deg`);
    book.style.setProperty("--turn-shadow", Math.min(0.72, fold * 0.72).toFixed(4));
    book.style.setProperty("--stationary-opacity", Math.max(0, 1 - Math.max(0, nextProgress - 0.46) / 0.16).toFixed(4));
  }

  function finishTurn(commit) {
    if (!turnState) return;
    syncTurnUnderlay(commit ? 1 : 0);
    const { targetIndex, direction, soundPlayed } = turnState;
    window.cancelAnimationFrame(turnAnimationFrame);
    window.cancelAnimationFrame(turnRenderFrame);
    if (commit) currentPage = targetIndex;
    turnState = null;
    isTurning = false;
    book.classList.remove("is-page-turning", "is-page-dragging", "is-turning-next", "is-turning-prev", "is-page-settling");
    delete book.dataset.turnDirection;
    book.style.removeProperty("--turn-progress");
    book.style.removeProperty("--turn-fold");
    book.style.removeProperty("--turn-angle");
    book.style.removeProperty("--turn-shadow");
    book.style.removeProperty("--stationary-opacity");
    stationarySnapshot.replaceChildren();
    Object.values(pageTurns).forEach((pageTurn) => {
      pageTurn.querySelectorAll(".page-turn__snapshot").forEach((snapshot) => snapshot.replaceChildren());
    });
    render({ focusHeading: commit, reuseContent: commit });
    if (commit && !soundPlayed) playPageSound(direction, 0.82);
  }

  function exponentialEaseOut(progress, strength = 10) {
    if (progress >= 1) return 1;
    return (1 - Math.pow(2, -strength * progress)) / (1 - Math.pow(2, -strength));
  }

  function paperTurnEase(progress) {
    const spineCrossing = 0.46;
    if (progress <= spineCrossing) {
      const lift = progress / spineCrossing;
      const smoothLift = lift * lift * (3 - 2 * lift);
      return smoothLift * 0.5;
    }
    const settle = (progress - spineCrossing) / (1 - spineCrossing);
    return 0.5 + exponentialEaseOut(settle, 8) * 0.5;
  }

  function animateTurnTo(destination, { commit = destination === 1, initialVelocity = 0, durationOverride = 0 } = {}) {
    if (!turnState) return;
    if (reducedMotion()) {
      setTurnProgress(destination);
      finishTurn(commit);
      return;
    }

    const start = turnState.progress;
    const distance = Math.abs(destination - start);
    const duration = durationOverride || Math.max(170, Math.min(420, 190 + distance * 210 - Math.min(70, Math.abs(initialVelocity) * 45)));
    const startedAt = performance.now();
    book.classList.remove("is-page-dragging");
    book.classList.add("is-page-settling");

    const step = (now) => {
      if (!turnState) return;
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = durationOverride
        ? paperTurnEase(elapsed)
        : exponentialEaseOut(elapsed);
      setTurnProgress(start + (destination - start) * eased);
      if (elapsed < 1) {
        turnAnimationFrame = window.requestAnimationFrame(step);
      } else {
        finishTurn(commit);
      }
    };
    turnAnimationFrame = window.requestAnimationFrame(step);
  }

  async function mobileTurnTo(targetIndex, direction, { focusHeading = true, fromShift = 0, fromOpacity = 1 } = {}) {
    if(targetIndex===0){bookContent.getAnimations?.().forEach(a=>a.cancel());bookContent.style.removeProperty('transform');bookContent.style.removeProperty('opacity');await turnCover(0);return;}
    if (targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage || isTurning) return;
    if (reducedMotion()) {
      currentPage = targetIndex;
      render({ focusHeading });
      playPageSound(direction, 0.58);
      return;
    }

    isTurning = true;
    playPageSound(direction, 0.66);
    book.classList.add("is-mobile-page-turning", direction > 0 ? "is-mobile-turning-next" : "is-mobile-turning-prev");
    const exitShift = direction > 0 ? -2.4 : 2.4;
    const enterShift = direction > 0 ? 2.1 : -2.1;

    try {
      if (bookContent.animate) {
        const exitAnimation = bookContent.animate([
          { opacity: fromOpacity, transform: `translate3d(${fromShift}%, 0, 0)` },
          { opacity: 0, transform: `translate3d(${exitShift}%, 0, 0)` }
        ], {
          duration: 115,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards"
        });
        await exitAnimation.finished.catch(() => {});
      }

      currentPage = targetIndex;
      render({ focusHeading });

      if (bookContent.animate) {
        const enterAnimation = bookContent.animate([
          { opacity: 0, transform: `translate3d(${enterShift}%, 0, 0)` },
          { opacity: 1, transform: "translate3d(0, 0, 0)" }
        ], {
          duration: 175,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        });
        await enterAnimation.finished.catch(() => {});
      }
    } finally {
      bookContent.getAnimations?.().forEach((animation) => animation.cancel());
      bookContent.style.removeProperty("opacity");
      bookContent.style.removeProperty("transform");
      book.classList.remove("is-mobile-page-turning", "is-mobile-turning-next", "is-mobile-turning-prev");
      isTurning = false;
    }
  }

  async function turnCover(targetIndex) {
    if (currentPage === 5 && targetIndex === 0) {
      await retreatClosingBook();
      return;
    }
    isTurning = true;
    try {
      if (reducedMotion()) {
        currentPage = targetIndex;
        render({ focusHeading: true });
        return;
      }
      playPageSound(targetIndex === 0 ? -1 : 1, .7);
      if (targetIndex !== 0) {
        bookContent.classList.add('entry-opening');
        await new Promise(resolve => window.setTimeout(resolve, 950));
        bookContent.classList.remove('entry-opening');
        currentPage = targetIndex;
        render({ focusHeading: true });
      } else {
        // The stage stays fixed. Fade the room, then close only the physical cover.
        const fade=bookContent.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});
        await fade.finished.catch(()=>{});
        fade.cancel();
        currentPage=0;
        render({focusHeading:true,coverClosing:true});
        bookContent.classList.add('entry-closing');
        await new Promise(resolve=>window.setTimeout(resolve,850));
      }
    } finally {
      bookContent.classList.remove('entry-opening', 'entry-closing');
      if(currentPage===0)window.LightEntry?.center();
      isTurning = false;
    }
  }

  async function retreatClosingBook() {
    isTurning = true;
    const animations = [];
    let outgoing;
    try {
      playPageSound(-1, .6);
      // Keep the released closing pose on stage while the original entrance
      // volume takes over during the motion, rather than swapping at its end.
      const source = bookContent.querySelector('.closing-page');
      const bounds = source.getBoundingClientRect();
      outgoing = source.cloneNode(true);
      Object.assign(outgoing.style, { position:'fixed', inset:'auto',
        left:`${bounds.left}px`, top:`${bounds.top}px`,
        width:`${bounds.width}px`, height:`${bounds.height}px`, minHeight:'0' });
      outgoing.classList.add('book-retreat-overlay');
      outgoing.inert = true;
      outgoing.querySelector('.closing-book-orbit').dataset.bookAnimation = 'retreating';
      currentPage = 0;
      render({ coverClosing: true });
      const entrance = bookContent.querySelector('.light-entry');
      document.body.append(outgoing);
      const duration = reducedMotion() ? 0 : 1800;
      const motion = { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' };
      const distance = outgoing.querySelector('.closing-distance');
      animations.push(distance.animate([
        { transform: 'scale3d(1,1,1)' },
        { transform: 'scale3d(.38,.38,.38)' }
      ], motion));
      animations.push(outgoing.animate([
        { opacity: 1, offset: 0 }, { opacity: 1, offset: .22 },
        { opacity: 0, offset: .76 }, { opacity: 0, offset: 1 }
      ], motion));
      animations.push(entrance.animate([
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: .22 },
        { opacity: 1, offset: .76 },
        { opacity: 1, offset: 1 }
      ], motion));
      await Promise.all([window.LightEntry.retreat(duration),
        ...animations.map(animation => animation.finished.catch(() => {}))]);
    } finally {
      outgoing?.remove();
      animations.forEach(animation => animation.cancel());
      isTurning = false;
    }
  }

  // The last cover is a different physical pose, so settle the book itself
  // instead of treating its black stage as a rectangular turning leaf.
  async function turnClosing(targetIndex, direction) {
    isTurning = true;
    const animations = [];
    book.classList.add("is-closing-transition");
    try {
      playPageSound(direction, .66);
      if (!reducedMotion()) {
        const outgoing = bookContent.querySelector(".closing-book-orbit, .room-orbit, .chapter-page");
        const wings = [...bookContent.querySelectorAll('.closing-wing')];
        if (wings.length) {
          const folds = wings.map((wing,index) => wing.animate([
            { opacity:1, transform:getComputedStyle(wing).transform },
            { opacity:0, transform:`rotateY(${index === 0 ? 75 : -75}deg)` }
          ], { duration:210, easing:"cubic-bezier(.4,0,.8,1)", fill:"forwards" }));
          animations.push(...folds);
          await Promise.all(folds.map(fold => fold.finished.catch(() => {})));
        } else if (outgoing?.animate) {
          const pose = getComputedStyle(outgoing).transform;
          const animation = outgoing.animate([
            { opacity: 1, transform: pose === "none" ? "perspective(1800px) rotateY(0deg)" : pose },
            { opacity: 0, transform: `perspective(1800px) rotateY(${direction > 0 ? -28 : 28}deg) rotateX(8deg) scale(.94)` }
          ], { duration: 210, easing: "cubic-bezier(.4,0,.8,1)", fill: "forwards" });
          animations.push(animation);
          await animation.finished.catch(() => {});
        }
      }
      currentPage = targetIndex;
      render({ focusHeading: true });
      if (!reducedMotion()) {
        const incoming = bookContent.querySelector(".closing-book-orbit, .room-orbit, .chapter-page");
        const wings = [...bookContent.querySelectorAll('.closing-wing')];
        if (wings.length) {
          const folds = wings.map((wing,index) => wing.animate([
            { opacity:0, transform:`rotateY(${index === 0 ? 75 : -75}deg)` },
            { opacity:1, transform:getComputedStyle(wing).transform }
          ], { duration:310, easing:"cubic-bezier(.16,1,.3,1)", fill:"forwards" }));
          animations.push(...folds);
          await Promise.all(folds.map(fold => fold.finished.catch(() => {})));
        } else if (incoming?.animate) {
          const pose = getComputedStyle(incoming).transform;
          const animation = incoming.animate([
            { opacity: 0, transform: `perspective(1800px) rotateY(${direction > 0 ? 8 : -8}deg) rotateX(5deg) translateY(12px) scale(.97)` },
            { opacity: 1, transform: pose === "none" ? "perspective(1800px) rotateY(0deg)" : pose }
          ], { duration: 310, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
          animations.push(animation);
          await animation.finished.catch(() => {});
        }
      }
    } finally {
      animations.forEach(animation => animation.cancel());
      book.classList.remove("is-closing-transition");
      isTurning = false;
    }
  }

  // The room is a complete pop-up volume, not a pair of rectangular leaves.
  // Rotate its entire construction through the spine before opening the next
  // spread. Keep the user's orbit pose nested inside this temporary hinge.
  async function turnRoom(targetIndex, direction) {
    isTurning = true;
    book.classList.add("is-volume-turning");
    const animations = [];
    const hinge = async (incoming) => {
      const volume = bookContent.querySelector(".room-orbit, .chapter-page, .closing-book-orbit");
      if (!volume) return;
      const wrapper = document.createElement("div");
      wrapper.className = "volume-turn-hinge";
      volume.before(wrapper);
      wrapper.append(volume);
      const angle = incoming ? direction * 82 : -direction * 82;
      const open = "rotateY(0deg) rotateX(0deg) translateZ(0px)";
      const folded = `rotateY(${angle}deg) rotateX(6deg) translateZ(-36px)`;
      const animation = wrapper.animate(incoming ? [
        { transform: folded },
        { transform: "rotateY(0deg) rotateX(-1.5deg) translateZ(8px)", offset: .83 },
        { transform: open }
      ] : [
        { transform: open },
        { transform: folded }
      ], {
        duration: incoming ? 400 : 250,
        easing: incoming ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.55,.05,.8,.45)",
        fill: "both"
      });
      animations.push(animation);
      await animation.finished.catch(() => {});
      if (incoming) {
        wrapper.replaceWith(volume);
        animation.cancel();
      }
    };
    try {
      playPageSound(direction, .72);
      await hinge(false);
      currentPage = targetIndex;
      render({ focusHeading: true });
      await hinge(true);
    } finally {
      animations.forEach(animation => animation.cancel());
      book.classList.remove("is-volume-turning");
      isTurning = false;
    }
  }

  function turnTo(target, explicitDirection) {
    const targetIndex = typeof target === "number" ? target : pageIndex(target);
    if (targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage || isTurning || mobileSwipeState) return;
    if (currentPage === 0 || targetIndex === 0) {
      void turnCover(targetIndex);
      return;
    }
    const direction = explicitDirection || (targetIndex > currentPage ? 1 : -1);
    if (mobileLayout()) {
      void mobileTurnTo(targetIndex, direction);
      return;
    }
    if (reducedMotion()) {
      currentPage = targetIndex;
      render({ focusHeading: true });
      playPageSound(direction, 0.58);
      return;
    }
    if (currentPage === 1 || targetIndex === 1) {
      void turnRoom(targetIndex, direction);
      return;
    }
    if (targetIndex === 5 || currentPage === 5) {
      void turnClosing(targetIndex, direction);
      return;
    }
    if (libraryFlipSupported()) {
      prepareLibraryTurn(targetIndex, direction, { programmatic: true });
      return;
    }
    if (!prepareTurn(targetIndex, direction)) return;
    window.requestAnimationFrame(() => animateTurnTo(1, { commit: true, durationOverride: 620 }));
  }

  function beginMobileSwipe(event) {
    mobileSwipeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      direction: 0,
      velocity: 0,
      progress: 0,
      shift: 0,
      opacity: 1
    };
    book.classList.add("is-mobile-swiping");
    try { book.setPointerCapture?.(event.pointerId); } catch (_) { /* Synthetic input may not own a pointer. */ }
  }

  function moveMobileSwipe(event) {
    if (!mobileSwipeState || mobileSwipeState.pointerId !== event.pointerId) return;
    const bounds = book.getBoundingClientRect();
    const rawDelta = mobileSwipeState.startX - event.clientX;
    const direction = rawDelta >= 0 ? 1 : -1;
    const targetIndex = currentPage + direction;
    const now = performance.now();
    const elapsed = Math.max(8, now - mobileSwipeState.lastTime);
    mobileSwipeState.velocity = Math.abs(event.clientX - mobileSwipeState.lastX) / elapsed;
    mobileSwipeState.lastX = event.clientX;
    mobileSwipeState.lastTime = now;

    if (targetIndex < 0 || targetIndex >= pageKeys.length) {
      mobileSwipeState.progress = 0;
      return;
    }

    const progress = Math.min(1, Math.abs(rawDelta) / (bounds.width * 0.72));
    const shift = direction > 0 ? -progress * 1.6 : progress * 1.6;
    const opacity = 1 - progress * 0.18;
    mobileSwipeState.direction = direction;
    mobileSwipeState.progress = progress;
    mobileSwipeState.shift = shift;
    mobileSwipeState.opacity = opacity;
    bookContent.style.transform = `translate3d(${shift}%, 0, 0)`;
    bookContent.style.opacity = opacity.toFixed(3);
    if (Math.abs(rawDelta) > 5) event.preventDefault();
  }

  async function cancelMobileSwipe(fromShift, fromOpacity) {
    isTurning = true;
    try {
      if (bookContent.animate) {
        const returnAnimation = bookContent.animate([
          { opacity: fromOpacity, transform: `translate3d(${fromShift}%, 0, 0)` },
          { opacity: 1, transform: "translate3d(0, 0, 0)" }
        ], {
          duration: 135,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        });
        await returnAnimation.finished.catch(() => {});
      }
    } finally {
      bookContent.getAnimations?.().forEach((animation) => animation.cancel());
      bookContent.style.removeProperty("opacity");
      bookContent.style.removeProperty("transform");
      isTurning = false;
    }
  }

  function endMobileSwipe(event, cancelled = false) {
    if (!mobileSwipeState || mobileSwipeState.pointerId !== event.pointerId) return;
    try { book.releasePointerCapture?.(event.pointerId); } catch (_) { /* Pointer may already be released. */ }
    const swipe = mobileSwipeState;
    mobileSwipeState = null;
    book.classList.remove("is-mobile-swiping");
    const targetIndex = currentPage + swipe.direction;
    const commit = !cancelled
      && swipe.direction !== 0
      && targetIndex >= 0
      && targetIndex < pageKeys.length
      && (swipe.progress >= 0.24 || swipe.velocity > 0.46);

    if (commit) {
      void mobileTurnTo(targetIndex, swipe.direction, {
        fromShift: swipe.shift,
        fromOpacity: swipe.opacity
      });
    } else {
      void cancelMobileSwipe(swipe.shift, swipe.opacity);
    }
  }

  function beginPageDrag(event) {
    if (currentPage === 0 || event.target.closest(".room-orbit")) return;
    if (isTurning || drawer.open || document.querySelector("#experience-dialog[open]")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("a, button, input, select, textarea, dialog, [role='tab'], [contenteditable='true'], .work-archive, .learn-detail, .chapter-create-content")) return;

    if (!mobileLayout() && currentPage===1) {
      const bounds=book.getBoundingClientRect();
      if(event.clientX<bounds.left+bounds.width/2){
        coverReturnGesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY};
        book.setPointerCapture?.(event.pointerId);event.preventDefault();return;
      }
    }
    if (mobileLayout()) {
      beginMobileSwipe(event);
      return;
    }

    if (reducedMotion()) return;
    if (currentPage === 2 && event.clientX < book.getBoundingClientRect().left + book.getBoundingClientRect().width / 2) {
      roomReturnGesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
      book.setPointerCapture?.(event.pointerId);
      return;
    }
    const closingBounds = book.getBoundingClientRect();
    if (currentPage === 4 && event.clientX > closingBounds.left + closingBounds.width / 2) {
      closingGesture = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY };
      book.setPointerCapture?.(event.pointerId);
      return;
    }

    if (libraryFlipSupported()) {
      const bounds = book.getBoundingClientRect();
      const direction = event.clientX >= bounds.left + bounds.width / 2 ? 1 : -1;
      const targetIndex = currentPage + direction;
      const chapter = bookContent.querySelector(".chapter-page");
      if (chapter && (event.clientX < bounds.left + bounds.width * .12
        || event.clientX > bounds.left + bounds.width * .97
        || event.clientY < bounds.top + bounds.height * .016
        || event.clientY > bounds.top + bounds.height * .99)) return;
      if (!prepareLibraryTurn(targetIndex, direction)) return;
      libraryTurnState.pointerId = event.pointerId;
      libraryTurnState.dragStartX = event.clientX;
      libraryTurnState.dragStartY = event.clientY;
      book.classList.add("is-library-grabbed");
      const leafBounds = libraryTurnState.root.getBoundingClientRect();
      libraryTurnState.instance.startUserTouch({
        x: event.clientX - leafBounds.left,
        y: event.clientY - leafBounds.top
      });
      const activeState = libraryTurnState;
      activeState.holdTimer = window.setTimeout(() => {
        if (libraryTurnState !== activeState || activeState.dragMoved) return;
        activeState.holdLifted = true;
        activeState.instance.userMove({
          x: activeState.dragStartX - leafBounds.left + (direction > 0 ? -10 : 10),
          y: activeState.dragStartY - leafBounds.top
        }, false);
      }, 90);
      try { book.setPointerCapture?.(event.pointerId); } catch (_) { /* Pointer capture may be unavailable. */ }
      event.preventDefault();
      return;
    }

    const bounds = book.getBoundingClientRect();
    const direction = event.clientX >= bounds.left + bounds.width / 2 ? 1 : -1;
    const targetIndex = currentPage + direction;
    if (!prepareTurn(targetIndex, direction, { pointerId: event.pointerId, startX: event.clientX })) return;

    book.classList.add("is-page-dragging");
    try { book.setPointerCapture?.(event.pointerId); } catch (_) { /* Synthetic input may not own a pointer. */ }
    setTurnProgress(0.012);
  }

  function movePageDrag(event) {
    if (roomReturnGesture?.pointerId === event.pointerId) return;
    if (closingGesture?.pointerId === event.pointerId) return;
    if(coverReturnGesture?.pointerId===event.pointerId)return;
    if (mobileSwipeState) {
      moveMobileSwipe(event);
      return;
    }
    if (libraryTurnState?.pointerId === event.pointerId) {
      const bounds = libraryTurnState.root.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - libraryTurnState.dragStartX,
        event.clientY - libraryTurnState.dragStartY
      );
      if (distance > 5) {
        libraryTurnState.dragMoved = true;
        window.clearTimeout(libraryTurnState.holdTimer);
      }
      libraryTurnState.pendingPoint = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      };
      libraryTurnState.pendingIsTouch = event.pointerType !== "mouse";
      if (!libraryTurnState.moveFrame) {
        const activeState = libraryTurnState;
        activeState.moveFrame = window.requestAnimationFrame(() => {
          activeState.moveFrame = 0;
          if (libraryTurnState !== activeState || !activeState.pendingPoint) return;
          activeState.instance.userMove(activeState.pendingPoint, activeState.pendingIsTouch);
        });
      }
      if (distance > 5) event.preventDefault();
      return;
    }
    if (!turnState || turnState.pointerId !== event.pointerId || !book.classList.contains("is-page-dragging")) return;
    const bounds = book.getBoundingClientRect();
    const travel = bounds.width * (window.matchMedia("(max-width: 820px)").matches ? 0.82 : 0.68);
    const delta = turnState.direction > 0
      ? turnState.startX - event.clientX
      : event.clientX - turnState.startX;
    const now = performance.now();
    const elapsed = Math.max(8, now - turnState.lastTime);
    const directionalDelta = turnState.direction > 0
      ? turnState.lastX - event.clientX
      : event.clientX - turnState.lastX;
    turnState.velocity = directionalDelta / elapsed;
    turnState.lastX = event.clientX;
    turnState.lastTime = now;
    const nextProgress = Math.max(0, Math.min(1, delta / travel));

    window.cancelAnimationFrame(turnRenderFrame);
    turnRenderFrame = window.requestAnimationFrame(() => setTurnProgress(nextProgress));
    if (Math.abs(delta) > 5) event.preventDefault();
  }

  function endPageDrag(event, cancelled = false) {
    if (roomReturnGesture?.pointerId === event.pointerId) {
      const gesture = roomReturnGesture; roomReturnGesture = null;
      if (book.hasPointerCapture?.(event.pointerId)) book.releasePointerCapture(event.pointerId);
      if (!cancelled && event.clientX - gesture.startX > 60 && Math.abs(event.clientY - gesture.startY) < 160) turnTo(1, -1);
      return;
    }
    if (closingGesture?.pointerId === event.pointerId) {
      const gesture = closingGesture; closingGesture = null;
      if (book.hasPointerCapture?.(event.pointerId)) book.releasePointerCapture(event.pointerId);
      if (!cancelled && gesture.startX - event.clientX > 60 && Math.abs(event.clientY - gesture.startY) < 160) void turnClosing(5, 1);
      return;
    }
    if(coverReturnGesture?.pointerId===event.pointerId){
      const gesture=coverReturnGesture;coverReturnGesture=null;
      if(book.hasPointerCapture?.(event.pointerId))book.releasePointerCapture(event.pointerId);
      if(!cancelled && event.clientX-gesture.startX>60 && Math.abs(event.clientY-gesture.startY)<160)void turnCover(0);
      return;
    }
    if (mobileSwipeState) {
      endMobileSwipe(event, cancelled);
      return;
    }
    if (libraryTurnState?.pointerId === event.pointerId) {
      const state = libraryTurnState;
      window.clearTimeout(state.holdTimer);
      window.cancelAnimationFrame(state.moveFrame);
      try { book.releasePointerCapture?.(event.pointerId); } catch (_) { /* Pointer may already be released. */ }
      if (!state.dragMoved) {
        const { targetIndex, direction } = state;
        disposeLibraryTurn();
        isTurning = false;
        // A tap on the paper is a turn, rather than a cancelled short drag.
        if (!cancelled) turnTo(targetIndex, direction);
        return;
      }
      const bounds = state.root.getBoundingClientRect();
      if (state.pendingPoint) state.instance.userMove(state.pendingPoint, state.pendingIsTouch);
      state.instance.userStop({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      }, false);
      return;
    }
    if (!turnState || turnState.pointerId !== event.pointerId || !book.classList.contains("is-page-dragging")) return;
    try { book.releasePointerCapture?.(event.pointerId); } catch (_) { /* Pointer may already be released. */ }
    const progress = turnState.progress;
    const velocity = turnState.velocity;
    const commit = !cancelled && (progress >= 0.42 || (progress >= 0.08 && velocity > 0.48));
    animateTurnTo(commit ? 1 : 0, { commit, initialVelocity: velocity });
  }

  function updatePerspective(event) {
    if (isTurning || currentPage === 1 || currentPage === 5 || book.classList.contains("is-closing-transition") || turnState || libraryTurnState?.started || reducedMotion() || window.matchMedia("(max-width: 820px)").matches) return;
    const bookBounds = book.getBoundingClientRect();
    const bookX = (event.clientX - bookBounds.left) / bookBounds.width;
    const insideBookY = event.clientY >= bookBounds.top && event.clientY <= bookBounds.bottom;
    if (insideBookY && bookX >= 0 && bookX <= 0.11) book.dataset.edgeHover = "left";
    else if (insideBookY && bookX >= 0.89 && bookX <= 1) book.dataset.edgeHover = "right";
    else delete book.dataset.edgeHover;
    window.cancelAnimationFrame(perspectiveFrame);
    perspectiveFrame = window.requestAnimationFrame(() => {
      const bounds = bookStage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      book.style.setProperty("--pointer-x", x.toFixed(3));
      book.style.setProperty("--pointer-y", y.toFixed(3));
      book.style.setProperty("--book-tilt-x", `${(-y * 1.65).toFixed(3)}deg`);
      book.style.setProperty("--book-tilt-y", `${(x * 2.2).toFixed(3)}deg`);
      book.style.setProperty("--parallax-x", `${(-x * 0.28).toFixed(3)}rem`);
      book.style.setProperty("--parallax-y", `${(-y * 0.2).toFixed(3)}rem`);
      book.style.setProperty("--shadow-x", `${(x * 0.85).toFixed(3)}rem`);
      book.style.setProperty("--shadow-scale", (1 - y * 0.035).toFixed(3));
    });
  }

  function resetPerspective() {
    delete book.dataset.edgeHover;
    book.style.setProperty("--pointer-x", "0");
    book.style.setProperty("--pointer-y", "0");
    book.style.setProperty("--book-tilt-x", "0deg");
    book.style.setProperty("--book-tilt-y", "0deg");
    book.style.setProperty("--parallax-x", "0rem");
    book.style.setProperty("--parallax-y", "0rem");
    book.style.setProperty("--shadow-x", "0rem");
    book.style.setProperty("--shadow-scale", "1");
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-language-toggle]");
    if (trigger) {
      const menu = trigger.nextElementSibling;
      if (menu.matches(":popover-open")) { menu.hidePopover(); return; }
      const bounds = trigger.getBoundingClientRect();
      menu.style.left = `${Math.max(8, Math.min(innerWidth - 138, bounds.right - 130))}px`;
      menu.style.top = `${bounds.bottom + 8}px`;
      menu.showPopover();
      trigger.setAttribute("aria-expanded", "true");
      menu.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
      return;
    }
    const choice = event.target.closest("[data-language-choice]");
    if (choice) {
      choice.closest(".language-menu").hidePopover();
      setLanguage(choice.dataset.languageChoice);
      document.querySelector("[data-language-toggle]")?.focus({preventScroll:true});
    }
  });
  document.addEventListener("toggle", event => {
    if (event.target.matches(".language-menu")) {
      event.target.previousElementSibling?.setAttribute("aria-expanded", String(event.newState === "open"));
    }
  }, true);

  function setLanguage(nextLanguage) {
    if (!supportedLanguages.includes(nextLanguage) || nextLanguage === language) return;
    disposeLibraryTurn();
    language = nextLanguage;
    localStorage.setItem("yixin-language", language);
    saveReaderPosition();
    resetPageCaches();
    render();
  }

  function toggleSound() {
    disposeLibraryTurn();
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      // Safari requires the AudioContext resume and the first media-element
      // play to occur in the same trusted click that enables sound.
      void warmSoundEngine({ fromUserGesture: true });
      playPageSound(1, 0.42);
    } else {
      soundChannels.forEach(({ source }) => source.stop());
      soundChannels.clear();
      soundTemplates.forEach((player) => {
        player.pause();
        try { player.currentTime = 0; } catch (_) { /* Metadata may not be ready. */ }
      });
      document.documentElement.dataset.soundPlayback = "off";
    }
    resetPageCaches();
    render();
  }

  function recoverSoundFromUserGesture() {
    if (!soundEnabled) return;
    void warmSoundEngine({ fromUserGesture: true });
  }

  function recoverSoundAfterVisibilityChange() {
    if (!soundEnabled || document.hidden) return;
    void warmSoundEngine();
  }

  function openResume() {
    resumeContent.innerHTML = resumeMarkup();
    if (!drawer.open) drawer.showModal();
  }

  function experienceDetailMarkup(detail) {
    if (typeof detail === "string") return `<li>${detail}</li>`;
    if (!detail || typeof detail !== "object") return "";

    const title = Array.isArray(detail.titleParts)
      ? detail.titleParts.map((part) => part?.html || "").join("")
      : detail.title || "";
    const meta = [detail.date, detail.role].filter(Boolean).join(" · ");
    const lines = Array.isArray(detail.lines)
      ? detail.lines
        .map((line) => typeof line === "string" ? line : line?.html || "")
        .filter(Boolean)
      : [];

    if (!title && !meta && !lines.length) return "";

    return `
      <li class="experience-dialog__detail-item">
        ${title ? `<strong class="experience-dialog__detail-title">${title}</strong>` : ""}
        ${meta ? `<span class="experience-dialog__detail-meta">${meta}</span>` : ""}
        ${lines.length ? `<span class="experience-dialog__detail-summary">${lines.join('<span aria-hidden="true"> · </span>')}</span>` : ""}
      </li>`;
  }

  function openExperience(key) {
    const item = content().room.objects[key];
    const dialog = document.querySelector("#experience-dialog");
    if (!item || !dialog) return;
    dialog.dataset.tone = item.tone;
    dialog.dataset.experienceKey = key;
    dialog.querySelector("#experience-dialog-kicker").textContent = item.kicker;
    dialog.querySelector("#experience-dialog-title").textContent = item.title;
    const meta = dialog.querySelector("#experience-dialog-meta");
    meta.textContent = item.meta || "";
    meta.hidden = !item.meta;
    dialog.querySelector("#experience-dialog-details").innerHTML = item.details
      .map(experienceDetailMarkup)
      .filter(Boolean)
      .join("");
    const action = dialog.querySelector("#experience-dialog-action");
    action.textContent = item.action;
    action.removeAttribute("data-page");
    action.removeAttribute("data-url");
    if (item.page) action.dataset.page = item.page;
    if (item.externalUrl) action.dataset.url = item.externalUrl;
    playPageSound(1, 0.72);
    dialog.showModal();
  }

  function openLearnSection(key) {
    const page = document.querySelector(".chapter-page--learn");
    const detail = page?.querySelector(".learn-detail");
    const list = page?.querySelector(".learn-section-list");
    const targetPage = page?.querySelector(`[data-learn-detail="${key}"]`);
    const targetControl = page?.querySelector(`[data-learn-section="${key}"]`);
    if (!page || !detail || !list || !targetPage || !targetControl) return;

    page.querySelectorAll("[data-learn-section]").forEach((control) => {
      control.setAttribute("aria-expanded", String(control === targetControl));
    });
    page.querySelectorAll("[data-learn-detail]").forEach((section) => {
      section.hidden = section !== targetPage;
    });

    page.dataset.activeLearnSection = key;
    detail.setAttribute("aria-labelledby", `learn-detail-title-${key}`);
    detail.hidden = false;
    list.inert = true;
    playPageSound(1, 0.46);
    requestAnimationFrame(() => {
      page.classList.add("is-detail-open");
      detail.classList.add("is-visible");
      fitChapterType();
      window.setTimeout(() => targetPage.querySelector("h2")?.focus({ preventScroll: true }), reducedMotion() ? 0 : 220);
    });
  }

  document.addEventListener("click", event => {
    const control = event.target.closest("[data-learn-sheet]");
    if (!control) return;
    const section = control.closest(".learn-detail__page");
    section.querySelectorAll("[data-learn-sheet-content]").forEach(sheet => {
      sheet.hidden = sheet.dataset.learnSheetContent !== control.dataset.learnSheet;
    });
    section.querySelectorAll("[data-learn-sheet]").forEach(button => {
      button.setAttribute("aria-current", button === control ? "page" : "false");
    });
    section.closest(".learn-detail").scrollTop = 0;
    fitChapterType();
  });

  function closeLearnSection({ restoreFocus = true } = {}) {
    const page = document.querySelector(".chapter-page--learn");
    const detail = page?.querySelector(".learn-detail");
    const list = page?.querySelector(".learn-section-list");
    if (!page || !detail || detail.hidden || !list) return;

    const activeKey = page.dataset.activeLearnSection;
    const activeControl = activeKey ? page.querySelector(`[data-learn-section="${activeKey}"]`) : null;
    page.classList.remove("is-detail-open");
    detail.classList.remove("is-visible");
    playPageSound(-1, 0.38);

    window.setTimeout(() => {
      detail.hidden = true;
      page.querySelectorAll("[data-learn-detail]").forEach((section) => { section.hidden = true; });
      page.querySelectorAll("[data-learn-section]").forEach((control) => control.setAttribute("aria-expanded", "false"));
      list.inert = false;
      detail.removeAttribute("aria-labelledby");
      delete page.dataset.activeLearnSection;
      if (restoreFocus) activeControl?.focus({ preventScroll: true });
    }, reducedMotion() ? 0 : 260);
  }

  function activateWorkCase(key, { focusTab = false } = {}) {
    const page = document.querySelector(".chapter-page--work");
    const targetTab = page?.querySelector(`[data-work-tab="${key}"]`);
    const targetPanel = page?.querySelector(`[data-work-panel="${key}"]`);
    if (!page || !targetTab || !targetPanel) return;
    const changed = targetTab.getAttribute("aria-selected") !== "true";

    activeWorkCase = key;
    page.dataset.activeWorkCase = key;
    page.querySelectorAll("[data-work-tab]").forEach((tab) => {
      const active = tab === targetTab;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    page.querySelectorAll("[data-work-panel]").forEach((panel) => {
      const active = panel === targetPanel;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
      if (active) panel.scrollTop = 0;
    });
    fitChapterType();
    if (changed) playLocalSound("select", 0.44, 1, "work-tab");
    if (focusTab) {
      lastObjectHoverKey = `work-tab:${key}`;
      lastObjectHoverAt = performance.now();
      targetTab.focus({ preventScroll: true });
    }
  }

  function setActiveRoomObject(key = "") {
    const artStage = document.querySelector(".room-art-stage");
    if (!artStage) return;
    if (key) artStage.dataset.activeObject = key;
    else delete artStage.dataset.activeObject;
  }

  document.addEventListener("pointerover", (event) => {
    const learnSectionControl = event.target.closest("[data-learn-section]");
    if (learnSectionControl && !learnSectionControl.contains(event.relatedTarget)
      && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      playLearnBookHoverSound(learnSectionControl.dataset.learnSection);
    }

    const createWorkControl = event.target.closest("[data-create-work]");
    if (createWorkControl && !createWorkControl.contains(event.relatedTarget)
      && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      playCreateWorkHoverSound(createWorkControl.dataset.createWork);
    }

    const objectControl = event.target.closest("[data-object]");
    if (!objectControl || objectControl.contains(event.relatedTarget)) return;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setActiveRoomObject(objectControl.dataset.object);
      playObjectHoverSound(objectControl.dataset.object);
    }
  });

  document.addEventListener("pointerout", (event) => {
    const objectControl = event.target.closest("[data-object]");
    if (!objectControl || objectControl.contains(event.relatedTarget)) return;
    if (!objectControl.classList.contains("is-activating")) setActiveRoomObject();
  });

  document.addEventListener("focusin", (event) => {
    const learnSectionControl = event.target.closest("[data-learn-section]");
    if (learnSectionControl && window.matchMedia("(min-width: 821px)").matches) {
      playLearnBookHoverSound(learnSectionControl.dataset.learnSection);
    }

    const createWorkControl = event.target.closest("[data-create-work]");
    if (createWorkControl && window.matchMedia("(min-width: 821px)").matches) {
      playCreateWorkHoverSound(createWorkControl.dataset.createWork);
    }

    const objectControl = event.target.closest("[data-object]");
    if (objectControl && window.matchMedia("(min-width: 821px)").matches) {
      setActiveRoomObject(objectControl.dataset.object);
      playObjectHoverSound(objectControl.dataset.object);
    }
  });

  document.addEventListener("focusout", (event) => {
    const objectControl = event.target.closest("[data-object]");
    if (objectControl && !objectControl.classList.contains("is-activating")) setActiveRoomObject();
  });

  function showRoleTitle(control, visible) {
    control.setAttribute("aria-expanded", String(visible));
    control.closest(".role-selector").querySelector(".role-name").hidden = !visible;
  }
  document.addEventListener("pointerover", event => {
    const control = event.target.closest("[data-role-reveal]");
    if (control && event.pointerType !== "touch") showRoleTitle(control, true);
  });
  document.addEventListener("pointerout", event => {
    const selector = event.target.closest(".role-selector");
    if (selector && !selector.contains(event.relatedTarget) && !roleNavigationTimer) {
      showRoleTitle(selector.querySelector("[data-role-reveal]"), false);
    }
  });
  document.addEventListener("focusin", event => {
    const control = event.target.closest("[data-role-reveal]");
    if (control) showRoleTitle(control, true);
  });
  document.addEventListener("focusout", event => {
    const control = event.target.closest("[data-role-reveal]");
    if (control && !roleNavigationTimer) showRoleTitle(control, false);
  });

  document.addEventListener("click", (event) => {
    // Black stage clicks close the final spread, like the cover's own backdrop.
    // Keep the book's drag surface, toolbar, reader controls and dialogs active.
    if (currentPage === 5 && !isTurning && !drawer.open && !event.defaultPrevented
      && !event.target.closest(".closing-book-orbit, .portfolio-toolbar, #reader-controls, a, button, input, select, textarea, dialog")) {
      const volume = bookContent.querySelector('.closing-book-orbit');
      const bounds = volume.getBoundingClientRect();
      const clearance = Math.max(72, Math.min(120, bounds.width * .15));
      // Only deliberate clicks well beyond the book's left/right edges retreat.
      // The nearby black gaps and the space above/below it are a safe buffer.
      const outsideSide = event.clientX < bounds.left - clearance || event.clientX > bounds.right + clearance;
      if (outsideSide && event.clientY >= bounds.top && event.clientY <= bounds.bottom) turnTo("cover");
      return;
    }
    const roleCrystal = event.target.closest("[data-role-reveal]");
    if (roleCrystal) {
      if (roleNavigationTimer || isTurning) return;
      showRoleTitle(roleCrystal, true);
      const crystalTones = { student: 0.94, professional: 1, creator: 1.08 };
      playLocalSound("crystal", 0.48, crystalTones[roleCrystal.dataset.roleReveal] || 1);
      const destination = roleCrystal.dataset.rolePage;
      roleNavigationTimer = window.setTimeout(() => {
        roleNavigationTimer = 0;
        turnTo(destination);
      }, reducedMotion() ? 0 : 220);
      return;
    }
    const workTab = event.target.closest("[data-work-tab]");
    if (workTab) {
      activateWorkCase(workTab.dataset.workTab);
      return;
    }
    const learnSectionControl = event.target.closest("[data-learn-section]");
    if (learnSectionControl) {
      openLearnSection(learnSectionControl.dataset.learnSection);
      return;
    }
    const createWorkControl = event.target.closest("[data-create-work]");
    if (createWorkControl) {
      playCreateWorkSelectSound(createWorkControl.dataset.createWork);
      return;
    }
    const objectControl = event.target.closest("[data-object]");
    if (objectControl) {
      if(objectControl.tagName==="A" && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))return;
      event.preventDefault();
      if (objectControl.classList.contains("is-activating")) return;
      const key=objectControl.dataset.object;
      setActiveRoomObject(key);
      objectControl.classList.add("is-activating");
      playObjectSelectSound(key);
      window.RoomMotion?.bounce(key);
      const revealDelay = reducedMotion() ? 0 : 380;
      window.setTimeout(() => {
        objectControl.classList.remove("is-activating");
        const targetCase={loreal:"loreal",kol:"creator-campaigns"}[key];
        if(objectControl.tagName==="A") window.location.assign(objectControl.href);
        else if(targetCase){activeWorkCase=targetCase;turnTo("work");}
        else openExperience(key);
      }, revealDelay);
      return;
    }
    const pageControl = event.target.closest("[data-page]");
    if (pageControl) {
      pageControl.closest("dialog")?.close();
      turnTo(pageControl.dataset.page);
      return;
    }
    const urlControl = event.target.closest("[data-url]");
    if (urlControl) {
      window.open(urlControl.dataset.url, "_blank", "noopener,noreferrer");
      return;
    }
    const actionControl = event.target.closest("[data-action]");
    if (!actionControl) return;
    if (actionControl.dataset.action === "sound") toggleSound();
    if (actionControl.dataset.action === "resume") openResume();
    if (actionControl.dataset.action === "close-learn-detail") closeLearnSection();
    if (actionControl.dataset.action === "close-experience") {
      playPageSound(-1, 0.52);
      actionControl.closest("dialog")?.close();
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[target="_blank"]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (link.classList.contains("chapter-project")) {
      playLocalSound("select", 0.44, 1, "create-project");
      // Let the selection sound register before same-tab navigation unloads it.
      window.setTimeout(() => window.location.assign(link.href), soundEnabled ? 180 : 0);
      return;
    }
    window.location.assign(link.href);
  });

  let pendingPageStep = 0;
  let pendingPageTimer = 0;
  function requestPageStep(direction) {
    pendingPageStep = direction;
    window.clearTimeout(pendingPageTimer);
    const expiresAt = performance.now() + 2500;
    const attempt = () => {
      if (performance.now() > expiresAt) { pendingPageStep = 0; return; }
      if (drawer.open || document.querySelector("#experience-dialog[open]")) {
        pendingPageStep = 0; return;
      }
      if (isTurning || mobileSwipeState || libraryTurnState?.pointerId != null) {
        pendingPageTimer = window.setTimeout(attempt, 60);
        return;
      }
      const step = pendingPageStep;
      pendingPageStep = 0;
      if (step) turnTo(currentPage + step, step);
    };
    attempt();
  }
  prevButton.addEventListener("click", () => requestPageStep(-1));
  nextButton.addEventListener("click", () => requestPageStep(1));
  drawerClose.addEventListener("click", () => drawer.close());
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) drawer.close();
  });
  document.addEventListener("click", (event) => {
    if (event.target.matches("#experience-dialog")) {
      playPageSound(-1, 0.52);
      event.target.close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (drawer.open || document.querySelector("#experience-dialog[open]")) return;
    const workTab = event.target.closest("[data-work-tab]");
    if (workTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const tabs = [...workTab.closest('[role="tablist"]').querySelectorAll("[data-work-tab]")];
      const currentIndex = tabs.indexOf(workTab);
      const targetIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      activateWorkCase(tabs[targetIndex].dataset.workTab, { focusTab: true });
      return;
    }
    const learnDetail = document.querySelector(".learn-detail:not([hidden])");
    if (learnDetail) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLearnSection();
      }
      return;
    }
    if (event.key === "ArrowLeft") turnTo(currentPage - 1, -1);
    if (event.key === "ArrowRight") turnTo(currentPage + 1, 1);
  });

  // Safari can suspend or interrupt Web Audio after a tab/app switch. Resume
  // on return when possible, then renew the unlock on the next trusted input.
  document.addEventListener("pointerdown", recoverSoundFromUserGesture, { capture: true, passive: true });
  document.addEventListener("keydown", recoverSoundFromUserGesture, { capture: true });
  document.addEventListener("visibilitychange", recoverSoundAfterVisibilityChange);
  window.addEventListener("pageshow", recoverSoundAfterVisibilityChange);

  book.addEventListener("pointerdown", beginPageDrag);
  book.addEventListener("pointermove", movePageDrag);
  book.addEventListener("pointerup", (event) => endPageDrag(event));
  book.addEventListener("pointercancel", (event) => endPageDrag(event, true));

  bookStage.addEventListener("pointermove", updatePerspective, { passive: true });
  bookStage.addEventListener("pointerleave", resetPerspective);

  render();
  restoreReaderPosition();
  if (!reducedMotion()) {
    book.classList.add("is-arriving");
    window.setTimeout(() => book.classList.remove("is-arriving"), 900);
  }
})();
