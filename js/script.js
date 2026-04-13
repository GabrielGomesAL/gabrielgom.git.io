const root = document.documentElement;
const body = document.body;
const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = document.querySelectorAll("[data-reveal]");
const sections = document.querySelectorAll("main section[id]");
const scrollProgressBar = document.querySelector(".scroll-progress span");
const languageButtons = Array.from(document.querySelectorAll(".language-option"));
const skillFilters = document.querySelectorAll(".skill-filter");
const skillItems = document.querySelectorAll(".skill-item");
const activeFilterLabel = document.getElementById("active-filter-label");
const activeFilterCopy = document.getElementById("active-filter-copy");
const visibleSkillCount = document.getElementById("visible-skill-count");
const systemStage = document.querySelector(".system-stage");
const projectsGrid = document.getElementById("projects-grid");
const projectsStatus = document.getElementById("projects-status");
const pageTitle = document.querySelector("title");
const pageDescription = document.querySelector('meta[name="description"]');
const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");

const DEFAULT_LANGUAGE = "pt";
const LANGUAGE_STORAGE_KEY = "gabriel-portfolio-language";
const githubUsername = "GabrielGomesAL";
const preferredRepoOrder = [
    "reconhecimento-voz-transcribe",
    "backend",
    "quickdraw-teste",
    "network-configurator",
    "gabrielgom.git.io",
    "faculdade-betoneira"
];

const localeByLanguage = {
    pt: "pt-BR",
    en: "en-US",
    es: "es-ES"
};

const htmlLangByLanguage = {
    pt: "pt-BR",
    en: "en",
    es: "es"
};

const i18n = window.PORTFOLIO_I18N || {
    static: {},
    dynamic: {},
    repoHighlights: {}
};

let revealObserver = null;
let currentLanguage = DEFAULT_LANGUAGE;
let currentSkillCategory = "all";
let cachedRepos = [];
let projectState = {
    mode: "idle",
    count: 0
};

const baseStaticTranslations = captureBaseStaticTranslations();

function captureBaseStaticTranslations() {
    const captured = {};

    document.querySelectorAll("[data-i18n]").forEach((node) => {
        captured[node.dataset.i18n] = node.textContent.trim();
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
        captured[node.dataset.i18nHtml] = node.innerHTML.trim();
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
        captured[node.dataset.i18nAriaLabel] = node.getAttribute("aria-label");
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
        captured[node.dataset.i18nAlt] = node.getAttribute("alt");
    });

    return captured;
}

function escapeHtml(value = "") {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function resolveTranslationKey(source, key) {
    return key.split(".").reduce((value, part) => {
        if (value === undefined || value === null) {
            return undefined;
        }

        return value[part];
    }, source);
}

function getDynamicTranslation(key) {
    return resolveTranslationKey(i18n.dynamic[currentLanguage], key);
}

function getStaticTranslation(key) {
    if (currentLanguage === DEFAULT_LANGUAGE) {
        return baseStaticTranslations[key];
    }

    return i18n.static[currentLanguage]?.[key];
}

function formatTemplate(template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, token) => values[token] ?? "");
}

function getLocale() {
    return localeByLanguage[currentLanguage] || localeByLanguage[DEFAULT_LANGUAGE];
}

function getInitialLanguage() {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored && (stored === "pt" || i18n.static[stored])) {
            return stored;
        }
    } catch (error) {
        // Ignore storage errors.
    }

    return DEFAULT_LANGUAGE;
}

function persistLanguage(language) {
    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        // Ignore storage errors.
    }
}

function setPointerGlow(event) {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    root.style.setProperty("--pointer-x", `${x}%`);
    root.style.setProperty("--pointer-y", `${y}%`);
}

function setHeaderState() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function updateScrollProgress() {
    if (!scrollProgressBar) {
        return;
    }

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight <= 0
        ? 0
        : Math.min(window.scrollY / scrollableHeight, 1);

    root.style.setProperty("--scroll-progress", `${progress * 100}%`);
}

function toggleMenu(forceOpen) {
    if (!nav || !menuToggle) {
        return;
    }

    const isOpen = typeof forceOpen === "boolean"
        ? forceOpen
        : !nav.classList.contains("is-open");

    nav.classList.toggle("is-open", isOpen);
    menuToggle.classList.toggle("is-active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function setupMenu() {
    if (!menuToggle || !nav) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        toggleMenu();
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 820) {
                toggleMenu(false);
            }
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 820) {
            toggleMenu(false);
        }
    });
}

