/**
 * The single content file for the storefront.
 *
 * Every customer-facing string lives here so the owner can edit copy without
 * touching components. Brand identity and contact details are defined in
 * lib/brand.ts.
 *
 * Copy is kept in step with `storefront-content.md`.
 */

export const content = {
  home: {
    hero: {
      headlineLines: ["Pure.", "Fresh.", "Perfected."],
      text: "Bringing you the finest farm-to-table meats and dairy — clean, hygienic, and uncompromised.",
      saleBanner: "Flash Sale: Products on Sale Today!",
      primaryCta: "Shop Now",
      secondaryCta: "Our Products",
      trackCta: "Track Order",
      contactCta: "Contact Us",
      chips: ["Fresh daily", "100% Halal", "Same-day delivery"],
    },
    categories: {
      heading: "Shop by Category",
      subtext:
        "Explore our diverse range of categories, each offering carefully curated products for your needs.",
    },
    bestSellers: {
      heading: "Best Sellers",
      subtext: "The cuts and staples our customers reorder the most.",
    },
    onSale: {
      heading: "On Sale Today",
      subtext: "Today's savings, while stock lasts.",
    },
    services: {
      heading: "Services",
      subtext: "Bringing you the finest selection from our farm.",
      items: [
        {
          title: "Farm to table",
          text: "Sourced from our own farm and partner farms, delivered the same day.",
        },
        {
          title: "Hygienic processing",
          text: "Controlled cutting, clean packing and a maintained cold chain.",
        },
        {
          title: "Home delivery",
          text: "Order by kg, pack or dozen and pay on delivery or by transfer.",
        },
      ],
    },
    heritage: {
      heading: "Harvesting Excellence",
      since: "Since 2020",
    },
    founder: {
      name: "Nizar Ul Haq",
      role: "Founder & CEO",
      heading: "A message from our founder",
    },
    delivery: {
      heading: "Delivery",
      text: "Home delivery across our service areas, or collect from the branch with no delivery charge.",
      points: [
        "Free delivery on qualifying orders",
        "Store pickup has no delivery charge",
        "Cash on delivery available for home delivery",
      ],
    },
    trust: [
      { title: "100% Halal", text: "Certified products" },
      { title: "Fast delivery", text: "Same-day where available" },
      { title: "Fresh always", text: "Quality guaranteed" },
    ],
  },

  productsPage: {
    title: "Our Products",
    intro:
      "Discover our complete range of premium farm-fresh products, carefully selected and prepared to bring the finest quality to your table.",
    categoriesHeading: "Browse Categories",
    categoriesIntro:
      "Explore our diverse range of categories, each offering carefully curated products for your needs.",
    browseCta: "Browse Categories",
    backCta: "Back to Home",
    emptyCategories:
      "No Categories Available — Categories are being added. Please check back soon!",
    emptyCategory: "No products available in this category yet.",
  },

  productDetail: {
    backToShop: "Back to Shop",
    relatedHeading: "Related Products",
    story: {
      heading: "Farm to Table Journey",
      steps: [
        {
          id: "farm",
          title: "The Farm",
          text: "Our livestock is raised on our own and carefully selected partner farms with high animal welfare standards.",
        },
        {
          id: "selection",
          title: "Careful Selection",
          text: "Only the best produce is selected for our storefront, ensuring premium quality every time.",
        },
        {
          id: "cutting",
          title: "Precision Cutting",
          text: "Our master butchers prepare each cut with precision, following strict hygiene protocols.",
        },
        {
          id: "packing",
          title: "Hygienic Packing",
          text: "Each item is vacuum-sealed or packed in food-grade materials to preserve freshness and taste.",
        },
        {
          id: "cold-chain",
          title: "Cold Chain",
          text: "We maintain a strictly controlled cold chain from processing to your doorstep.",
        },
        {
          id: "delivery",
          title: "Fast Delivery",
          text: "Our dedicated fleet ensures your order reaches you fresh, fast, and exactly as ordered.",
        },
      ],
    },
  },

  shop: {
    title: "Our Shop",
    subtitle: "Premium quality products from farm to your table.",
    labels: {
      sale: "Sale",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      lowStock: "Low stock",
      selectBranch: "Select branch to order",
      addToCart: "Add to cart",
      stockLimitReached: "Stock Limit Reached",
      onSaleOnly: "On sale",
      inStockOnly: "In stock only",
      priceRange: "Price (Rs)",
      sort: "Sort",
      loadMore: "Load more",
      clearFilters: "Clear filters",
      browse: "Browse",
    },
    sortOptions: {
      featured: "Featured",
      "price-asc": "Price: low to high",
      "price-desc": "Price: high to low",
      "name-asc": "Name: A to Z",
    },
    empty: "No products match your filters yet.",
  },

  ceoMessage: [
    "At Al Haq Farms & Meats, our mission is simple — to provide clean, hygienic, and high-quality meat that our customers can trust with complete confidence.",
    "We understand that meat is not just a product; it is a part of your daily meals, your family gatherings, and your special occasions. That is why we are committed to maintaining the highest standards of hygiene, freshness, and transparency at every step — from farm to customer.",
    "Our journey started with a vision to transform the traditional meat industry into a modern, organized, and customer-focused system. By combining proper animal care, controlled processing, and clean packaging, we aim to deliver a premium experience that sets us apart.",
    "In addition to fresh meat, we are proud to introduce our carefully crafted spice blends and ready-to-cook products, designed to make your cooking easier and more flavorful.",
    "We believe that trust is earned through consistency and honesty. Every product we offer reflects our commitment to quality, integrity, and customer satisfaction.",
    "Thank you for choosing Al Haq Farms & Meats. We look forward to serving you with excellence.",
  ],

  contact: {
    heading: "Have questions about our products or want to visit our farm?",
    subtext: "Reach out anytime via phone, WhatsApp, or email.",
    callLabel: "Call or WhatsApp",
    emailLabel: "Email",
    visitLabel: "Visit us",
    // Contact information published on alhaqfarms.com.pk.
    phone: "+92 333 3867073",
    whatsapp: "923333867073",
    email: "info@alhaqfarms.com.pk",
    address: "Akora Khattak, Nowshera, KPK, Pakistan",
    qrNote: "Choose WhatsApp to start a chat with us instantly.",
    form: {
      fields: ["Name", "Email", "Phone", "Subject", "Message"],
      submit: "Send Message",
      success: "Your message is ready.",
    },
  },

  footer: {
    about:
      "Pure. Fresh. Perfected. We are committed to bringing the finest organic produce and premium meats directly from our farm to your table.",
    exploreHeading: "Explore",
    chatHeading: "Chat",
    chatCta: "WhatsApp",
    appHeading: "App",
    androidCta: "Get APK",
    pwaCta: "Install PWA",
    legalHeading: "Legal",
    legal: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/contact", label: "Contact" },
    ],
    copyright: "© Al Haq Farms & Meats. All Rights Reserved.",
  },

  track: {
    title: "Track Order",
    text: "Enter your order number and phone number to see the status of your order.",
    orderNumberLabel: "Order number",
    phoneLabel: "Phone number",
    phonePlaceholder: "03001234567",
    cta: "Track",
  },
} as const;

/** Navigation shown in the header and footer. */
export const navigation = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/products", label: "Our Products" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
] as const;
