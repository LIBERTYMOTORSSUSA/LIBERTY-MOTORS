
/* =========================================================
   LIBERTY MOTORS — ADMIN ENGINE
   Dynamic inventory management + Supabase image manager
   ========================================================= */

(function () {
  "use strict";

  const db = window.libertySupabase;
  const STORAGE_BUCKET = "inventory-images";
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image

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
  const imagesInput = document.getElementById("images");
  const imagePreview = document.getElementById("image-preview");

  let inventory = [];

  // Image manager state
  let existingImages = [];
  let removedImages = [];
  let selectedFiles = [];
  let previewObjectURLs = [];

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

  /* IMAGE MANAGER */

  function revokePreviewURLs() {
    previewObjectURLs.forEach(function (url) {
      URL.revokeObjectURL(url);
    });

    previewObjectURLs = [];
  }

  function clearImageState() {
    revokePreviewURLs();

    existingImages = [];
    removedImages = [];
    selectedFiles = [];

    if (imagesInput) {
      imagesInput.value = "";
    }

    renderImagePreview();
  }

  function renderImagePreview() {
    if (!imagePreview) return;

    revokePreviewURLs();
    imagePreview.innerHTML = "";

    existingImages.forEach(function (url, index) {
      const card = document.createElement("div");
      card.className = "image-preview-item";

      const image = document.createElement("img");
      image.src = url;
      image.alt = "Existing listing photograph";
      image.loading = "lazy";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Remove photograph";
      button.dataset.imageKind = "existing";
      button.dataset.imageIndex = String(index);

      const caption = document.createElement("p");
      caption.textContent = "Existing photograph";

      card.appendChild(image);
      card.appendChild(caption);
      card.appendChild(button);

      imagePreview.appendChild(card);
    });

    selectedFiles.forEach(function (file, index) {
      const card = document.createElement("div");
      card.className = "image-preview-item";

      const objectURL = URL.createObjectURL(file);
      previewObjectURLs.push(objectURL);

      const image = document.createElement("img");
      image.src = objectURL;
      image.alt = file.name;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Remove photograph";
      button.dataset.imageKind = "new";
      button.dataset.imageIndex = String(index);

      const caption = document.createElement("p");
      caption.textContent = file.name;

      card.appendChild(image);
      card.appendChild(caption);
      card.appendChild(button);

      imagePreview.appendChild(card);
    });

    if (!existingImages.length && !selectedFiles.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "muted";
      emptyMessage.textContent = "No photographs selected.";
      imagePreview.appendChild(emptyMessage);
    }
  }

  imagesInput.addEventListener("change", function () {
    const incomingFiles = Array.from(imagesInput.files || []);
    const validFiles = [];
    const errors = [];

    incomingFiles.forEach(function (file) {
      if (!file.type.startsWith("image/")) {
        errors.push(file.name + " is not an image.");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(file.name + " exceeds the 10 MB limit.");
        return;
      }

      validFiles.push(file);
    });

    selectedFiles = selectedFiles.concat(validFiles);

    // Clear the input so the same file can be selected again if needed.
    imagesInput.value = "";

    renderImagePreview();

    if (errors.length) {
      setMessage(
        inventoryMessage,
        errors.join(" "),
        "error"
      );
    } else if (validFiles.length) {
      setMessage(
        inventoryMessage,
        validFiles.length + " photograph(s) added to the selection. Save the listing to upload them.",
        "success"
      );
    }
  });

  imagePreview.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-image-kind]");

    if (!button) return;

    const index = Number(button.dataset.imageIndex);
    const kind = button.dataset.imageKind;

    if (!Number.isInteger(index) || index < 0) return;

    if (kind === "existing" && existingImages[index]) {
      const removedURL = existingImages.splice(index, 1)[0];

      if (!removedImages.includes(removedURL)) {
        removedImages.push(removedURL);
      }

      setMessage(
        inventoryMessage,
        "Photograph marked for removal. Save the listing to confirm the change.",
        "success"
      );
    }

    if (kind === "new" && selectedFiles[index]) {
      selectedFiles.splice(index, 1);

      setMessage(
        inventoryMessage,
        "Selected photograph removed.",
        "success"
      );
    }

    renderImagePreview();
  });

  function getStoragePath(publicURL) {
    try {
      const parsedURL = new URL(publicURL);

      const marker =
        "/storage/v1/object/public/" + STORAGE_BUCKET + "/";

      const markerIndex = parsedURL.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      const encodedPath = parsedURL.pathname.slice(
        markerIndex + marker.length
      );

      return encodedPath
        .split("/")
        .map(segment => decodeURIComponent(segment))
        .join("/");

    } catch (error) {
      return null;
    }
  }

  function makeSafeFileName(filename) {
    const cleaned = String(filename || "image")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return cleaned || "image";
  }

  function createUploadFolder() {
    return Date.now().toString(36) + "-" +
      Math.random().toString(36).slice(2, 12);
  }

  async function uploadSelectedImages() {
    const uploadedURLs = [];
    const uploadedPaths = [];

    if (!selectedFiles.length) {
      return {
        urls: uploadedURLs,
        paths: uploadedPaths
      };
    }

    const folder = "listings/" + createUploadFolder();

    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index];

      setMessage(
        inventoryMessage,
        "Uploading photograph " + (index + 1) +
          " of " + selectedFiles.length + "...",
        ""
      );

      const safeName = makeSafeFileName(file.name);
      const path = folder + "/" + (index + 1) + "-" + safeName;

      const { data, error } = await db.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (error) {
        if (uploadedPaths.length) {
          await db.storage
            .from(STORAGE_BUCKET)
            .remove(uploadedPaths);
        }

        throw new Error(
          "Photograph upload failed (" + file.name + "): " + error.message
        );
      }

      uploadedPaths.push(data.path || path);

      const { data: publicData } = db.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path || path);

      if (!publicData || !publicData.publicUrl) {
        await db.storage
          .from(STORAGE_BUCKET)
          .remove(uploadedPaths);

        throw new Error(
          "Could not generate a public URL for an uploaded photograph."
        );
      }

      uploadedURLs.push(publicData.publicUrl);
    }

    return {
      urls: uploadedURLs,
      paths: uploadedPaths
    };
  }

  async function removeStoredImages(imageURLs) {
    const paths = imageURLs
      .map(getStoragePath)
      .filter(Boolean);

    if (!paths.length) {
      return null;
    }

    const { error } = await db.storage
      .from(STORAGE_BUCKET)
      .remove(paths);

    return error || null;
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

          <p class="listing-meta">
            Photographs: ${Array.isArray(item.images) ? item.images.length : 0}
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

    clearImageState();

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

    if (
      priceInput &&
      (!Number.isFinite(Number(priceInput)) || Number(priceInput) < 0)
    ) {
      setMessage(inventoryMessage, "Enter a valid price.", "error");
      return;
    }

    const price = priceInput ? Number(priceInput) : null;
    const year = yearInput ? Number(yearInput) : null;

    if (
      yearInput &&
      (!Number.isInteger(year) || year < 1886 || year > 2100)
    ) {
      setMessage(inventoryMessage, "Enter a valid vehicle year.", "error");
      return;
    }

    const existingItem = id
      ? inventory.find(item => String(item.id) === String(id))
      : null;

    if (id && !existingItem) {
      setMessage(
        inventoryMessage,
        "This listing could not be found. Please reload the inventory and try again.",
        "error"
      );
      return;
    }

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

    saveButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";

    let uploadedImages = [];
    let uploadPaths = [];

    try {
      setMessage(
        inventoryMessage,
        selectedFiles.length
          ? "Preparing photographs..."
          : "Saving listing...",
        ""
      );

      // Upload new photographs first.
      const uploadResult = await uploadSelectedImages();

      uploadedImages = uploadResult.urls;
      uploadPaths = uploadResult.paths;

      // Combine retained existing images with new uploads.
      payload.images = existingImages.concat(uploadedImages);

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

      // The database has saved successfully.
      // Now it is safe to delete photographs marked for removal.
      let removalWarning = "";

      if (removedImages.length) {
        setMessage(
          inventoryMessage,
          "Listing saved. Removing deleted photographs...",
          ""
        );

        const removalError = await removeStoredImages(removedImages);

        if (removalError) {
          removalWarning =
            " Some removed photographs could not be deleted from Storage: " +
            removalError.message;
        }
      }

      resetInventoryForm();

      setMessage(
        inventoryMessage,
        (id
          ? "Listing updated successfully."
          : "Listing saved successfully.") +
          (uploadedImages.length
            ? " " + uploadedImages.length + " photograph(s) uploaded."
            : "") +
          removalWarning,
        removalWarning ? "error" : "success"
      );

      await loadInventory();

    } catch (error) {
      // If the database save failed after uploading,
      // clean up the new files to avoid orphaned uploads.
      if (uploadPaths.length) {
        const { error: cleanupError } = await db.storage
          .from(STORAGE_BUCKET)
          .remove(uploadPaths);

        if (cleanupError) {
          console.error("Image cleanup failed:", cleanupError);
        }
      }

      setMessage(
        inventoryMessage,
        "Could not save listing: " + (error.message || "Unknown error"),
        "error"
      );

    } finally {
      saveButton.disabled = false;
      saveButton.textContent = value("listing-id")
        ? "Update Listing"
        : "Save Listing";
    }
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

    // Load existing photographs into the image manager.
    existingImages = Array.isArray(item.images)
      ? item.images.slice()
      : [];

    removedImages = [];
    selectedFiles = [];

    renderImagePreview();

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

    let message = "Listing deleted successfully.";

    // Also remove its stored photographs.
    if (Array.isArray(item.images) && item.images.length) {
      const removalError = await removeStoredImages(item.images);

      if (removalError) {
        message +=
          " However, some photographs could not be removed from Storage: " +
          removalError.message;
      }
    }

    setMessage(
      inventoryMessage,
      message,
      message.includes("could not") ? "error" : "success"
    );

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
    renderImagePreview();

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
