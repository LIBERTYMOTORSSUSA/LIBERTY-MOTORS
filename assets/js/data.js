
/* =========================================================
   LIBERTY MOTORS
   CENTRAL WEBSITE DATABASE
   Edit this file to update dealership content.
   ========================================================= */

window.LIBERTY_DATA = {

  /* ---------- BUSINESS SETTINGS ---------- */

  business: {
    name: "Liberty Motors",
    tagline: "Driven by Quality. Defined by Trust.",
    description:
      "Explore quality vehicles, automotive parts and professional vehicle services at Liberty Motors.",

    logo: "assets/images/logo.png",

    currency: "USD",

    /* Replace these with your actual department emails */
    emails: {
      general: "general@example.com",
      vehicles: "vehicles@example.com",
      parts: "parts@example.com",
      services: "services@example.com"
    }
  },


  /* ---------- WEBSITE NAVIGATION ---------- */

  navigation: [
    {
      label: "Home",
      url: "/"
    },
    {
      label: "Cars",
      url: "/cars",
      children: [
        {
          label: "New Cars",
          url: "/cars/new"
        },
        {
          label: "Used Cars",
          url: "/cars/used"
        }
      ]
    },
    {
      label: "Parts",
      url: "/parts",
      children: [
        {
          label: "Tyres",
          url: "/parts/tyres"
        },
        {
          label: "Vehicle Parts",
          url: "/parts/vehicle-parts"
        }
      ]
    },
    {
      label: "Services",
      url: "/services",
      children: [
        {
          label: "General Repairs",
          url: "/services/general-repairs"
        },
        {
          label: "Window Tinting",
          url: "/services/tinting"
        },
        {
          label: "Pinstriping",
          url: "/services/pinstriping"
        },
        {
          label: "Painting",
          url: "/services/painting"
        },
        {
          label: "Windshield Repair",
          url: "/services/windshield-repair"
        }
      ]
    }
  ],


  /* ---------- CARS INVENTORY ---------- */

  cars: [

    {
      id: "example-new-car",
      name: "Example New Vehicle",
      slug: "example-new-vehicle",
      category: "new",
      brand: "Replace with brand",
      model: "Replace with model",
      year: "2026",
      condition: "New",
      price: "Contact for price",
      transmission: "Add transmission",
      fuel: "Add fuel type",
      mileage: "New",
      color: "Add color",
      availability: "Available",
      featured: true,

      image: "assets/images/cars/example-new-car.jpg",

      gallery: [],

      description:
        "Replace this example description with the actual vehicle description.",

      specifications: {
        Engine: "Add engine details",
        Transmission: "Add transmission",
        Mileage: "Add mileage",
        Drivetrain: "Add drivetrain",
        Exterior: "Add exterior colour",
        Interior: "Add interior details"
      }
    },

    {
      id: "example-used-car",
      name: "Example Used Vehicle",
      slug: "example-used-vehicle",
      category: "used",
      brand: "Replace with brand",
      model: "Replace with model",
      year: "2022",
      condition: "Used",
      price: "Contact for price",
      transmission: "Add transmission",
      fuel: "Add fuel type",
      mileage: "Add mileage",
      color: "Add color",
      availability: "Available",
      featured: true,

      image: "assets/images/cars/example-used-car.jpg",

      gallery: [],

      description:
        "Replace this example description with the actual vehicle description.",

      specifications: {
        Engine: "Add engine details",
        Transmission: "Add transmission",
        Mileage: "Add mileage",
        Drivetrain: "Add drivetrain",
        Exterior: "Add exterior colour",
        Interior: "Add interior details"
      }
    }

  ],


  /* ---------- AUTOMOTIVE PARTS ---------- */

  parts: [

    {
      id: "example-tyre",
      name: "Example Premium Tyre",
      slug: "example-premium-tyre",
      category: "tyres",
      brand: "Replace with brand",
      price: "Contact for price",
      availability: "Available",
      featured: true,

      image: "assets/images/parts/example-tyre.jpg",

      gallery: [],

      description:
        "Replace with the actual tyre description and product information.",

      specifications: {
        Type: "Add tyre type",
        Size: "Add tyre size",
        Brand: "Add brand",
        Compatibility: "Add compatible vehicles"
      }
    },

    {
      id: "example-vehicle-part",
      name: "Example Vehicle Part",
      slug: "example-vehicle-part",
      category: "vehicle-parts",
      brand: "Replace with brand",
      price: "Contact for price",
      availability: "Available",
      featured: true,

      image: "assets/images/parts/example-vehicle-part.jpg",

      gallery: [],

      description:
        "Replace with the actual automotive part description.",

      specifications: {
        Type: "Add part type",
        Brand: "Add brand",
        Compatibility: "Add compatible vehicles",
        Condition: "Add condition"
      }
    }

  ],


  /* ---------- SERVICES ---------- */

  services: [

    {
      id: "general-repair",
      name: "General Vehicle Repairs",
      slug: "general-repairs",
      category: "general-repairs",
      featured: true,

      image: "assets/images/services/general-repair.jpg",

      price: "Request a quote",

      description:
        "Professional vehicle repair services. Contact our team for details and enquiries."
    },

    {
      id: "window-tinting",
      name: "Premium Window Tinting",
      slug: "premium-window-tinting",
      category: "tinting",
      featured: true,

      image: "assets/images/services/window-tinting.jpg",

      price: "Request a quote",

      description:
        "Professional automotive window tinting. Contact our team for available options."
    },

    {
      id: "vehicle-pinstriping",
      name: "Vehicle Pinstriping",
      slug: "vehicle-pinstriping",
      category: "pinstriping",
      featured: true,

      image: "assets/images/services/pinstriping.jpg",

      price: "Request a quote",

      description:
        "Automotive pinstriping and vehicle detailing customisation."
    },

    {
      id: "vehicle-painting",
      name: "Professional Vehicle Painting",
      slug: "professional-vehicle-painting",
      category: "painting",
      featured: true,

      image: "assets/images/services/vehicle-painting.jpg",

      price: "Request a quote",

      description:
        "Automotive painting services. Contact our team to discuss your requirements."
    },

    {
      id: "windshield-repair",
      name: "Windshield Repair",
      slug: "windshield-repair",
      category: "windshield-repair",
      featured: true,

      image: "assets/images/services/windshield-repair.jpg",

      price: "Request a quote",

      description:
        "Windshield repair enquiries and automotive glass assistance."
    }

  ],


  /* ---------- HOMEPAGE CONTENT ---------- */

  homepage: {

    heroTitle: "Your Journey. Our Commitment.",

    heroSubtitle:
      "Discover quality vehicles, premium automotive parts and professional services.",

    heroImage: "assets/images/hero-car.jpg",

    introductionTitle: "Welcome to Liberty Motors",

    introduction:
      "Your destination for automotive excellence. Explore our vehicle inventory, discover quality automotive parts and enquire about our professional services.",

    featuredCarsTitle: "Explore Our Vehicles",

    featuredPartsTitle: "Automotive Parts",

    featuredServicesTitle: "Our Services"

  },


  /* ---------- DEPARTMENT EMAIL ROUTING ---------- */

  getEmailForCategory: function(category) {

    const emails = this.business.emails;

    if (category === "cars" || category === "new" || category === "used") {
      return emails.vehicles;
    }

    if (category === "parts" || category === "tyres" || category === "vehicle-parts") {
      return emails.parts;
    }

    if (category === "services" || category === "general-repairs" ||
        category === "tinting" || category === "pinstriping" ||
        category === "painting" || category === "windshield-repair") {
      return emails.services;
    }

    return emails.general;
  }

};
