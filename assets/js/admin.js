
/* =========================================================
   LIBERTY MOTORS — ADMIN ENGINE
   Inventory management and authentication
   ========================================================= */

(function () {
  "use strict";

  const db = window.libertySupabase;

  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const message = document.getElementById("message");

  const inventoryForm = document.getElementById("inventory-form");
  const inventoryList = document.getElementById("inventory-list");
  const inventoryMessage = document.getElementById("inventory-message");
  const saveButton = document.getElementById("save-button");
  const cancelEditButton = document.getElementById("cancel-edit-button");

  let inventory = [];

  if (!db) {
    showMessage("Database connection failed. Check Supabase configuration.", "error");
    return;
  }

  /* GENERAL HELPERS */

  function showMessage(text, type) {
    message.textContent = text;
    message.className = type || "";
  }

  function showInventoryMessage(text, type) {
    inventoryMessage.textContent = text;
    inventoryMessage.className = type || "";
  }

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

  function showLogin() {
    loginPanel.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  function showDashboard() {
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getTypeLabel(type) {
    const labels = {
      vehicle: "Vehicle",
      part: "Spare Part",
      service: "Service"
    };

    return labels[type] || type;
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return "Contact for price";
    }

    if (typeof price === "number") {
      return "$" + price.toLocaleString("en-US");
    }

    return String(price);
  }

  /* AUTHENTICATION */

  async function verifyAdministrator(user) {
    const { data, error } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data || data.role !== "admin") {
      await db.auth.signOut();
      showLogin();
      showMessage("Access denied. Administrator account required.", "error");
      return false;
    }

    showDashboard();

    await loadInventory();
    await loadInventoryCounts();

    return true;
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
    showMessage("", "");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage(error.message, "error");
      } else {
        await verifyAdministrator(data.user);
      }
    } catch (error) {
      showMessage(error.message || "Login failed.", "error");
    }

    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  });

  logoutButton.addEventListener("click", async function () {
    const { error } = await db.auth.signOut();

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    showLogin();
    showMessage("You have signed out.", "success");
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

      document.getElementById(elementId).textContent =
        error ? "—" : count;
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

  /* DISPLAY INVENTORY */

  function renderInventory() {
    const filter = document.getElementById("inventory-filter").value;
    const search = document.getElementById("search-listings")
      .value.trim().toLowerCase();

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
            >
              Edit
            </button>

            <button
              type="button"
              data-action="toggle"
              data-id="${escapeHTML(item.id)}"
            >
              ${published ? "Unpublish" : "Publish"}
            </button>

            <button
              type="button"
              class="danger"
              data-action="delete"
              data-id="${escapeHTML(item.id)}"
            >
              Delete
            </button>

          </div>

        </article>
      `;
    }).join("");
  }

  document.getElementById("inventory-filter")
    .addEventListener("change", renderInventory);

  document.getElementById("search-listings")
    .addEventListener("input", renderInventory);

  /* SPECIFICATIONS */

  function parseSpecifications(text) {
    const specifications = {};

    String(text || "")
      .split("\n")
      .forEach(function (line) {
        const separator = line.indexOf(":");

        if (separator === -1) return;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();

        if (key && value) {
          specifications[key] = value;
        }
      });

    return specifications;
  }

  function formatSpecifications(specifications) {
    if (!specifications || typeof specifications !== "object") {
      return "";
    }

    return Object.entries(specifications)
      .map(([key, value]) => key + ": " + value)
      .join("\n");
  }

  /* RESET FORM */

  function resetInventoryForm() {
    inventoryForm.reset();

    document.getElementById("listing-id").value = "";
    document.getElementById("form-heading").textContent = "Add New Listing";

    saveButton.textContent = "Save Listing";
    cancelEditButton.classList.add("hidden");

    showInventoryMessage("", "");
  }

  cancelEditButton.addEventListener("click", resetInventoryForm);

  /* SAVE LISTING */

  inventoryForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("listing-id").value;
    const type = document.getElementById("item-type").value;
    const title = document.getElementById("title").value.trim();
    const priceInput = document.getElementById("price").value.trim();
    const yearInput = document.getElementById("year").value.trim();
    const mileage = document.getElementById("mileage").value.trim();

    if (!type || !title) {
      showInventoryMessage("Please enter a listing type and name.", "error");
      return;
    }

    if (priceInput && !/^[\d,.]+$/.test(priceInput)) {
      showInventoryMessage(
        "Enter the price using numbers only, without currency symbols.",
        "error"
      );
      return;
    }

    const price = priceInput
      ? Number(priceInput.replace(/,/g, ""))
      : null;

    if (priceInput && (!Number.isFinite(price) || price < 0)) {
      showInventoryMessage("Enter a valid price.", "error");
      return;
    }

    const year = yearInput ? Number(yearInput) : null;

    if (yearInput && (!Number.isInteger(year) || year < 1886 || year > 2100)) {
      showInventoryMessage("Enter a valid year.", "error");
      return;
    }

    const imageFiles = document.getElementById("images").files;

    if (imageFiles.length > 0) {
      showInventoryMessage(
        "Photograph uploads are not connected yet. Remove the selected files and save the listing. We'll enable image uploads in the next stage.",
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
      category: document.getElementById("category").value.trim() || null,
      price: price,
      year: year,
      mileage: mileage || null,
      description: document.getElementById("description").value.trim() || null,
      specifications: parseSpecifications(
        document.getElementById("specifications").value
      ),
      status: document.getElementById("status").value,
      is_featured: document.getElementById("is-featured").checked,
      is_published: document.getElementById("is-published").checked
    };

    if (!id) {
      payload.images = [];
    }

    saveButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";

    showInventoryMessage("Saving listing...", "");

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

      showInventoryMessage(
        id ? "Listing updated successfully." : "Listing saved successfully.",
        "success"
      );

      resetInventoryForm();

      await loadInventory();

    } catch (error) {
      showInventoryMessage(
        "Could not save listing: " + error.message,
        "error"
      );
    }

    saveButton.disabled = false;
    saveButton.textContent = "Save Listing";
  });

  /* EDIT LISTING */

  function editListing(id) {
    const item = inventory.find(entry => String(entry.id) === String(id));

    if (!item) return;

    document.getElementById("listing-id").value = item.id;
    document.getElementById("item-type").value = item.item_type;
    document.getElementById("category").value = item.category || "";
    document.getElementById("title").value = item.title || "";
    document.getElementById("price").value = item.price ?? "";
    document.getElementById("year").value = item.year ?? "";
    document.getElementById("mileage").value = item.mileage || "";
    document.getElementById("description").value = item.description || "";

    document.getElementById("specifications").value =
      formatSpecifications(item.specifications);

    document.getElementById("status").value =
      item.status || "available";

    document.getElementById("is-featured").checked =
      item.is_featured === true;

    document.getElementById("is-published").checked =
      item.is_published === true;

    document.getElementById("form-heading").textContent = "Edit Listing";
    saveButton.textContent = "Update Listing";
    cancelEditButton.classList.remove("hidden");

    showInventoryMessage(
      "Editing: " + item.title + ". Existing photographs will be preserved.",
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
      showInventoryMessage(error.message, "error");
      return;
    }

    showInventoryMessage(
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
      'Delete "' + item.title + '" permanently? This action cannot be undone.'
    )) {
      return;
    }

    const { error } = await db
      .from("inventory")
      .delete()
      .eq("id", id);

    if (error) {
      showInventoryMessage(
        "Could not delete listing: " + error.message,
        "error"
      );
      return;
    }

    showInventoryMessage("Listing deleted successfully.", "success");

    await loadInventory();
  }

  /* INVENTORY ACTIONS */

  inventoryList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      editListing(id);
    }

    if (action === "toggle") {
      togglePublished(id);
    }

    if (action === "delete") {
      deleteListing(id);
    }
  });

  /* INITIALISE */

  async function initialize() {
    const { data, error } = await db.auth.getSession();

    if (error) {
      showMessage("Unable to check your session.", "error");
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
