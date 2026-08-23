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
  let language = localStorage.getItem("yixin-language") || "en";
  // The room is the portfolio's homepage. The cover remains available as a
  // previous page once the full book flow is expanded.
  let currentPage = 1;
  let soundEnabled = false;
  let isTurning = false;
  let turnState = null;
  let libraryTurnState = null;
  let mobileSwipeState = null;
  let turnAnimationFrame = 0;
  let turnRenderFrame = 0;
  let perspectiveFrame = 0;
  let lastObjectHoverAt = 0;
  let lastObjectHoverKey = "";
  const soundFiles = {
    hover: "assets/object-hover.wav?v=20260822b",
    select: "assets/object-select.wav?v=20260822b",
    page: "assets/page-turn.wav"
  };
  const soundGain = 1.6;
  const soundTypeGain = {
    hover: 1.55,
    select: 1.35,
    page: 1
  };
  const soundTemplates = new Map();
  const soundBuffers = new Map();
  const soundBufferPromises = new Map();
  let soundContext = null;

  const content = () => data[language];
  const pageIndex = (key) => pageKeys.indexOf(key);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileLayout = () => window.matchMedia("(max-width: 820px)").matches;
  const certificatePdfPath = encodeURI("奖状汇总最终版_副本.pdf");
  const pageCrease = (extraClass = "") => `<div class="page-crease${extraClass ? ` ${extraClass}` : ""}" aria-hidden="true"></div>`;

  function toolbar(active) {
    const t = content();
    const navItem = (key, label) => `
      <button class="chapter-nav__item ${active === key ? "is-active" : ""}" type="button" data-page="${key}" ${active === key ? 'aria-current="page"' : ""}>
        ${label}
      </button>`;

    return `
      <header class="book-toolbar">
        <button class="wordmark" type="button" data-page="room" aria-label="${t.common.name}: home">
          ${t.common.name}
        </button>
        <nav class="chapter-nav" aria-label="Portfolio chapters">
          ${navItem("learn", t.common.learn)}
          ${navItem("work", t.common.work)}
          ${navItem("create", t.common.create)}
        </nav>
        <div class="book-tools">
          <button type="button" class="tool-button tool-button--language" data-action="language">${t.common.language}</button>
          <button type="button" class="tool-button tool-button--sound" data-action="sound" aria-pressed="${soundEnabled}" aria-label="${soundEnabled ? t.common.soundOn : t.common.soundOff}">
            <span class="sound-dot" aria-hidden="true"></span>
            <span class="tool-button__desktop-label">${soundEnabled ? t.common.soundOn : t.common.soundOff}</span>
            <span class="tool-button__mobile-label" aria-hidden="true">${language === "zh" ? "声音" : "Sound"}</span>
          </button>
          <button type="button" class="tool-button tool-button--resume" data-page="closing">${t.common.resume}</button>
        </div>
      </header>`;
  }

  function coverPage() {
    const t = content();
    return `
      <article class="cover-page page-surface" data-page-key="cover">
        <div class="cover-noise" aria-hidden="true"></div>
        <p class="cover-kicker">${t.cover.kicker}</p>
        <div class="cover-title-group">
          <h1 tabindex="-1">${t.cover.title.replace("\n", "<br>")}</h1>
          <p class="cover-subtitle">${t.cover.subtitle}</p>
        </div>
        <div class="cover-figure" aria-hidden="true">
          <span class="cover-figure__orbit"></span>
          <span class="cover-figure__one">L</span>
          <span class="cover-figure__two">W</span>
          <span class="cover-figure__three">C</span>
        </div>
        <p class="cover-note">${t.cover.note}</p>
        <button class="open-book" type="button" data-page="room">
          <span>${t.cover.action}</span>
          <span aria-hidden="true">→</span>
        </button>
        <p class="cover-spine-copy" aria-hidden="true">YIXIN CUI · DIFFERENT SIDES OF ME · 2026</p>
      </article>`;
  }

  function roomPage() {
    const t = content();
    const objects = t.room.objects;
    const objectButton = (key, className) => `
      <button class="object-hotspot object-hotspot--${className} object-hotspot--${objects[key].tone}" type="button" data-object="${key}" aria-label="${objects[key].label}">
        <span class="object-hotspot__dot" aria-hidden="true"></span>
        <span class="object-hotspot__label">${objects[key].label}</span>
      </button>`;
    return `
      <article class="room-page page-surface" data-page-key="room">
        ${toolbar("room")}
        <div class="room-scene">
          <div class="room-art-stage">
            <img class="room-art" src="assets/homepage-room-v12.png" alt="A luminous animated visual CV: Yixin studies beside an HKU wall crest, NUAA and Crete archive and a fashion-illustrated campus involvement group portrait, works among SUMEC trade materials, China Daily pages and China Eastern broadcast-training notes, and creates beside collage work and an HKU Compass screen." />
            <img class="room-object-clean-sprite room-object-clean-sprite--crete" src="assets/object-clean-crete.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--hku" src="assets/object-clean-hku-v2.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--campus" src="assets/object-clean-campus.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--nuaa" src="assets/object-clean-nuaa.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--awards" src="assets/object-clean-awards.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--sumec" src="assets/object-clean-sumec.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--chinaDaily" src="assets/object-clean-china-daily.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--broadcast" src="assets/object-clean-broadcast.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--eastern" src="assets/object-clean-eastern.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--collage" src="assets/object-clean-collage.png" alt="" aria-hidden="true" />
            <img class="room-object-clean-sprite room-object-clean-sprite--hkuCompass" src="assets/object-clean-hku-compass.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--crete" src="assets/object-crete.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--hku" src="assets/object-hku-v2.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--campus" src="assets/object-campus.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--nuaa" src="assets/object-nuaa.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--awards" src="assets/object-awards.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--sumec" src="assets/object-sumec.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--chinaDaily" src="assets/object-china-daily.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--broadcast" src="assets/object-broadcast.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--eastern" src="assets/object-eastern.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--collage" src="assets/object-collage.png" alt="" aria-hidden="true" />
            <img class="room-object-sprite room-object-sprite--hkuCompass" src="assets/object-hku-compass.png" alt="" aria-hidden="true" />
            <div class="room-atmosphere room-atmosphere--sun" aria-hidden="true"></div>
            <div class="room-atmosphere room-atmosphere--dust" aria-hidden="true"></div>
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

          <button class="character-hotspot character-hotspot--student" type="button" data-page="learn" aria-label="${t.room.student.label}: ${t.room.student.hint}">
            <strong>${t.room.student.label}</strong>
            <span class="character-hotspot__line">${t.room.student.line}</span>
            <span class="character-hotspot__hint">${t.room.student.hint}</span>
            <span class="character-hotspot__arrow" aria-hidden="true">↗</span>
          </button>
          <button class="character-hotspot character-hotspot--professional" type="button" data-page="work" aria-label="${t.room.professional.label}: ${t.room.professional.hint}">
            <strong>${t.room.professional.label}</strong>
            <span class="character-hotspot__line">${t.room.professional.line}</span>
            <span class="character-hotspot__hint">${t.room.professional.hint}</span>
            <span class="character-hotspot__arrow" aria-hidden="true">↗</span>
          </button>
          <button class="character-hotspot character-hotspot--creator" type="button" data-page="create" aria-label="${t.room.creator.label}: ${t.room.creator.hint}">
            <strong>${t.room.creator.label}</strong>
            <span class="character-hotspot__line">${t.room.creator.line}</span>
            <span class="character-hotspot__hint">${t.room.creator.hint}</span>
            <span class="character-hotspot__arrow" aria-hidden="true">↗</span>
          </button>

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
    const t = content();
    return learnDetailLink(markup, `${certificatePdfPath}#page=${pageNumber}`, t.common.openCertificate, inline);
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
          <span class="learn-book__rules learn-book__rules--top" aria-hidden="true"></span>
          <span class="learn-book__title">${section.title}</span>
          <span class="learn-book__ornament" aria-hidden="true"></span>
          <span class="learn-book__rules learn-book__rules--bottom" aria-hidden="true"></span>
          <span class="visually-hidden">${section.preview}</span>
        </button>
      </li>`).join("");
    const detailPages = sections.map((section) => `
      <section class="learn-detail__page" data-learn-detail="${section.key}" hidden>
        <p class="learn-detail__kicker">${section.kicker}</p>
        <h2 id="learn-detail-title-${section.key}" tabindex="-1">${section.title}</h2>
        ${section.note ? `<p class="learn-detail__list-note">${section.note}</p>` : ""}
        <ul class="learn-detail__items${section.note ? " learn-detail__items--with-note" : ""}">
          ${section.details.map((detail) => `<li>${renderLearnDetail(detail)}</li>`).join("")}
        </ul>
      </section>`).join("");

    return `
      <article class="chapter-page chapter-page--learn page-surface" data-page-key="learn">
        ${toolbar("learn")}
        <h1 class="visually-hidden" tabindex="-1">${t.learn.title}</h1>
        <div class="learn-shell">
          <section class="learn-index-panel" aria-label="${t.learn.sectionListLabel}">
            <p class="learn-archive-heading" aria-hidden="true">${t.learn.sectionListLabel}</p>
            <ul class="learn-section-list">
              ${sectionBooks}
            </ul>
            <div class="learn-detail" id="learn-detail-panel" role="region" hidden>
              <button class="learn-detail__close" type="button" data-action="close-learn-detail" aria-label="${t.learn.closeDetail}">×</button>
              ${detailPages}
            </div>
          </section>
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
        <section class="work-case-column" aria-labelledby="work-moved-${item.key}">
          <h3 id="work-moved-${item.key}">${movedHeading(item)}</h3>
          <ul>${item.moved.map(workDetailItem).join("")}</ul>
        </section>
      </div>
      <footer class="work-evidence">
        <p>${t.work.evidenceTitle}</p>
        <div>${item.evidence.map(evidenceLink).join("")}</div>
        ${item.evidenceNote ? `<small>${item.evidenceNote}</small>` : `<small>${t.work.publicEvidenceNote}</small>`}
      </footer>`;
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
          <div><h2>${item.company}</h2><p>${item.role}</p></div>
          <time>${item.date}</time>
        </header>
        ${process(item.process)}
        ${standardPanel(item)}
      </section>`).join("");

    return `
      <article class="chapter-page chapter-page--work page-surface" data-page-key="work" data-active-work-case="sumec">
        ${toolbar("work")}
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
    const guide = t.create.digitalProjects[0];
    const proof = t.create.stats.map((item) => `${item[0]} ${item[1]}`).join(" · ");
    const creatorStats = t.create.stats.map((item) => `
      <span class="create-stat">
        <strong>${item[0]}</strong>
        <small>${item[1]}</small>
      </span>`).join("");
    const desktopWorks = t.create.works.map((item, index) => `
      <a
        class="create-artwork-hotspot create-artwork-hotspot--${index + 1}"
        href="${item.url}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${item.title} — ${t.create.openWork}"
        data-create-work="${index}"
      >
        <img src="${item.image}" alt="${item.alt}" loading="lazy" />
        <span class="create-hotspot-label">
          <span class="create-hotspot-copy">
            <strong>${item.title}</strong>
            <span>${t.create.openWork} ↗</span>
          </span>
          <small class="create-work-engagement">${item.engagement.join(" · ")}</small>
        </span>
      </a>`).join("");
    const mobileWorks = t.create.works.map((item, index) => `
      <a class="create-mobile-work create-mobile-work--${index + 1}" href="${item.url}" target="_blank" rel="noopener noreferrer" data-create-work="${index}">
        <img src="${item.image}" alt="${item.alt}" loading="lazy" />
        <span><strong>${item.title}</strong><small class="create-work-engagement">${item.engagement.join(" · ")}</small><small>${t.create.openWork} ↗</small></span>
      </a>`).join("");

    return `
      <article class="chapter-page chapter-page--create page-surface" data-page-key="create">
        ${toolbar("create")}
        <h1 class="visually-hidden" tabindex="-1">${t.create.title}</h1>

        <div class="create-archive" aria-label="${t.create.title}">
          <section class="create-studio" aria-labelledby="create-content-title">
            <p class="create-archive__label">${t.create.archiveLabel}</p>
            <div class="create-studio__heading">
              <div class="create-content-index create-index-block">
                <a class="create-profile-sign" href="${t.create.profileUrl}" target="_blank" rel="noopener noreferrer" aria-label="${t.create.wallTitle} — ${t.create.profileLabel}">
                  <span id="create-content-title">${t.create.wallTitle}<b aria-hidden="true">↗</b></span>
                </a>
                <div class="create-stats" aria-label="${proof}">${creatorStats}</div>
              </div>
              <section class="create-vibe-index create-index-block" aria-labelledby="create-vibe-title">
                <p id="create-vibe-title">${t.create.digitalTitle}</p>
                <div class="create-vibe-row">
                  <a class="create-vibe-main" href="${featuredProject.url}" target="_blank" rel="noopener noreferrer" aria-label="${featuredProject.title} — ${featuredProject.action}">
                    <img src="${featuredProject.image}" alt="${featuredProject.alt}" loading="lazy" />
                    <span>
                      <small>${featuredProject.tag}</small>
                      <strong>${featuredProject.title}<b aria-hidden="true">↗</b></strong>
                    </span>
                  </a>
                  <a class="create-vibe-guide" href="${guide.url}" target="_blank" rel="noopener noreferrer">
                    <span>${guide.title}</span><b aria-hidden="true">↗</b>
                  </a>
                </div>
              </section>
            </div>
            <div class="create-gallery">${desktopWorks}</div>
          </section>

          <figure class="create-maker">
            <img
              class="create-maker__art"
              src="assets/create-portrait-v2.png"
              alt="Yixin creating beside an illustrated HKU Compass canvas at sunset."
            />
            <div class="create-maker__light" aria-hidden="true"></div>
          </figure>
          <p class="visually-hidden">${proof}. ${t.create.lede}</p>
        </div>

        <div class="create-mobile-archive">
          <figure class="create-mobile-scene">
            <img src="assets/create-portrait-v2.png" alt="Yixin creating beside an illustrated HKU Compass canvas at sunset." />
          </figure>
          <section class="create-mobile-section" aria-labelledby="create-mobile-content-title">
            <div class="create-mobile-heading">
              <div>
                <p>${t.create.chapter}</p>
                <h2 id="create-mobile-content-title"><a href="${t.create.profileUrl}" target="_blank" rel="noopener noreferrer" aria-label="${t.create.wallTitle} — ${t.create.profileLabel}">${t.create.wallTitle}<span aria-hidden="true">↗</span></a></h2>
              </div>
            </div>
            <div class="create-mobile-works">${mobileWorks}</div>
          </section>
          <section class="create-mobile-section create-mobile-vibe" aria-labelledby="create-mobile-vibe-title">
            <div class="create-mobile-heading"><div><p>${t.create.chapter}</p><h2 id="create-mobile-vibe-title">${t.create.digitalTitle}</h2></div></div>
            <a class="create-mobile-feature" href="${featuredProject.url}" target="_blank" rel="noopener noreferrer">
              <img src="${featuredProject.image}" alt="${featuredProject.alt}" loading="lazy" />
              <span><small>${featuredProject.tag}</small><strong>${featuredProject.title}</strong><b>${featuredProject.action} ↗</b></span>
            </a>
            <a class="create-mobile-guide" href="${guide.url}" target="_blank" rel="noopener noreferrer">
              <span><small>${guide.tag}</small><strong>${guide.title}</strong><span>${guide.body}</span></span><b aria-hidden="true">↗</b>
            </a>
            <p class="create-mobile-proof">${proof}</p>
          </section>
        </div>
        ${pageCrease()}
      </article>`;
  }

  function closingPage() {
    const t = content();
    return `
      <article class="closing-page page-surface" data-page-key="closing">
        ${toolbar("closing")}
        <div class="closing-inner">
          <div class="closing-orbit" aria-hidden="true">
            <span>LEARN</span><span>WORK</span><span>CREATE</span>
          </div>
          ${t.closing.kicker ? `<p class="chapter-label">${t.closing.kicker}</p>` : ""}
          <h1 tabindex="-1">${t.closing.title}</h1>
          <p class="closing-body">${t.closing.body}</p>
          <p class="closing-signoff">${t.closing.signoff}</p>
          <div class="closing-actions">
            <a class="primary-action" href="mailto:${t.resume.email}">${t.closing.emailLabel}<span aria-hidden="true">↗</span></a>
            <button class="secondary-action" type="button" data-action="resume">${t.closing.resumeLabel}</button>
          </div>
          <p class="closing-meta">Yixin Cui</p>
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
    const highlights = t.resume.highlights.map((item) => `<li>${item}</li>`).join("");
    const linkGroups = t.resume.linkGroups.map((group) => `
      <div class="drawer-link-group">
        <p>${group.label}</p>
        <div>${group.links.map((link) => `<a class="drawer-highlight-link" href="${link.href}" target="_blank" rel="noopener noreferrer">${link.label}<span aria-hidden="true">↗</span></a>`).join("")}</div>
      </div>`).join("");
    return `
      <p class="drawer-eyebrow">${t.resume.eyebrow}</p>
      <h2 id="resume-title">${t.resume.title}</h2>
      <p class="drawer-subtitle">${t.resume.subtitle}</p>
      <p class="drawer-summary">${t.resume.summary}</p>
      <div class="drawer-facts">
        <p>${t.resume.proficiency}</p>
      </div>
      <div class="drawer-link-groups">${linkGroups}</div>
      <p class="drawer-section-label">${t.resume.experienceLabel}</p>
      <ul class="drawer-highlights">${highlights}</ul>
      <div class="drawer-actions">
        <a class="primary-action" href="assets/Cui-Yixin-CV.pdf" target="_blank" rel="noreferrer">${t.resume.download}<span aria-hidden="true">↓</span></a>
        <a class="drawer-email" href="mailto:${t.resume.email}">${t.resume.email}</a>
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

  function render({ focusHeading = false, reuseContent = false } = {}) {
    const t = content();
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.meta.title;
    book.dataset.currentPage = pageKeys[currentPage];
    if (!reuseContent) {
      bookContent.replaceChildren(clonedPage(currentPage));
      resumeContent.innerHTML = resumeMarkup();
    }
    updateReaderControls();
    schedulePageWarmup();
    if (focusHeading) {
      requestAnimationFrame(() => bookContent.querySelector("h1")?.focus({ preventScroll: true }));
    }
  }

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
      soundTemplates.set(name, template);
    }
    return template;
  }

  function ensureSoundContext() {
    if (soundContext) return soundContext;
    const SoundContext = window.AudioContext || window.webkitAudioContext;
    if (!SoundContext) return null;
    try {
      soundContext = new SoundContext({ latencyHint: "interactive" });
    } catch (_) {
      soundContext = new SoundContext();
    }
    return soundContext;
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
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        soundBuffers.set(name, buffer);
        return buffer;
      })
      .catch(() => null);
    soundBufferPromises.set(name, request);
    return request;
  }

  function warmSoundEngine() {
    const context = ensureSoundContext();
    if (context?.state === "suspended") void context.resume().catch(() => {});
    Object.keys(soundFiles).forEach((name) => {
      ensureSoundTemplate(name).load();
      void primeSoundBuffer(name);
    });
  }

  function playBufferedSound(name, volume, playbackRate) {
    const context = ensureSoundContext();
    const buffer = soundBuffers.get(name);
    if (!context || !buffer) return false;
    if (context.state === "suspended") void context.resume().catch(() => {});
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gain.gain.value = soundVolume(name, volume);
    source.connect(gain).connect(context.destination);
    document.documentElement.dataset.soundPlayback = `${name}:started:buffered`;
    source.addEventListener("ended", () => {
      document.documentElement.dataset.soundPlayback = `${name}:ended:buffered`;
      source.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start(0);
    return true;
  }

  function playLocalSound(name, volume = 1, playbackRate = 1) {
    if (!soundEnabled || !soundFiles[name]) return;
    if (playBufferedSound(name, volume, playbackRate)) return;
    void primeSoundBuffer(name);
    const template = ensureSoundTemplate(name);
    const player = template.cloneNode(true);
    player.volume = soundVolume(name, volume);
    player.playbackRate = playbackRate;
    player.dataset.portfolioSound = name;
    player.hidden = true;
    document.body.append(player);
    document.documentElement.dataset.soundPlayback = `${name}:requested`;
    player.addEventListener("ended", () => {
      document.documentElement.dataset.soundPlayback = `${name}:ended`;
      player.remove();
    }, { once: true });
    player.play()
      .then(() => { document.documentElement.dataset.soundPlayback = `${name}:started`; })
      .catch((error) => {
        document.documentElement.dataset.soundPlayback = `${name}:blocked:${error.name}`;
        player.remove();
      });
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

  function playWorkTabHoverSound(key) {
    if (!soundEnabled) return;
    const hoverKey = `work-tab:${key}`;
    const now = performance.now();
    if (hoverKey === lastObjectHoverKey && now - lastObjectHoverAt < 180) return;
    lastObjectHoverKey = hoverKey;
    lastObjectHoverAt = now;
    const tabTones = {
      sumec: 0.84,
      "china-daily": 0.9,
      "creator-campaigns": 0.96,
      "sichuan-rtv": 1.02,
      "chengdu-rtv": 1.08,
      "china-eastern": 1.14
    };
    playLocalSound("hover", 0.38, tabTones[key] || 0.98);
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

  function pageFlipHalf(index, side) {
    const page = document.createElement("div");
    const surface = document.createElement("div");
    const pageClone = clonedPage(index).firstElementChild;
    page.className = `page-flip__page page-flip__page--${side}`;
    surface.className = `page-flip__surface page-flip__surface--${side} book-content`;
    page.setAttribute("aria-hidden", "true");
    pageClone.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
    pageClone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    pageClone.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((element) => {
      element.tabIndex = -1;
    });
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
    if (!libraryFlipSupported() || targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage) return false;
    if (libraryTurnState) disposeLibraryTurn();

    const bounds = book.getBoundingClientRect();
    const root = document.createElement("div");
    const sourceOrder = direction > 0
      ? [[currentPage, "left"], [currentPage, "right"], [targetIndex, "left"], [targetIndex, "right"]]
      : [[targetIndex, "left"], [targetIndex, "right"], [currentPage, "left"], [currentPage, "right"]];
    const pages = sourceOrder.map(([index, side]) => pageFlipHalf(index, side));
    const startPage = direction > 0 ? 0 : 2;
    const destinationPage = direction > 0 ? 2 : 0;

    root.className = "page-flip-engine";
    root.dataset.direction = direction > 0 ? "next" : "prev";
    root.setAttribute("aria-hidden", "true");
    book.append(root);

    const instance = new window.St.PageFlip(root, {
      width: Math.max(1, Math.round(bounds.width / 2)),
      height: Math.max(1, Math.round(bounds.height)),
      size: "stretch",
      minWidth: 100,
      maxWidth: 2400,
      minHeight: 100,
      maxHeight: 1800,
      startPage,
      flippingTime: 620,
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

  function turnTo(target, explicitDirection) {
    const targetIndex = typeof target === "number" ? target : pageIndex(target);
    if (targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage || isTurning || mobileSwipeState) return;
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
    if (isTurning || drawer.open || document.querySelector("#experience-dialog[open]")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("a, button, input, select, textarea, dialog, [role='tab'], [contenteditable='true']")) return;

    if (mobileLayout()) {
      beginMobileSwipe(event);
      return;
    }

    if (reducedMotion()) return;

    if (libraryFlipSupported()) {
      const bounds = book.getBoundingClientRect();
      const direction = event.clientX >= bounds.left + bounds.width / 2 ? 1 : -1;
      const targetIndex = currentPage + direction;
      if (!prepareLibraryTurn(targetIndex, direction)) return;
      libraryTurnState.pointerId = event.pointerId;
      libraryTurnState.dragStartX = event.clientX;
      libraryTurnState.dragStartY = event.clientY;
      book.classList.add("is-library-grabbed");
      libraryTurnState.instance.startUserTouch({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
      const activeState = libraryTurnState;
      activeState.holdTimer = window.setTimeout(() => {
        if (libraryTurnState !== activeState || activeState.dragMoved) return;
        activeState.holdLifted = true;
        activeState.instance.userMove({
          x: activeState.dragStartX - bounds.left + (direction > 0 ? -10 : 10),
          y: activeState.dragStartY - bounds.top
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
    if (mobileSwipeState) {
      moveMobileSwipe(event);
      return;
    }
    if (libraryTurnState?.pointerId === event.pointerId) {
      const bounds = book.getBoundingClientRect();
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
    if (mobileSwipeState) {
      endMobileSwipe(event, cancelled);
      return;
    }
    if (libraryTurnState?.pointerId === event.pointerId) {
      const state = libraryTurnState;
      window.clearTimeout(state.holdTimer);
      window.cancelAnimationFrame(state.moveFrame);
      try { book.releasePointerCapture?.(event.pointerId); } catch (_) { /* Pointer may already be released. */ }
      if (!state.dragMoved && !state.holdLifted) {
        disposeLibraryTurn();
        isTurning = false;
        return;
      }
      const bounds = book.getBoundingClientRect();
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
    if (turnState || libraryTurnState?.started || reducedMotion() || window.matchMedia("(max-width: 820px)").matches) return;
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

  function toggleLanguage() {
    disposeLibraryTurn();
    language = language === "en" ? "zh" : "en";
    localStorage.setItem("yixin-language", language);
    resetPageCaches();
    render();
  }

  function toggleSound() {
    disposeLibraryTurn();
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      warmSoundEngine();
      playPageSound(1, 0.42);
    }
    resetPageCaches();
    render();
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
    dialog.querySelector("#experience-dialog-meta").textContent = item.meta;
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
      window.setTimeout(() => targetPage.querySelector("h2")?.focus({ preventScroll: true }), reducedMotion() ? 0 : 220);
    });
  }

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
    playLocalSound("select", 0.42, 1.06);
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

    const workTab = event.target.closest("[data-work-tab]");
    if (workTab && !workTab.contains(event.relatedTarget)
      && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      playWorkTabHoverSound(workTab.dataset.workTab);
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

    const workTab = event.target.closest("[data-work-tab]");
    if (workTab && window.matchMedia("(min-width: 821px)").matches) {
      playWorkTabHoverSound(workTab.dataset.workTab);
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

  document.addEventListener("click", (event) => {
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
      if (objectControl.classList.contains("is-activating")) return;
      setActiveRoomObject(objectControl.dataset.object);
      objectControl.classList.add("is-activating");
      playObjectSelectSound(objectControl.dataset.object);
      const revealDelay = reducedMotion() ? 0 : 180;
      window.setTimeout(() => {
        openExperience(objectControl.dataset.object);
        objectControl.classList.remove("is-activating");
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
    if (actionControl.dataset.action === "language") toggleLanguage();
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
    window.location.assign(link.href);
  });

  prevButton.addEventListener("click", () => turnTo(currentPage - 1, -1));
  nextButton.addEventListener("click", () => turnTo(currentPage + 1, 1));
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

  book.addEventListener("pointerdown", beginPageDrag);
  book.addEventListener("pointermove", movePageDrag);
  book.addEventListener("pointerup", (event) => endPageDrag(event));
  book.addEventListener("pointercancel", (event) => endPageDrag(event, true));

  bookStage.addEventListener("pointermove", updatePerspective, { passive: true });
  bookStage.addEventListener("pointerleave", resetPerspective);

  render();
  if (!reducedMotion()) {
    book.classList.add("is-arriving");
    window.setTimeout(() => book.classList.remove("is-arriving"), 900);
  }
})();
