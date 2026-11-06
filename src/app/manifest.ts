import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "NutriPlan · Tu semana, a tu medida", short_name: "NutriPlan", lang: "es",
    description: "Organiza tus comidas y compras con un presupuesto a tu medida.", start_url: "/", scope: "/",
    display: "standalone", background_color: "#FFF9F4", theme_color: "#8FC9A3",
    icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    shortcuts: [{ name: "Mi semana", url: "/semana" }, { name: "Lista de compras", url: "/compras" }],
  };
}
