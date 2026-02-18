module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");

  // Strip HTML tags filter
  eleventyConfig.addFilter("striptags", function(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, "");
  });

  // Truncate filter
  eleventyConfig.addFilter("truncate", function(str, length) {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  });

  // Filter out variant products (only keep main models, deduplicated by name)
  eleventyConfig.addFilter("mainProductsOnly", function(products) {
    if (!products) return [];
    var urlPatterns = [
      /-oui/, /-non/, /-ral-/, /-tactile/, /-3-boutons/, /-ecran-tactile/,
      /-black-edition-free/, /-inox/, /-choix/, /-blanc$/, /-gris$/, /-rouge$/, /-noir$/,
      /-ral-9010/, /-ral-9006/, /-ral-9005/, /-ral-3013/, /-ral-9002/
    ];
    var namePatterns = [ /test/i ];
    var seen = {};
    return products.filter(function(p) {
      if (!p.short_description) return false;
      var key = (p.url_key || "").toLowerCase();
      if (urlPatterns.some(function(rx) { return rx.test(key); })) return false;
      var name = (p.name || "").toLowerCase();
      if (namePatterns.some(function(rx) { return rx.test(name); })) return false;
      // Deduplicate by name (keep first occurrence = lowest id)
      var nameKey = (p.name || "").trim().toLowerCase();
      if (seen[nameKey]) return false;
      seen[nameKey] = true;
      return true;
    });
  });

  // Filter products by category IDs
  eleventyConfig.addFilter("byCategory", function(products, categoryIds) {
    if (!products || !categoryIds) return [];
    const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    return products.filter(function(p) {
      if (!p.categories) return false;
      return p.categories.some(function(c) { return ids.indexOf(c) !== -1; });
    });
  });

  // Slice filter for pagination
  eleventyConfig.addFilter("slice", function(arr, start, end) {
    if (!arr) return [];
    return arr.slice(start, end);
  });

  // Math filters for pagination
  eleventyConfig.addFilter("ceil", function(num) {
    return Math.ceil(num);
  });

  eleventyConfig.addFilter("minus", function(a, b) {
    return a - b;
  });

  eleventyConfig.addFilter("times", function(a, b) {
    return a * b;
  });

  eleventyConfig.addFilter("divided_by", function(a, b) {
    return a / b;
  });

  // Range filter for pagination
  eleventyConfig.addFilter("range", function(n) {
    return Array.from({length: n}, function(_, i) { return i + 1; });
  });

  // Generate individual product pages via pagination
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
