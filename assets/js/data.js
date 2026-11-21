
/* =========================================================
   LIBERTY MOTORS — WEBSITE DATA
   ========================================================= */

window.LIBERTY_DATA = {

  business: {
    name: "Liberty Motors",
    tagline: "Driven by Quality. Defined by Trust.",
    description: "Your destination for quality vehicles, automotive parts and professional automotive services.",
    logo: "assets/images/liberty-motors-logo.png"
  },

  emails: {
    general: "libertymotorsusaco@gmail.com",
    payments: "libertymotorsusa.sales@gmail.com"
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
