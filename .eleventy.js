module.exports = function(eleventyConfig) {
  // Pass through specific files from src to _site
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.*");

  // Set the directory configuration
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    // Prevent duplicate processing
    passthroughFileCopy: true
  };
};
