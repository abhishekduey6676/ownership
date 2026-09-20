import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // The standalone metadata worker runs outside the Next.js bundle.
  serverExternalPackages: ['pdf-lib', 'image-size'],
  outputFileTracingIncludes: {
    '/api/extract': [
      './lib/ai/upload-inspector.worker.cjs',
      './node_modules/pdf-lib/**/*', './node_modules/@pdf-lib/**/*',
      './node_modules/pako/**/*', './node_modules/tslib/**/*', './node_modules/image-size/**/*',
      './node_modules/.pnpm/pdf-lib@*/**/*', './node_modules/.pnpm/@pdf-lib+*/**/*',
      './node_modules/.pnpm/pako@*/**/*', './node_modules/.pnpm/tslib@*/**/*',
      './node_modules/.pnpm/image-size@*/**/*',
    ],
  },
};

export default nextConfig;
