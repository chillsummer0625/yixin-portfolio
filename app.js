(() => {
  const data = window.SITE_DATA;
  const book = document.querySelector("#book");
  const bookStage = document.querySelector(".book-stage");
  const bookContent = document.querySelector("#book-content");
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
  let touchStartX = 0;
  let perspectiveFrame = 0;
  let lastObjectHoverAt = 0;
  let lastObjectHoverKey = "";
  const soundFiles = {
    hover: "assets/object-hover.wav",
    select: "assets/object-select.wav",
    page: "assets/page-turn.wav"
  };
  const soundTemplates = new Map();

  const content = () => data[language];
  const pageIndex = (key) => pageKeys.indexOf(key);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const certificatePdfPath = encodeURI("奖状汇总最终版_副本.pdf");

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
          <button type="button" class="tool-button" data-action="language">${t.common.language}</button>
          <button type="button" class="tool-button tool-button--sound" data-action="sound" aria-pressed="${soundEnabled}">
            <span class="sound-dot" aria-hidden="true"></span>
            ${soundEnabled ? t.common.soundOn : t.common.soundOff}
          </button>
          <button type="button" class="tool-button tool-button--resume" data-action="resume">${t.common.resume}</button>
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

          <div class="book-gutter" aria-hidden="true"></div>
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
          <span class="learn-book__dot" aria-hidden="true"></span>
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
          <p class="chapter-label">${t.closing.kicker}</p>
          <h1 tabindex="-1">${t.closing.title}</h1>
          <p class="closing-body">${t.closing.body}</p>
          <p class="closing-signoff">${t.closing.signoff}</p>
          <div class="closing-actions">
            <a class="primary-action" href="mailto:${t.resume.email}">${t.closing.emailLabel}<span aria-hidden="true">↗</span></a>
            <button class="secondary-action" type="button" data-action="resume">${t.closing.resumeLabel}</button>
          </div>
          <p class="closing-meta">Yixin Cui · 2026</p>
        </div>
      </article>`;
  }

  const renderers = [coverPage, roomPage, learnPage, workPage, createPage, closingPage];

  function resumeMarkup() {
    const t = content();
    const highlights = t.resume.highlights.map((item) => `<li>${item}</li>`).join("");
    return `
      <p class="drawer-eyebrow">${t.resume.eyebrow}</p>
      <h2 id="resume-title">${t.resume.title}</h2>
      <p class="drawer-subtitle">${t.resume.subtitle}</p>
      <p class="drawer-summary">${t.resume.summary}</p>
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

  function render({ focusHeading = false } = {}) {
    const t = content();
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.meta.title;
    book.dataset.currentPage = pageKeys[currentPage];
    bookContent.innerHTML = renderers[currentPage]();
    resumeContent.innerHTML = resumeMarkup();
    updateReaderControls();
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

  function playLocalSound(name, volume = 1, playbackRate = 1) {
    if (!soundEnabled || !soundFiles[name]) return;
    let template = soundTemplates.get(name);
    if (!template) {
      template = document.createElement("audio");
      template.src = soundFiles[name];
      template.preload = "auto";
      soundTemplates.set(name, template);
    }
    const player = template.cloneNode(true);
    player.volume = Math.max(0, Math.min(1, volume));
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

  function turnTo(target, explicitDirection) {
    const targetIndex = typeof target === "number" ? target : pageIndex(target);
    if (targetIndex < 0 || targetIndex >= pageKeys.length || targetIndex === currentPage || isTurning) return;
    const direction = explicitDirection || (targetIndex > currentPage ? 1 : -1);
    const duration = reducedMotion() ? 0 : (window.matchMedia("(max-width: 820px)").matches ? 420 : 520);
    isTurning = true;
    playPageSound(direction);
    book.classList.add(direction > 0 ? "is-turning-next" : "is-turning-prev");
    window.setTimeout(() => {
      currentPage = targetIndex;
      render({ focusHeading: true });
      book.classList.remove("is-turning-next", "is-turning-prev");
      isTurning = false;
    }, duration);
  }

  function updatePerspective(event) {
    if (reducedMotion() || window.matchMedia("(max-width: 820px)").matches) return;
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
    language = language === "en" ? "zh" : "en";
    localStorage.setItem("yixin-language", language);
    render();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) playPageSound(1, 0.42);
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

  book.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  book.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 55) return;
    turnTo(currentPage + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
  }, { passive: true });

  bookStage.addEventListener("pointermove", updatePerspective, { passive: true });
  bookStage.addEventListener("pointerleave", resetPerspective);

  render();
  if (!reducedMotion()) {
    book.classList.add("is-arriving");
    window.setTimeout(() => book.classList.remove("is-arriving"), 900);
  }
})();
