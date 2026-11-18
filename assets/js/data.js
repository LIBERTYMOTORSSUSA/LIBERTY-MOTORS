
/* =========================================================
   LIBERTY MOTORS — WEBSITE DATA
   ========================================================= */

window.LIBERTY_DATA = {

  business: {
    name: "Liberty Motors",
    tagline: "Driven by Quality. Defined by Trust.",
    description: "Your destination for quality vehicles, automotive parts and professional automotive services.",
    logo: "assets/images/logo.png"
  },

  emails: {
    general: "YOUR_GENERAL_EMAIL",
    cars: "YOUR_CARS_EMAIL",
    parts: "YOUR_PARTS_EMAIL",
    services: "YOUR_SERVICES_EMAIL"
  },

  getEmailForCategory: function(category) {
    return this.emails[category] || this.emails.general;
  },

  navigation: [
    { label: "Home", url: "" },
    {
      label: "Vehicles",
      url: "cars",
      children: [
        { label: "All Vehicles", url: "cars" },
        { label: "New Vehicles", url: "cars/new" },
        { label: "Used Vehicles", url: "cars/used" }
      ]
    },
    {
      label: "Parts",
      url: "parts",
      children: [
        { label: "All Parts", url: "parts" },
        { label: "Tyres", url: "parts/tyres" },
        { label: "Vehicle Parts", url: "parts/vehicle-parts" }
      ]
    },
    {
      label: "Services",
      url: "services"
    },
    { label: "About Us", url: "about" },
    { label: "Contact", url: "contact" }
  ],

  cars: [],

  parts: [],

  services: []

};