function setupReveal() {
    if (!("IntersectionObserver" in window) || mediaQuery.matches) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px"
    });

    observeRevealTargets(revealItems);
}

function observeRevealTargets(targets) {
    Array.from(targets || []).forEach((item) => {
        if (item.classList.contains("is-visible")) {
            return;
        }

        if (!revealObserver || mediaQuery.matches || !("IntersectionObserver" in window)) {
            item.classList.add("is-visible");
            return;
        }

        revealObserver.observe(item);
    });
}

function updateActiveLink(targetId) {
    navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${targetId}`;
        link.classList.toggle("is-active", isCurrent);

        if (isCurrent) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function setupSectionTracking() {
    if (!("IntersectionObserver" in window)) {
        return;
    }

    const sectionObserver = new IntersectionObserver((entries) => {
        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
            return;
        }

        updateActiveLink(visibleEntry.target.id);
    }, {
        threshold: [0.3, 0.6],
        rootMargin: "-20% 0px -45% 0px"
    });

    sections.forEach((section) => sectionObserver.observe(section));
}

function setupSmoothScroll() {
    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            if (!href || !href.startsWith("#")) {
                return;
            }

            const target = document.querySelector(href);
            if (!target) {
                return;
            }

            event.preventDefault();

            const offset = header.offsetHeight + 18;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top,
                behavior: mediaQuery.matches ? "auto" : "smooth"
            });
        });
    });
}

function updateLanguageButtons() {
    languageButtons.forEach((button) => {
        const isCurrent = button.dataset.lang === currentLanguage;
        button.classList.toggle("is-active", isCurrent);
        button.setAttribute("aria-pressed", String(isCurrent));
    });
}

function setupLanguageSwitcher() {
    languageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextLanguage = button.dataset.lang;
            if (!nextLanguage || nextLanguage === currentLanguage) {
                return;
            }

            setLanguage(nextLanguage);
        });
    });
}

function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
        const translated = getStaticTranslation(node.dataset.i18n);
        if (typeof translated === "string") {
            node.textContent = translated;
        }
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
        const translated = getStaticTranslation(node.dataset.i18nHtml);
        if (typeof translated === "string") {
            node.innerHTML = translated;
        }
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
        const translated = getStaticTranslation(node.dataset.i18nAriaLabel);
        if (typeof translated === "string") {
            node.setAttribute("aria-label", translated);
        }
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
        const translated = getStaticTranslation(node.dataset.i18nAlt);
        if (typeof translated === "string") {
            node.setAttribute("alt", translated);
        }
    });
}

function updatePageMeta() {
    const meta = getDynamicTranslation("meta");
    if (!meta) {
        return;
    }

    if (pageTitle) {
        pageTitle.textContent = meta.title;
    }

    if (pageDescription) {
        pageDescription.setAttribute("content", meta.description);
    }

    document.documentElement.lang = htmlLangByLanguage[currentLanguage] || htmlLangByLanguage[DEFAULT_LANGUAGE];
}

function updateSkillFilter(category) {
    currentSkillCategory = category;
    const details = getDynamicTranslation(`skills.filterDetails.${category}`)
        || getDynamicTranslation("skills.filterDetails.all");
    let visibleCount = 0;

    skillItems.forEach((item) => {
        const shouldShow = category === "all" || item.dataset.category === category;
        item.hidden = !shouldShow;
        if (shouldShow) {
            visibleCount += 1;
        }
    });

    if (activeFilterLabel && details) {
        activeFilterLabel.textContent = details.label;
    }

    if (activeFilterCopy && details) {
        activeFilterCopy.textContent = details.copy;
    }

    if (visibleSkillCount) {
        visibleSkillCount.textContent = String(visibleCount);
    }
}

function setupSkillFilters() {
    skillFilters.forEach((button) => {
        button.addEventListener("click", () => {
            skillFilters.forEach((filter) => filter.classList.remove("is-active"));
            button.classList.add("is-active");
            updateSkillFilter(button.dataset.category || "all");
        });
    });

    updateSkillFilter(currentSkillCategory);
}

function setupHeroTilt() {
    if (!systemStage || mediaQuery.matches || !finePointerQuery.matches) {
        return;
    }

    const maxRotation = 10;

    systemStage.addEventListener("pointermove", (event) => {
        const bounds = systemStage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;

        const rotateY = (x - 0.5) * maxRotation;
        const rotateX = (0.5 - y) * maxRotation;

        systemStage.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    systemStage.addEventListener("pointerleave", () => {
        systemStage.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    });
}

function getProjectStrings() {
    return getDynamicTranslation("projects.cards");
}

function getRepoHighlight(repoName) {
    return i18n.repoHighlights[currentLanguage]?.[repoName]
        || i18n.repoHighlights[DEFAULT_LANGUAGE]?.[repoName]
        || null;
}

function updateProjectsStatus() {
    if (!projectsStatus) {
        return;
    }

    const statusStrings = getDynamicTranslation("projects.status");

    if (projectState.mode === "live") {
        projectsStatus.textContent = formatTemplate(statusStrings.live, {
            count: projectState.count
        });
        projectsStatus.classList.remove("is-fallback");
        return;
    }

    if (projectState.mode === "fallback") {
        projectsStatus.textContent = statusStrings.fallback;
        projectsStatus.classList.add("is-fallback");
        return;
    }

    projectsStatus.textContent = statusStrings.loading;
    projectsStatus.classList.remove("is-fallback");
}

function setLanguage(language) {
    if (language !== DEFAULT_LANGUAGE && !i18n.static[language]) {
        return;
    }

    currentLanguage = language;
    persistLanguage(language);
    body.dataset.language = language;
    updatePageMeta();
    applyStaticTranslations();
    updateLanguageButtons();
    updateSkillFilter(currentSkillCategory);

    if (projectState.mode === "loading") {
        renderProjectPlaceholders();
    } else if (cachedRepos.length) {
        renderProjects(cachedRepos);
    }

    updateProjectsStatus();
}

function createFallbackRepos() {
    return preferredRepoOrder.map((name) => ({
        name,
        html_url: `https://github.com/${githubUsername}/${name}`,
        description: "",
        language: "",
        stargazers_count: 0,
        updated_at: null,
        homepage: "",
        roleProof: ""
    }));
}

