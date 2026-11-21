
/* =========================================================
   LIBERTY MOTORS — WEBSITE ENGINE
   Supabase-connected
   GitHub Pages project-site compatible
   ========================================================= */

(function () {
  "use strict";

  const BASE_PATH = "/LIBERTY-MOTORS/";
  const DATA = window.LIBERTY_DATA;
  const db = window.libertySupabase;

  if (!DATA) {
    console.error("Liberty Motors: data.js was not loaded.");
    return;
  }

  const app = document.getElementById("app");
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (!app) {
    console.error("Liberty Motors: #app was not found.");
    return;
  }

  let inventoryError = false;

  /* URL MANAGEMENT */

  function siteUrl(path) {
    let clean = String(path || "").trim();

    if (clean.startsWith(BASE_PATH)) {
      clean = clean.slice(BASE_PATH.length);
    }

    clean = clean.replace(/^\/+/, "");

    return BASE_PATH + clean;
  }

  function normalisePath(path) {
    let clean = String(path || "");

    clean = clean.split("?")[0].split("#")[0];
    clean = clean.replace(/\/+/g, "/");

    if (clean.startsWith(BASE_PATH)) {
      clean = clean.slice(BASE_PATH.length);
    }

    return clean.replace(/^\/+|\/+$/g, "").toLowerCase();
  }

  let savedRoute = "";

  try {
    savedRoute = sessionStorage.getItem("liberty_redirect") || "";

    if (savedRoute) {
      sessionStorage.removeItem("liberty_redirect");
    }
  } catch (error) {
    console.warn("Liberty Motors: session storage unavailable.");
  }

  if (savedRoute) {
    window.history.replaceState(null, "", siteUrl(savedRoute));
  }

  let currentPath = savedRoute
    ? normalisePath(savedRoute)
    : normalisePath(window.location.pathname);

  /* HELPERS */

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

  function formatPrice(price) {
    if (price === undefined || price === null || price === "") {
      return "Contact for price";
    }

    if (typeof price === "number") {
      return "$" + price.toLocaleString("en-US");
    }

    return escapeHTML(price);
  }

  function getEmailPrice(price) {
    if (price === undefined || price === null || price === "") {
      return "Contact for price";
    }

    if (typeof price === "number") {
      return "$" + price.toLocaleString("en-US");
    }

    return String(price);
  }

  function getItemName(item) {
    return item.title || item.name || "Untitled listing";
  }

  function getSlug(item) {
    if (item.slug) return item.slug;

    return getItemName(item)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getImage(item) {
    return item.image ||
      (item.images && item.images.length ? item.images[0] : "") ||
      "assets/images/vehicle-placeholder.jpg";
  }

  function getTypeLabel(type) {
    const labels = {
      cars: "Vehicle",
      parts: "Automotive Part",
      services: "Automotive Service"
    };

    return labels[type] || "Listing";
  }

  function getArray(type) {
    return Array.isArray(DATA[type]) ? DATA[type] : [];
  }

  function getEmptyMessage(title) {
    if (inventoryError) {
      return `
        <div class="empty-state">
          <h2>Temporarily Unavailable</h2>
          <p>
            We are having trouble loading our inventory.
            Please try again shortly.
          </p>
          <a class="listing-button" href="${siteUrl("")}">
            Return Home
          </a>
        </div>
      `;
    }

    return `
      <div class="empty-state">
        <h2>Coming Soon</h2>
        <p>
          We are preparing our ${escapeHTML(title.toLowerCase())}
          collection. Please check back soon.
        </p>
        <a class="listing-button" href="${siteUrl("contact")}">
          Contact Us
        </a>
      </div>
    `;
  }

  /* SUPABASE INVENTORY */

  async function loadInventory() {
    if (!db) {
      throw new Error("Supabase client was not found.");
    }

    const { data, error } = await db
      .from("inventory")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    DATA.cars = [];
    DATA.parts = [];
    DATA.services = [];

    const typeMap = {
      vehicle: "cars",
      part: "parts",
      service: "services"
    };

    (data || []).forEach(function (item) {
      const destination = typeMap[item.item_type];

      if (!destination) {
        console.warn(
          "Liberty Motors: Unknown inventory type:",
          item.item_type
        );
        return;
      }

      DATA[destination].push(item);
    });

    console.log("Liberty Motors: Inventory loaded.");
    console.log("Vehicles:", DATA.cars.length);
    console.log("Parts:", DATA.parts.length);
    console.log("Services:", DATA.services.length);
  }

  /* EMAIL AUTOMATION */

  function createEmailLink(email, subject, body) {
    return "mailto:" + email +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function getListingDetails(item, type) {
    const details = [
      "Listing: " + getItemName(item),
      "Type: " + getTypeLabel(type),
      "Listed Price: " + getEmailPrice(item.price)
    ];

    if (item.year) {
      details.push("Year: " + item.year);
    }

    if (item.mileage) {
      details.push("Mileage: " + item.mileage);
    }

    if (item.category) {
      details.push("Category: " + item.category);
    }

    if (item.status) {
      details.push("Status: " + item.status);
    }

    const specifications = item.specifications || {};

    Object.entries(specifications).forEach(([key, value]) => {
      details.push(key + ": " + value);
    });

    if (item.description) {
      details.push("Description: " + item.description);
    }

    return details.join("\n");
  }

  function getGeneralEnquiryLink(item, type) {
    const email = DATA.emails.general;

    const subject =
      "General Enquiry - " + getItemName(item);

    const body =
      "Hello Liberty Motors,\n\n" +
      "I would like to make a general enquiry about the following listing:\n\n" +
      getListingDetails(item, type) +
      "\n\nPlease provide more information.\n\n" +
      "Thank you.";

    return createEmailLink(email, subject, body);
  }

  function getBuyNowLink(item, type) {
    const email = DATA.emails.payments;

    const subject =
      "Purchase Request - " + getItemName(item);

    const body =
      "Hello Liberty Motors Sales Team,\n\n" +
      "I would like to proceed with purchasing the following item:\n\n" +
      getListingDetails(item, type) +
      "\n\nPlease confirm availability and provide the necessary payment instructions so I can proceed with the purchase.\n\n" +
      "Thank you.";

    return createEmailLink(email, subject, body);
  }

  function getBookNowLink(item) {
    const email = DATA.emails.payments;

    const subject =
      "Service Booking Request - " + getItemName(item);

    const body =
      "Hello Liberty Motors Sales Team,\n\n" +
      "I would like to book the following automotive service:\n\n" +
      getListingDetails(item, "services") +
      "\n\nPlease confirm availability and provide the necessary booking and payment instructions.\n\n" +
      "Thank you.";

    return createEmailLink(email, subject, body);
  }

  function getContactEmailLink() {
    const email = DATA.emails.general;

    const subject = "General Enquiry - Liberty Motors";

    const body =
      "Hello Liberty Motors,\n\n" +
      "I would like to make a general enquiry.\n\n" +
      "My enquiry:\n\n" +
      "Thank you.";

    return createEmailLink(email, subject, body);
  }

  /* HEADER */

  function renderHeader() {
    if (!header) return;

    const navigation = DATA.navigation || [];

    function renderNavItem(item) {
      const children = item.children || [];

      if (!children.length) {
        return `
          <a class="nav-link" href="${siteUrl(item.url)}">
            ${escapeHTML(item.label)}
          </a>
        `;
      }

      return `
        <div class="nav-dropdown">
          <a class="nav-link nav-dropdown-trigger" href="${siteUrl(item.url)}">
            ${escapeHTML(item.label)}
            <span class="dropdown-arrow">⌄</span>
          </a>

          <div class="dropdown-menu">
            ${children.map(child => `
              <a href="${siteUrl(child.url)}">
                ${escapeHTML(child.label)}
              </a>
            `).join("")}
          </div>
        </div>
      `;
    }

    header.innerHTML = `
      <div class="site-header-inner">

        <a class="brand" href="${siteUrl("")}">
          <img
            src="${escapeHTML(DATA.business.logo)}"
            alt="${escapeHTML(DATA.business.name)}"
          >
          <span>${escapeHTML(DATA.business.name)}</span>
        </a>

        <button
          class="menu-toggle"
          id="liberty-menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="main-navigation" id="liberty-navigation">
          ${navigation.map(renderNavItem).join("")}
        </nav>

        <a class="header-contact" href="${siteUrl("contact")}">
          Contact Us
        </a>

      </div>
    `;

    const menuToggle = document.getElementById("liberty-menu-toggle");
    const mainNavigation = document.getElementById("liberty-navigation");

    if (menuToggle && mainNavigation) {
      menuToggle.addEventListener("click", function () {
        const isOpen = mainNavigation.classList.toggle("is-open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
          "aria-label",
          isOpen ? "Close navigation menu" : "Open navigation menu"
        );
      });
    }
  }

  /* FOOTER */

  function renderFooter() {
    if (!footer) return;

    footer.innerHTML = `
      <div class="footer-inner">

        <div class="footer-brand">
          <h3>${escapeHTML(DATA.business.name)}</h3>
          <p>${escapeHTML(DATA.business.tagline)}</p>
          <p>${escapeHTML(DATA.business.description)}</p>
        </div>

        <div class="footer-links">
          <h4>Explore</h4>
          <a href="${siteUrl("")}">Home</a>
          <a href="${siteUrl("cars")}">Vehicles</a>
          <a href="${siteUrl("parts")}">Parts</a>
          <a href="${siteUrl("services")}">Services</a>
          <a href="${siteUrl("about")}">About Us</a>
          <a href="${siteUrl("contact")}">Contact</a>
        </div>

        <div class="footer-contact">
          <h4>General Enquiries</h4>
          <a href="mailto:${escapeHTML(DATA.emails.general)}">
            ${escapeHTML(DATA.emails.general)}
          </a>

          <h4>Sales & Payments</h4>
          <a href="mailto:${escapeHTML(DATA.emails.payments)}">
            ${escapeHTML(DATA.emails.payments)}
          </a>
        </div>

      </div>

      <div class="footer-bottom">
        <p>
          &copy; ${new Date().getFullYear()}
          ${escapeHTML(DATA.business.name)}.
          All rights reserved.
        </p>
      </div>
    `;
  }

  /* LISTING CARDS */

  function renderCard(item, type) {
  
function renderCard(item, type) {
  const slug = getSlug(item);
  const title = getItemName(item);
  const route = type + "/" + slug;

  const isService = type === "services";

  const primaryAction = isService
    ? getBookNowLink(item)
    : getBuyNowLink(item, type);

  const primaryLabel = isService
    ? "Book This Service"
    : "Buy Now";

  return `
    <article class="listing-card premium-listing-card">

      <a class="listing-image" href="${siteUrl(route)}">
        <img
          src="${escapeHTML(getImage(item))}"
          alt="${escapeHTML(title)}"
          loading="lazy"
        >
      </a>

      <div class="listing-content">

        <span class="listing-type">
          ${escapeHTML(getTypeLabel(type))}
        </span>

        <h3>
          <a href="${siteUrl(route)}">
            ${escapeHTML(title)}
          </a>
        </h3>

        <p class="listing-description">
          ${escapeHTML(item.description || "")}
        </p>

        <div class="listing-price">
          ${formatPrice(item.price)}
        </div>

        <div class="premium-card-actions">

          <a
            class="premium-action premium-action-primary"
            href="${primaryAction}"
          >
            ${primaryLabel}
          </a>

          <a
            class="premium-action premium-action-secondary"
            href="${getGeneralEnquiryLink(item, type)}"
          >
            General Enquiry
          </a>

        </div>

        <a class="premium-details-link" href="${siteUrl(route)}">
          View Full Details →
        </a>

      </div>

    </article>
  `;
}


  /* HOMEPAGE FEATURED CONTENT */

  function populateFeatured() {
    const carsContainer = document.getElementById("featured-cars");
    const partsContainer = document.getElementById("featured-parts-grid");
    const servicesContainer = document.getElementById("featured-services-grid");

    function populate(container, items, type) {
      if (!container) return;

      const featured = items
        .filter(item => item.is_featured !== false)
        .slice(0, 3);

      container.innerHTML = featured.length
        ? featured.map(item => renderCard(item, type)).join("")
        : getEmptyMessage(type);
    }

    populate(carsContainer, getArray("cars"), "cars");
    populate(partsContainer, getArray("parts"), "parts");
    populate(servicesContainer, getArray("services"), "services");
  }

  /* PAGE LAYOUT */

  function pageLayout(title, description, content) {
    app.innerHTML = `
      <section class="page-heading">
        <div class="page-heading-inner">
          <h1>${escapeHTML(title)}</h1>
          <p>${escapeHTML(description || "")}</p>
        </div>
      </section>

      <section class="page-content">
        ${content}
      </section>
    `;
  }

  /* CATEGORY PAGES */

  function renderCategoryPage(type, title, description, filter) {
    let items = getArray(type);

    if (filter) {
      items = items.filter(filter);
    }

    items = items.filter(item => item.is_published !== false);

    const content = items.length
      ? `
        <div class="listing-grid">
          ${items.map(item => renderCard(item, type)).join("")}
        </div>
      `
      : getEmptyMessage(title);

    pageLayout(title, description, content);
  }

  /* LISTING DETAIL PAGES */

  function findListing(path) {
    const segments = path.split("/");

    if (segments.length !== 2) return null;

    const type = segments[0];
    const slug = segments[1];

    if (!["cars", "parts", "services"].includes(type)) {
      return null;
    }

    const item = getArray(type).find(entry =>
      getSlug(entry).toLowerCase() === slug &&
      entry.is_published !== false
    );

    return item ? { item, type } : null;
  }

  function renderDetailPage(item, type) {
    const title = getItemName(item);

    const images = item.images && item.images.length
      ? item.images
      : [getImage(item)];

    const specifications = item.specifications || {};

    const specificationHTML = Object.keys(specifications).length
      ? `
        <div class="detail-specifications">
          <h2>Specifications</h2>
          <div class="specification-grid">
            ${Object.entries(specifications).map(([key, value]) => `
              <div class="specification-item">
                <strong>${escapeHTML(key)}</strong>
                <span>${escapeHTML(value)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `
      : "";

    const galleryHTML = images.map(image => `
      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(title)}"
      >
    `).join("");

    const transactionButton = type === "services"
      ? `
        <a
          class="listing-button"
          href="${getBookNowLink(item)}"
        >
          Book This Service
        </a>
      `
      : `
        <a
          class="listing-button"
          href="${getBuyNowLink(item, type)}"
        >
          Buy Now
        </a>
      `;

    pageLayout(
      title,
      getTypeLabel(type) + " Details",
      `
        <div class="detail-layout">

          <div class="detail-gallery">
            ${galleryHTML}
          </div>

          <div class="detail-information">

            <span class="listing-type">
              ${getTypeLabel(type)}
            </span>

            <h2>${escapeHTML(title)}</h2>

            <div class="detail-price">
              ${formatPrice(item.price)}
            </div>

            <p>${escapeHTML(item.description || "")}</p>

            ${item.year ? `<p><strong>Year:</strong> ${escapeHTML(item.year)}</p>` : ""}

            ${item.mileage ? `<p><strong>Mileage:</strong> ${escapeHTML(item.mileage)}</p>` : ""}

            ${item.category ? `<p><strong>Category:</strong> ${escapeHTML(item.category)}</p>` : ""}

            ${item.status ? `<p><strong>Status:</strong> ${escapeHTML(item.status)}</p>` : ""}

            <div class="listing-actions">

              <a
                class="listing-button"
                href="${getGeneralEnquiryLink(item, type)}"
              >
                General Enquiry
              </a>

              ${transactionButton}

            </div>

          </div>

        </div>

        ${specificationHTML}
      `
    );
  }

  /* ABOUT PAGE */

  function renderAboutPage() {
    pageLayout(
      "About Liberty Motors",
      DATA.business.tagline,
      `
        <div class="about-content">
          <h2>Quality. Trust. Excellence.</h2>

          <p>
            ${escapeHTML(DATA.business.description)}
          </p>

          <p>
            At Liberty Motors, our goal is to make your automotive
            experience straightforward and dependable.
          </p>

          <a class="listing-button" href="${siteUrl("contact")}">
            Get in Touch
          </a>
        </div>
      `
    );
  }

  /* CONTACT PAGE */

  function renderContactPage() {
    const emails = DATA.emails || {};

    pageLayout(
      "Contact Liberty Motors",
      "Choose the appropriate department to contact us.",
      `
        <div class="contact-grid">

          <div class="contact-card">
            <h3>General Enquiries</h3>

            <p>
              For general questions, vehicle enquiries,
              parts enquiries and service information.
            </p>

            <a href="mailto:${escapeHTML(emails.general)}">
              ${escapeHTML(emails.general)}
            </a>

            <p>
              <a
                class="listing-button"
                href="${getContactEmailLink()}"
              >
                Send General Enquiry
              </a>
            </p>
          </div>

          <div class="contact-card">
            <h3>Sales, Bookings & Payments</h3>

            <p>
              For purchases, service bookings and payment arrangements.
            </p>

            <a href="mailto:${escapeHTML(emails.payments)}">
              ${escapeHTML(emails.payments)}
            </a>

          </div>

        </div>
      `
    );
  }

  /* ROUTING */

  function renderRoute() {
    const path = currentPath;

    if (!path) {
      populateFeatured();
      return;
    }

    if (path === "cars") {
      renderCategoryPage(
        "cars",
        "Our Vehicles",
        "Explore our collection of quality vehicles."
      );
      return;
    }

    if (path === "cars/new") {
      renderCategoryPage(
        "cars",
        "New Vehicles",
        "Explore our new vehicle collection.",
        item => String(item.category || "").toLowerCase() === "new"
      );
      return;
    }

    if (path === "cars/used") {
      renderCategoryPage(
        "cars",
        "Used Vehicles",
        "Explore our pre-owned vehicle collection.",
        item => String(item.category || "").toLowerCase() === "used"
      );
      return;
    }

    if (path === "parts") {
      renderCategoryPage(
        "parts",
        "Automotive Parts",
        "Explore our automotive parts collection."
      );
      return;
    }

    if (path === "parts/tyres") {
      renderCategoryPage(
        "parts",
        "Tyres",
        "Explore available tyres.",
        item => String(item.category || "").toLowerCase() === "tyres"
      );
      return;
    }

    if (path === "parts/vehicle-parts") {
      renderCategoryPage(
        "parts",
        "Vehicle Parts",
        "Explore our vehicle parts collection.",
        item => String(item.category || "").toLowerCase() !== "tyres"
      );
      return;
    }

    if (path === "services") {
      renderCategoryPage(
        "services",
        "Automotive Services",
        "Explore our professional automotive services."
      );
      return;
    }

    const serviceCategories = {
      "services/general-repairs": "General Repairs",
      "services/tinting": "Window Tinting",
      "services/pinstriping": "Pinstriping",
      "services/painting": "Vehicle Painting",
      "services/windshield-repair": "Windshield Repair"
    };

    if (serviceCategories[path]) {
      const category = serviceCategories[path].toLowerCase();

      renderCategoryPage(
        "services",
        serviceCategories[path],
        "Explore our " + category + " services.",
        item => String(item.category || "").toLowerCase() === category
      );
      return;
    }

    if (path === "about") {
      renderAboutPage();
      return;
    }

    if (path === "contact") {
      renderContactPage();
      return;
    }

    const result = findListing(path);

    if (result) {
      renderDetailPage(result.item, result.type);
      return;
    }

    pageLayout(
      "Page Not Found",
      "The page you are looking for could not be found.",
      `
        <div class="empty-state">
          <a class="listing-button" href="${siteUrl("")}">
            Return Home
          </a>
        </div>
      `
    );
  }

  /* INITIALISE WEBSITE */

  async function initialiseWebsite() {
    renderHeader();
    renderFooter();

    // Preserve the original homepage HTML.
    // Do not clear the #app container here.

    try {
      await loadInventory();
      inventoryError = false;
    } catch (error) {
      inventoryError = true;
      console.error(
        "Liberty Motors: Inventory loading failed.",
        error
      );
    }

    // Render the correct route only after inventory loading.
    // On the homepage, this updates only the featured sections.
    renderRoute();

    console.log("Liberty Motors website engine loaded.");
    console.log("Current route:", currentPath);
  }

  initialiseWebsite();

})();
