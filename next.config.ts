import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Configuration des redirections
  async redirects() {
    return [
      {
        // Redirection de la page en anglais vers la page de login
        source: '/en',
        destination: '/main',
        permanent: false,
      },
    ];
  },

  // Configuration Webpack pour gérer les fichiers SVG
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  images: {
    domains: ['via.placeholder.com'],
  },
};

module.exports = nextConfig;