function formatRepoDate(dateString) {
    const strings = getProjectStrings();

    if (!dateString) {
        return strings.available;
    }

    const formatter = new Intl.DateTimeFormat(getLocale(), {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    return formatTemplate(strings.updated, {
        date: formatter.format(new Date(dateString))
    });
}

function getRepoRoleProof(repo) {
    const highlight = getRepoHighlight(repo.name);
    return highlight?.roleProof || getProjectStrings().defaultRoleProof;
}

function getRepoSummary(repo) {
    const highlight = getRepoHighlight(repo.name);
    if (highlight?.description) {
        return highlight.description;
    }

    if (repo.description && repo.description.trim() && currentLanguage === DEFAULT_LANGUAGE) {
        return repo.description.trim();
    }

    return getProjectStrings().genericSummary;
}

function getRepoLanguageLabel(repo) {
    const highlight = getRepoHighlight(repo.name);
    return highlight?.language || repo.language || "GitHub";
}

function createProjectCard(repo) {
    const strings = getProjectStrings();
    const summary = escapeHtml(getRepoSummary(repo));
    const language = escapeHtml(getRepoLanguageLabel(repo));
    const updated = escapeHtml(formatRepoDate(repo.updated_at));
    const stars = Number(repo.stargazers_count || 0);
    const homepage = repo.homepage && repo.homepage.trim();
    const roleProof = escapeHtml(getRepoRoleProof(repo));

    return `
        <article class="project-card" data-reveal="up">
            <div class="project-topline">
                <span class="project-pill">${language}</span>
                <span class="project-pill">${roleProof}</span>
                <span class="project-stat"><i class="bx bx-star"></i>${stars}</span>
            </div>
            <div>
                <h3 class="project-name">${escapeHtml(repo.name)}</h3>
                <p class="project-summary">${summary}</p>
            </div>
            <div class="project-pills">
                <span>${updated}</span>
                <span>${escapeHtml(strings.publicGithub)}</span>
            </div>
            <div class="project-links">
                <a class="project-link" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer">
                    <i class="bx bx-link-external"></i>
                    ${escapeHtml(strings.viewRepo)}
                </a>
                ${homepage ? `
                    <a class="project-link" href="${escapeHtml(homepage)}" target="_blank" rel="noopener noreferrer">
                        <i class="bx bx-globe"></i>
                        ${escapeHtml(strings.viewDeploy)}
                    </a>
                ` : ""}
            </div>
        </article>
    `;
}

function renderProjectPlaceholders() {
    if (!projectsGrid) {
        return;
    }

    const strings = getProjectStrings();

    projectsGrid.innerHTML = Array.from({ length: 4 }, () => `
        <article class="project-card is-placeholder" aria-hidden="true">
            <div class="project-topline">
                <span class="project-pill">loading</span>
                <span class="project-pill">loading</span>
                <span class="project-stat">0</span>
            </div>
            <div>
                <h3 class="project-name">${escapeHtml(strings.loadingTitle)}</h3>
                <p class="project-summary">${escapeHtml(strings.loadingCopy)}</p>
            </div>
            <div class="project-pills">
                <span>${escapeHtml(strings.loadingMeta)}</span>
                <span>GitHub</span>
            </div>
            <div class="project-links">
                <span class="project-link">${escapeHtml(strings.loadingLink)}</span>
            </div>
        </article>
    `).join("");

    updateScrollProgress();
}

function repoPriority(repo) {
    const normalized = `${repo.name} ${repo.description || ""}`.toLowerCase();
    let score = 0;

    if (preferredRepoOrder.includes(repo.name)) {
        score += 40;
    }

    if (/(ai|voz|voice|transcribe|llm|agent|chat|backend|api|portfolio|quickdraw)/.test(normalized)) {
        score += 20;
    }

    if (repo.homepage) {
        score += 6;
    }

    if (!repo.fork) {
        score += 4;
    }

    return score;
}

function selectFeaturedRepos(repos) {
    const unique = repos.filter((repo) => !repo.fork && repo.name !== "GabrielGomesAL");
    const selected = [];

    preferredRepoOrder.forEach((repoName) => {
        const match = unique.find((repo) => repo.name === repoName);
        if (match) {
            selected.push(match);
        }
    });

    unique
        .sort((a, b) => {
            const priorityDiff = repoPriority(b) - repoPriority(a);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }

            return new Date(b.updated_at) - new Date(a.updated_at);
        })
        .forEach((repo) => {
            if (!selected.some((item) => item.name === repo.name) && selected.length < 6) {
                selected.push(repo);
            }
        });

    return selected.slice(0, 6);
}

function renderProjects(repos) {
    if (!projectsGrid) {
        return;
    }

    projectsGrid.innerHTML = repos.map(createProjectCard).join("");
    projectsGrid.setAttribute("aria-busy", "false");
    observeRevealTargets(projectsGrid.querySelectorAll("[data-reveal]"));
    updateScrollProgress();
}

async function loadProjects() {
    if (!projectsGrid || !projectsStatus) {
        return;
    }

    projectState = {
        mode: "loading",
        count: 0
    };
    updateProjectsStatus();
    renderProjectPlaceholders();

    try {
        const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=20`);

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const repos = await response.json();
        cachedRepos = selectFeaturedRepos(repos);
        projectState = {
            mode: "live",
            count: cachedRepos.length
        };
        renderProjects(cachedRepos);
        updateProjectsStatus();
    } catch (error) {
        cachedRepos = createFallbackRepos();
        projectState = {
            mode: "fallback",
            count: cachedRepos.length
        };
        renderProjects(cachedRepos);
        updateProjectsStatus();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    currentLanguage = getInitialLanguage();
    setHeaderState();
    updateScrollProgress();
    setupMenu();
    setupSmoothScroll();
    setupReveal();
    setupSectionTracking();
    setupLanguageSwitcher();
    setupSkillFilters();
    setupHeroTilt();
    setLanguage(currentLanguage);
    loadProjects();
});

window.addEventListener("scroll", () => {
    setHeaderState();
    updateScrollProgress();
}, { passive: true });

window.addEventListener("resize", updateScrollProgress);
window.addEventListener("load", updateScrollProgress);

if (finePointerQuery.matches) {
    window.addEventListener("pointermove", setPointerGlow, { passive: true });
}

body.addEventListener("mouseleave", () => {
    root.style.setProperty("--pointer-x", "50%");
    root.style.setProperty("--pointer-y", "18%");
});
