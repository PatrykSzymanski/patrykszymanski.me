#!/bin/bash
# Script to build for Cloudflare Pages

# Clean build directory
echo "Cleaning build directory..."
rm -rf _site

# Build the site with Eleventy
echo "Building site with Eleventy..."
npx @11ty/eleventy

# Build assets with Webpack
echo "Building assets with Webpack..."
npx webpack --mode production

# Verify assets exist
echo "Verifying assets..."
if [ -f "_site/css/lightgallery-bundle.css" ] && [ -f "_site/js/lightgallery-bundle.js" ]; then
  echo "✅ Assets generated successfully!"
else
  echo "❌ Assets missing! Build failed."
  exit 1
fi

echo "Build completed successfully!"
