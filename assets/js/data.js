
/* =========================================================
   LIBERTY MOTORS — WEBSITE ENGINE
   GitHub Pages project-site compatible
   ========================================================= */

(function () {
  "use strict";

  const DATA = window.LIBERTY_DATA;

  if (!DATA) {
    console.error("Liberty Motors: data.js was not loaded.");
    return;
  }

  const app = document.getElementById("app");
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (!app) return;

  /* ---------- 1. WEBSITE BASE PATH ---------- */

  const BASE_PATH = "/LIBERTY-MOTORS/";

  function siteUrl(path) {
    const cleanPath = String(path || "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    return cleanPath ? BASE_PATH + cleanPath : BASE_PATH;
  }

  function normalisePath(path) {
    let result = path.split("?")[0].split("#")[0];

    result = result.replace(/\/+/g, "/");

    if (result.toLowerCase().startsWith(BASE_PATH.toLowerCase())) {
      result = result.substring(BASE_PATH.length - 1);
    }

    if (!result) result = "/";

    if (result.length > 1) {
      result = result.replace(/\/$/, "");
    }

    return result.toLowerCase();
  }

  /* ---------- 2. GENERAL HELPERS ---------- */

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function getImage(item) {
    return item.image || "assets/images/hero-car.jpg";
  }

  function getPrice(item) {
    return item.price || "Contact for price";
  }

  function getEnquiryEmail(category) {
    return DATA.getEmailForCategory(category);
  }

  function getEnquiryLink(item, category) {
    const email = getEnquiryEmail(category);

    const subject = "Enquiry: " + item.name;

    const body =
      "Hello Liberty Motors,\n\n" +
      "I am interested in: " + item.name + "\n\n" +
      "Please provide more information.\n\n" +
      "Thank you.";

    return (
      "https://mail.google.com/mail/?view=cm&fs=1" +
      "&to=" + encodeURIComponent(email) +
      "&su=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body)
    );
  }

  function emptyState(message) {
    return `
      <div class="empty-state">
        <h3>Coming Soon</h3>
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  }

  function pageHero(title, description) {
    return `
      <section class="page-hero">
        <div class="container">
          <span class="eyebrow">Liberty Motors</span>
          <h1>${escapeHTML(title)}</h1>
          <p>${escapeHTML(description)}</p>
        </div>
      </section>
    `;
  }

  /* ---------- 3. NAVIGATION HEADER ---------- */

  function renderHeader() {
    if (!header) return;

    const navigation = DATA.navigation || [];

    header.innerHTML = `
      <div class="site-header">
        <div class="header-inner">

          <a href="${siteUrl("")}" class="logo">
            <img
              src="${escapeHTML(DATA.business.logo)}"
              alt="${escapeHTML(DATA.business.name)} logo"
              onerror="this.style.display='none'"
            >
            <span>${escapeHTML(DATA.business.name)}</span>
          </a>

          <nav class="nav-links" aria-label="Main navigation">

            ${navigation.map(item => `
              <div class="nav-item">

                <a href="${siteUrl(item.url)}">
                  ${escapeHTML(item.label)}
                </a>

                ${item.children ? `
                  <div class="nav-dropdown">
                    ${item.children.map(child => `
                      <a href="${siteUrl(child.url)}">
                        ${escapeHTML(child.label)}
                      </a>
                    `).join("")}
                  </div>
                ` : ""}

              </div>
            `).join("")}

          </nav>

          <div class="nav-actions">

            <a href="${siteUrl("/contact")}" class="btn btn-primary">
              Enquire Now
            </a>

            <button
              class="menu-toggle"
              id="mobile-menu-toggle"
              aria-label="Toggle navigation"
              aria-expanded="false"
            >
              ☰
            </button>

          </div>

        </div>

        <div class="mobile-nav" id="mobile-nav">

          ${navigation.map(item => `
            <a href="${siteUrl(item.url)}">
              ${escapeHTML(item.label)}
            </a>

            ${item.children ? item.children.map(child => `
              <a class="mobile-sub-link" href="${siteUrl(child.url)}">
                ${escapeHTML(child.label)}
              </a>
            `).join("") : ""}

          `).join("")}

          <a href="${siteUrl("/contact")}">Enquire Now</a>

        </div>
      </div>
    `;

    const toggle = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        const open = mobileNav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }
  }

  /* ---------- 4. FOOTER ---------- */

  function renderFooter() {
    if (!footer) return;

    const generalLink = getEnquiryLink(
      { name: "General Enquiry" },
      "general"
    );

    footer.innerHTML = `
      <footer class="site-footer">

        <div class="footer-inner">

          <div class="footer-brand">
            <h3>${escapeHTML(DATA.business.name)}</h3>
            <p>${escapeHTML(DATA.business.tagline)}</p>
            <p>${escapeHTML(DATA.business.description)}</p>
          </div>

          <div class="footer-column">
            <h3>Explore</h3>
            <a href="${siteUrl("")}">Home</a>
            <a href="${siteUrl("/cars")}">Cars Inventory</a>
            <a href="${siteUrl("/parts")}">Automotive Parts</a>
            <a href="${siteUrl("/services")}">Our Services</a>
          </div>

          <div class="footer-column">
            <h3>Contact</h3>
            <a href="${siteUrl("/contact")}">General Enquiries</a>
            <a href="${escapeHTML(generalLink)}"
               target="_blank"
               rel="noopener noreferrer">
              Email Liberty Motors
            </a>
          </div>

        </div>

        <div class="footer-bottom">
          © ${new Date().getFullYear()}
          ${escapeHTML(DATA.business.name)}.
          All rights reserved.
        </div>

      </footer>
    `;
  }

  /* ---------- 5. LISTING CARDS ---------- */

  function renderCard(item, type) {
    const url = siteUrl("/" + type + "/" + item.slug);

    return `
      <article class="listing-card ${type}-card">

        <a href="${url}" class="card-image">
          <img
            src="${escapeHTML(getImage(item))}"
            alt="${escapeHTML(item.name)}"
            loading="lazy"
          >
        </a>

        <div class="card-content">

          ${item.condition ? `
            <span class="badge">
              ${escapeHTML(item.condition)}
            </span>
          ` : ""}

          <h3>
            <a href="${url}">
              ${escapeHTML(item.name)}
            </a>
          </h3>

          <p>${escapeHTML(item.description || "")}</p>

          <span class="card-price">
            ${escapeHTML(getPrice(item))}
          </span>

          <a href="${url}" class="card-link">
            View Details →
          </a>

        </div>

      </article>
    `;
  }

  /* ---------- 6. HOMEPAGE FEATURED ITEMS ---------- */

  function populateFeatured() {
    const featuredCars = DATA.cars
      .filter(item => item.featured)
      .slice(0, 3);

    const featuredParts = DATA.parts
      .filter(item => item.featured)
      .slice(0, 3);

    const featuredServices = DATA.services
      .filter(item => item.featured)
      .slice(0, 3);

    const carGrid = document.getElementById("featured-cars");
    const partsGrid = document.getElementById("featured-parts-grid");
    const servicesGrid = document.getElementById("featured-services-grid");

    if (carGrid) {
      carGrid.innerHTML = featuredCars.length
        ? featuredCars.map(item => renderCard(item, "cars")).join("")
        : emptyState("No featured vehicles available yet.");
    }

    if (partsGrid) {
      partsGrid.innerHTML = featuredParts.length
        ? featuredParts.map(item => renderCard(item, "parts")).join("")
        : emptyState("No featured parts available yet.");
    }

    if (servicesGrid) {
      servicesGrid.innerHTML = featuredServices.length
        ? featuredServices.map(item => renderCard(item, "services")).join("")
        : emptyState("No featured services available yet.");
    }
  }

  /* ---------- 7. CATEGORY PAGES ---------- */

  function renderCategoryPage(title, description, items, type) {
    const cards = items.length
      ? items.map(item => renderCard(item, type)).join("")
      : emptyState("Please check back for new listings.");

    app.innerHTML = `
      ${pageHero(title, description)}

      <section class="inventory-section">
        <div class="container">

          <div class="breadcrumbs">
            <a href="${siteUrl("")}">Home</a>
            <span>/</span>
            ${escapeHTML(title)}
          </div>

          <div class="section-heading">
            <h2>${escapeHTML(title)}</h2>
            <p>${items.length} listing(s) currently displayed.</p>
          </div>

          <div class="listing-grid">
            ${cards}
          </div>

        </div>
      </section>
    `;
  }

  /* ---------- 8. INDIVIDUAL LISTING PAGES ---------- */

  function renderDetailPage(item, type) {
    const category =
      type === "cars" ? "cars" :
      type === "parts" ? "parts" : "services";

    const emailLink = getEnquiryLink(item, category);

    const specifications = item.specifications
      ? Object.entries(item.specifications).map(([key, value]) => `
          <div>
            <strong>${escapeHTML(key)}</strong>
            <span>${escapeHTML(value)}</span>
          </div>
        `).join("")
      : "";

    const gallery = item.gallery && item.gallery.length
      ? item.gallery.map(image => `
          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(item.name)}"
            loading="lazy"
          >
        `).join("")
      : "";

    app.innerHTML = `
      ${pageHero(item.name, item.description || "")}

      <section class="detail-page">
        <div class="container">

          <div class="breadcrumbs">
            <a href="${siteUrl("")}">Home</a>
            <span>/</span>
            <a href="${siteUrl("/" + type)}">
              ${escapeHTML(type)}
            </a>
            <span>/</span>
            ${escapeHTML(item.name)}
          </div>

          <div class="detail-layout">

            <div class="detail-gallery">

              <img
                src="${escapeHTML(getImage(item))}"
                alt="${escapeHTML(item.name)}"
              >

              ${gallery ? `
                <div class="gallery-thumbnails">
                  ${gallery}
                </div>
              ` : ""}

            </div>

            <div class="detail-info">

              <span class="eyebrow">
                ${escapeHTML(type)}
              </span>

              <h1>${escapeHTML(item.name)}</h1>

              <div class="card-price">
                ${escapeHTML(getPrice(item))}
              </div>

              <p class="detail-description">
                ${escapeHTML(item.description || "")}
              </p>

              ${item.availability ? `
                <p>
                  <strong>Availability:</strong>
                  ${escapeHTML(item.availability)}
                </p>
              ` : ""}

              ${item.condition ? `
                <p>
                  <strong>Condition:</strong>
                  ${escapeHTML(item.condition)}
                </p>
              ` : ""}

              ${specifications ? `
                <div class="specifications">
                  ${specifications}
                </div>
              ` : ""}

              <a
                href="${escapeHTML(emailLink)}"
                class="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Enquire About This Item
              </a>

            </div>

          </div>

        </div>
      </section>
    `;
  }

  /* ---------- 9. CONTACT PAGE ---------- */

  function renderContactPage() {
    const email = getEnquiryEmail("general");

    const link = getEnquiryLink(
      { name: "General Enquiry" },
      "general"
    );

    app.innerHTML = `
      ${pageHero(
        "Contact Liberty Motors",
        "Our team is ready to assist with your automotive enquiries."
      )}

      <section class="contact-section">
        <div class="container">

          <div class="contact-card">

            <h2>Get in Touch</h2>

            <p>
              For general enquiries, product information and assistance,
              contact our team by email.
            </p>

            <p>
              <strong>General enquiries:</strong><br>
              ${escapeHTML(email)}
            </p>

            <a
              href="${escapeHTML(link)}"
              class="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Email Liberty Motors
            </a>

          </div>

        </div>
      </section>
    `;
  }

  /* ---------- 10. FIND INDIVIDUAL LISTINGS ---------- */

  function findListing(path) {
    const allItems = [
      ...DATA.cars.map(item => ({ item, type: "cars" })),
      ...DATA.parts.map(item => ({ item, type: "parts" })),
      ...DATA.services.map(item => ({ item, type: "services" }))
    ];

    return allItems.find(entry => {
      const expectedPath =
        "/" + entry.type + "/" + entry.item.slug;

      return normalisePath(expectedPath) === path;
    });
  }

  /* ---------- 11. ROUTE HANDLER ---------- */

  function renderRoute() {
    const path = normalisePath(window.location.pathname);

    /* Homepage */
    if (path === "/") {
      populateFeatured();
      return;
    }

    /* Contact */
    if (path === "/contact") {
      renderContactPage();
      return;
    }

    /* All cars */
    if (path === "/cars") {
      renderCategoryPage(
        "Cars Inventory",
        "Explore our available new and used vehicles.",
        DATA.cars,
        "cars"
      );
      return;
    }

    /* New cars */
    if (path === "/cars/new") {
      renderCategoryPage(
        "New Cars",
        "Discover our new vehicle inventory.",
        DATA.cars.filter(item => item.category === "new"),
        "cars"
      );
      return;
    }

    /* Used cars */
    if (path === "/cars/used") {
      renderCategoryPage(
        "Used Cars",
        "Explore our used vehicle inventory.",
        DATA.cars.filter(item => item.category === "used"),
        "cars"
      );
      return;
    }

    /* All parts */
    if (path === "/parts") {
      renderCategoryPage(
        "Automotive Parts",
        "Explore our automotive parts and products.",
        DATA.parts,
        "parts"
      );
      return;
    }

    /* Tyres */
    if (path === "/parts/tyres") {
      renderCategoryPage(
        "Tyres",
        "Explore our available automotive tyres.",
        DATA.parts.filter(item => item.category === "tyres"),
        "parts"
      );
      return;
    }

    /* Vehicle parts */
    if (path === "/parts/vehicle-parts") {
      renderCategoryPage(
        "Vehicle Parts",
        "Explore our automotive replacement parts.",
        DATA.parts.filter(item => item.category === "vehicle-parts"),
        "parts"
      );
      return;
    }

    /* All services */
    if (path === "/services") {
      renderCategoryPage(
        "Our Services",
        "Discover our automotive services.",
        DATA.services,
        "services"
      );
      return;
    }

    /* Individual service categories */
    const serviceCategories = {
      "/services/general-repairs": "general-repairs",
      "/services/tinting": "tinting",
      "/services/pinstriping": "pinstriping",
      "/services/painting": "painting",
      "/services/windshield-repair": "windshield-repair"
    };

    if (serviceCategories[path]) {
      const category = serviceCategories[path];

      renderCategoryPage(
        category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        "Explore this service at Liberty Motors.",
        DATA.services.filter(item => item.category === category),
        "services"
      );
      return;
    }

    /* Individual vehicle, part or service */
    const listing = findListing(path);

    if (listing) {
      renderDetailPage(listing.item, listing.type);
      return;
    }

    /* Not found */
    app.innerHTML = `
      ${pageHero(
        "Page Not Found",
        "The page you're looking for may have moved or is unavailable."
      )}

      <section class="inventory-section">
        <div class="container" style="text-align:center">
          <a href="${siteUrl("")}" class="btn btn-primary">
            Return Home
          </a>
        </div>
      </section>
    `;
  }

  /* ---------- 12. INITIALISE WEBSITE ---------- */

  renderHeader();
  renderFooter();
  renderRoute();

  console.log("Liberty Motors website loaded successfully.");

})();
