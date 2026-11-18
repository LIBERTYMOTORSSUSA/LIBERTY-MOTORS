/* LIBERTY MOTORS — ADMIN ENGINE */

(function () {
  "use strict";

  const db = window.libertySupabase;

  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const message = document.getElementById("message");

  if (!db) {
    message.textContent = "Database connection failed. Check Supabase configuration.";
    message.className = "error";
    return;
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = type || "";
  }

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
      showMessage("Access denied. Administrator account required.", "error");
      return false;
    }

    showDashboard();
    await loadInventoryCounts();
    return true;
  }

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

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
    showMessage("", "");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showMessage(error.message, "error");
    } else {
      await verifyAdministrator(data.user);
    }

    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  });

  logoutButton.addEventListener("click", async function () {
    await db.auth.signOut();
    showDashboard();
    showLogin();
    showMessage("You have signed out.", "success");
  });

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

