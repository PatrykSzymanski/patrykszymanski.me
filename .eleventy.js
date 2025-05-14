module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.*");
  // Copy _headers file from src to output directory (_site)
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  // Copy _routes.json file from root to output directory (_site)
  eleventyConfig.addPassthroughCopy({ "_routes.json": "_routes.json" });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
