
/* =========================================================
   LIBERTY MOTORS — ADMIN ENGINE
   Dynamic inventory management
   ========================================================= */

(function () {
  "use strict";

  const db = window.libertySupabase;

  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");

  const inventoryForm = document.getElementById("inventory-form");
  const inventoryList = document.getElementById("inventory-list");
  const inventoryMessage = document.getElementById("inventory-message");
  const saveButton = document.getElementById("save-button");
  const cancelEditButton = document.getElementById("cancel-edit-button");

  const itemType = document.getElementById("item-type");

  let inventory = [];

  if (!db) {
    document.getElementById("message").textContent =
      "Database connection failed. Check Supabase configuration.";
    document.getElementById("message").className = "error";
    return;
  }

  /* HELPERS */

  function byId(id) {
    return document.getElementById(id);
  }

  function value(id) {
    return byId(id).value.trim();
  }

  function setValue(id, newValue) {
    byId(id).value = newValue ?? "";
  }

  function setMessage(element, text, type) {
    element.textContent = text;
    element.className = type || "";
  }

  function escapeHTML(input) {
    return String(input ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function slugify(input) {
    return String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return "Contact for price";
    }

    return "$" + Number(price).toLocaleString("en-US");
  }

  function getTypeLabel(type) {
    const labels = {
      vehicle: "Vehicle",
      part: "Spare Part",
      service: "Automotive Service"
    };

    return labels[type] || type;
  }

  function parseSpecifications(text) {
    const result = {};

    String(text || "").split("\n").forEach(function (line) {
      const separator = line.indexOf(":");

      if (separator < 1) return;

      const key = line.slice(0, separator).trim();
      const val = line.slice(separator + 1).trim();

      if (key && val) {
        result[key] = val;
      }
    });

    return result;
  }

  function formatSpecifications(specifications, excludedKeys) {
    if (!specifications || typeof specifications !== "object") {
      return "";
    }

    return Object.entries(specifications)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([key, val]) => key + ": " + val)
      .join("\n");
  }

  /* DYNAMIC FORM */

  function updateFormFields() {
    const type = itemType.value;

    byId("vehicle-fields").classList.toggle("hidden", type !== "vehicle");
    byId("part-fields").classList.toggle("hidden", type !== "part");
    byId("service-fields").classList.toggle("hidden", type !== "service");

    const categoryLabel = {
      vehicle: "Vehicle Category",
      part: "Part Category",
      service: "Service Category"
    };

    const categoryPlaceholder = {
      vehicle: "e.g. SUV, Sedan, Coupe, Truck",
      part: "e.g. Engine Parts, Tyres, Accessories",
      service: "e.g. Repairs, Tinting, Painting"
    };

    const priceLabel = {
      vehicle: "Vehicle Price",
      part: "Part Price",
      service: "Service Price / Starting Price"
    };

    byId("category-label").textContent =
      categoryLabel[type] || "Category";

    byId("category").placeholder =
      categoryPlaceholder[type] || "Select a listing type first";

    byId("price-label").textContent =
      priceLabel[type] || "Price";
  }

  itemType.addEventListener("change", updateFormFields);

  /* AUTHENTICATION */

  function showLogin() {
    loginPanel.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  function showDashboard() {
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  async function verifyAdministrator(user) {
    const { data, error } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data || data.role !== "admin") {
      await db.auth.signOut();
      showLogin();

      setMessage(
        byId("message"),
        "Access denied. Administrator account required.",
        "error"
      );

      return false;
    }

    showDashboard();
    await loadInventory();

    return true;
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    setMessage(byId("message"), "", "");

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: value("email"),
        password: byId("password").value
      });

      if (error) {
        setMessage(byId("message"), error.message, "error");
      } else {
        await verifyAdministrator(data.user);
      }
    } catch (error) {
      setMessage(
        byId("message"),
        error.message || "Login failed.",
        "error"
      );
    }

    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  });

  logoutButton.addEventListener("click", async function () {
    const { error } = await db.auth.signOut();

    if (error) {
      setMessage(byId("message"), error.message, "error");
      return;
    }

    showLogin();

    setMessage(
      byId("message"),
      "You have signed out.",
      "success"
    );
  });

  /* INVENTORY COUNTS */

  async function loadInventoryCounts() {
    const types = [
      ["vehicle", "vehicle-count"],
      ["part", "part-count"],
      ["service", "service-count"]
    ];

    for (const [type, elementId] of types) {
      const { count, error } = await db
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("item_type", type);

      byId(elementId).textContent = error ? "—" : count;
    }
  }

  /* LOAD INVENTORY */

  async function loadInventory() {
    inventoryList.innerHTML = "<p>Loading inventory...</p>";

    const { data, error } = await db
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      inventoryList.innerHTML =
        "<p class='error'>Unable to load inventory: " +
        escapeHTML(error.message) + "</p>";
      return;
    }

    inventory = data || [];

    renderInventory();
    await loadInventoryCounts();
  }

  /* RENDER INVENTORY */

  function renderInventory() {
    const filter = value("inventory-filter");
    const search = value("search-listings").toLowerCase();

    const filtered = inventory.filter(function (item) {
      const matchesType =
        filter === "all" || item.item_type === filter;

      const matchesSearch =
        String(item.title || "").toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });

    if (!filtered.length) {
      inventoryList.innerHTML = `
        <div class="listing-item">
          <p>No listings found.</p>
        </div>
      `;
      return;
    }

    inventoryList.innerHTML = filtered.map(function (item) {
      const published = item.is_published === true;

      return `
        <article class="listing-item">

          <h3>${escapeHTML(item.title)}</h3>

          <p class="listing-meta">
            ${escapeHTML(getTypeLabel(item.item_type))}
            ${item.category ? " · " + escapeHTML(item.category) : ""}
          </p>

          <p class="listing-meta">
            Price: ${escapeHTML(formatPrice(item.price))}
          </p>

          <span class="status ${published ? "published" : "unpublished"}">
            ${published ? "Published" : "Unpublished"}
          </span>

          <span class="status">
            ${escapeHTML(item.status || "available")}
          </span>

          <div class="listing-actions">

            <button
              type="button"
              class="secondary"
              data-action="edit"
              data-id="${escapeHTML(item.id)}"
            >Edit</button>

            <button
              type="button"
              data-action="toggle"
              data-id="${escapeHTML(item.id)}"
            >${published ? "Unpublish" : "Publish"}</button>

            <button
              type="button"
              class="danger"
              data-action="delete"
              data-id="${escapeHTML(item.id)}"
            >Delete</button>

          </div>
        </article>
      `;
    }).join("");
  }

  byId("inventory-filter").addEventListener("change", renderInventory);
  byId("search-listings").addEventListener("input", renderInventory);

  /* BUILD TYPE-SPECIFIC SPECIFICATIONS */

  function buildSpecifications() {
    const type = itemType.value;
    const specifications = {};

    if (type === "vehicle") {
      Object.assign(specifications, {
        make: value("make"),
        model: value("model"),
        transmission: value("transmission"),
        engine: value("engine"),
        fuel_type: value("fuel-type"),
        condition: value("vehicle-condition"),
        exterior_colour: value("exterior-colour"),
        interior_colour: value("interior-colour")
      });
    }

    if (type === "part") {
      Object.assign(specifications, {
        manufacturer: value("manufacturer"),
        part_number: value("part-number"),
        compatibility: value("compatibility"),
        condition: value("part-condition"),
        stock_quantity: value("stock-quantity"),
        warranty: value("warranty")
      });
    }

    if (type === "service") {
      Object.assign(specifications, {
        duration: value("duration"),
        compatible_vehicles: value("compatible-vehicles"),
        whats_included: value("whats-included"),
        booking_availability: value("booking-availability")
      });
    }

    Object.keys(specifications).forEach(function (key) {
      if (specifications[key] === "") {
        delete specifications[key];
      }
    });

    return Object.assign(
      {},
      specifications,
      parseSpecifications(value("specifications"))
    );
  }

  /* RESET FORM */

  function resetInventoryForm() {
    inventoryForm.reset();

    setValue("listing-id", "");

    byId("form-heading").textContent = "Add New Listing";
    saveButton.textContent = "Save Listing";

    cancelEditButton.classList.add("hidden");

    updateFormFields();

    setMessage(inventoryMessage, "", "");
  }

  cancelEditButton.addEventListener("click", resetInventoryForm);

  /* SAVE LISTING */

  inventoryForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = value("listing-id");
    const type = itemType.value;
    const title = value("title");
    const priceInput = value("price");
    const yearInput = type === "vehicle" ? value("year") : "";
    const mileage = type === "vehicle" ? value("mileage") : "";

    if (!type || !title) {
      setMessage(
        inventoryMessage,
        "Please select a listing type and enter a listing name.",
        "error"
      );
      return;
    }

    if (priceInput && (!Number.isFinite(Number(priceInput)) || Number(priceInput) < 0)) {
      setMessage(inventoryMessage, "Enter a valid price.", "error");
      return;
    }

    const price = priceInput ? Number(priceInput) : null;
    const year = yearInput ? Number(yearInput) : null;

    if (yearInput && (!Number.isInteger(year) || year < 1886 || year > 2100)) {
      setMessage(inventoryMessage, "Enter a valid vehicle year.", "error");
      return;
    }

    if (byId("images").files.length > 0) {
      setMessage(
        inventoryMessage,
        "Image uploads are not connected yet. Please remove selected photographs before saving. We'll enable uploads in the next stage.",
        "error"
      );
      return;
    }

    const existingItem = id
      ? inventory.find(item => String(item.id) === String(id))
      : null;

    const payload = {
      title: title,
      slug: existingItem ? existingItem.slug : slugify(title),
      item_type: type,
      category: value("category") || null,
      price: price,
      year: year,
      mileage: mileage || null,
      description: value("description") || null,
      specifications: buildSpecifications(),
      status: value("status"),
      is_featured: byId("is-featured").checked,
      is_published: byId("is-published").checked
    };

    if (!id) {
      payload.images = [];
    }

    saveButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";

    setMessage(inventoryMessage, "Saving listing...", "");

    try {
      let result;

      if (id) {
        result = await db
          .from("inventory")
          .update(payload)
          .eq("id", id);
      } else {
        result = await db
          .from("inventory")
          .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      resetInventoryForm();

      setMessage(
        inventoryMessage,
        id ? "Listing updated successfully." : "Listing saved successfully.",
        "success"
      );

      await loadInventory();

    } catch (error) {
      setMessage(
        inventoryMessage,
        "Could not save listing: " + error.message,
        "error"
      );
    }

    saveButton.disabled = false;
    saveButton.textContent = "Save Listing";
  });

  /* FILL TYPE-SPECIFIC FIELDS */

  function fillSpecifications(item) {
    const specs = item.specifications || {};

    if (item.item_type === "vehicle") {
      setValue("make", specs.make);
      setValue("model", specs.model);
      setValue("transmission", specs.transmission);
      setValue("engine", specs.engine);
      setValue("fuel-type", specs.fuel_type);
      setValue("vehicle-condition", specs.condition);
      setValue("exterior-colour", specs.exterior_colour);
      setValue("interior-colour", specs.interior_colour);

      setValue(
        "specifications",
        formatSpecifications(specs, [
          "make", "model", "transmission", "engine",
          "fuel_type", "condition", "exterior_colour",
          "interior_colour"
        ])
      );
    }

    if (item.item_type === "part") {
      setValue("manufacturer", specs.manufacturer);
      setValue("part-number", specs.part_number);
      setValue("compatibility", specs.compatibility);
      setValue("part-condition", specs.condition);
      setValue("stock-quantity", specs.stock_quantity);
      setValue("warranty", specs.warranty);

      setValue(
        "specifications",
        formatSpecifications(specs, [
          "manufacturer", "part_number", "compatibility",
          "condition", "stock_quantity", "warranty"
        ])
      );
    }

    if (item.item_type === "service") {
      setValue("duration", specs.duration);
      setValue("compatible-vehicles", specs.compatible_vehicles);
      setValue("whats-included", specs.whats_included);
      setValue("booking-availability", specs.booking_availability);

      setValue(
        "specifications",
        formatSpecifications(specs, [
          "duration", "compatible_vehicles",
          "whats_included", "booking_availability"
        ])
      );
    }
  }

  /* EDIT LISTING */

  function editListing(id) {
    const item = inventory.find(entry => String(entry.id) === String(id));

    if (!item) return;

    resetInventoryForm();

    setValue("listing-id", item.id);
    setValue("item-type", item.item_type);

    updateFormFields();

    setValue("category", item.category);
    setValue("title", item.title);
    setValue("price", item.price);
    setValue("year", item.year);
    setValue("mileage", item.mileage);
    setValue("description", item.description);
    setValue("status", item.status || "available");

    byId("is-featured").checked = item.is_featured === true;
    byId("is-published").checked = item.is_published === true;

    fillSpecifications(item);

    byId("form-heading").textContent = "Edit Listing";
    saveButton.textContent = "Update Listing";

    cancelEditButton.classList.remove("hidden");

    setMessage(
      inventoryMessage,
      "Editing: " + item.title,
      "success"
    );

    inventoryForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  /* PUBLISH / UNPUBLISH */

  async function togglePublished(id) {
    const item = inventory.find(entry => String(entry.id) === String(id));

    if (!item) return;

    const newValue = !item.is_published;
    const action = newValue ? "publish" : "unpublish";

    if (!confirm("Are you sure you want to " + action + " this listing?")) {
      return;
    }

    const { error } = await db
      .from("inventory")
      .update({ is_published: newValue })
      .eq("id", id);

    if (error) {
      setMessage(inventoryMessage, error.message, "error");
      return;
    }

    setMessage(
      inventoryMessage,
      newValue ? "Listing published." : "Listing unpublished.",
      "success"
    );

    await loadInventory();
  }

  /* DELETE LISTING */

  async function deleteListing(id) {
    const item = inventory.find(entry => String(entry.id) === String(id));

    if (!item) return;

    if (!confirm(
      'Permanently delete "' + item.title + '"? This cannot be undone.'
    )) {
      return;
    }

    const { error } = await db
      .from("inventory")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(
        inventoryMessage,
        "Could not delete listing: " + error.message,
        "error"
      );
      return;
    }

    setMessage(inventoryMessage, "Listing deleted successfully.", "success");

    await loadInventory();
  }

  /* INVENTORY BUTTONS */

  inventoryList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") editListing(id);
    if (action === "toggle") togglePublished(id);
    if (action === "delete") deleteListing(id);
  });

  /* INITIALISE */

  async function initialize() {
    updateFormFields();

    const { data, error } = await db.auth.getSession();

    if (error) {
      setMessage(
        byId("message"),
        "Unable to check your session.",
        "error"
      );
      return;
    }

    if (data.session) {
      await verifyAdministrator(data.session.user);
    } else {
      showLogin();
    }
  }

  initialize();

})();
