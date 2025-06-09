import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Configure Terser to keep function and class names
      config.optimization.minimizer.forEach((minimizer: any) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            keep_fnames: true,      // Keep function names
            keep_classnames: true,  // Keep class names
          };
        }
      });
    }
    return config;
  },
};

export default nextConfig;