import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al Haq Farms & Meats",
    short_name: "Al Haq Farms",
    description: "Pure. Fresh. Perfected. Shop farm-fresh products from Al Haq Farms & Meats.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f3",
    theme_color: "#a20d19",
    icons: [
      {
        src: "/assets/brand/alhaq-farms-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
