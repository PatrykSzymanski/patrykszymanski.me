module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.*");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/_headers");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    
    passthroughFileCopy: true
  };
};
