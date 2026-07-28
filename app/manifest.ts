import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rankster — crée et classe tes tier lists",
    short_name: "Rankster",
    description: "Crée des tier lists avec tes images et vidéos YouTube, et classe celles des autres à ta façon.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0f",
    theme_color: "#0c0c0f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
