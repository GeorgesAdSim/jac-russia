// Mapping sous-catégorie ID → slugs SEO
const CAT_SEO = {
  '4':  { parent: 'hleborezatelnye', parentName: 'Хлеборезательные машины', parentUrl: '/hleborezatelnye/', slug: 'professionaly', name: 'Хлеборезки для профессионалов' },
  '5':  { parent: 'hleborezatelnye', parentName: 'Хлеборезательные машины', parentUrl: '/hleborezatelnye/', slug: 'samoobsluzhivanie', name: 'Хлеборезки самообслуживания' },
  '8':  { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'fermenty', name: 'Ферментаторы для закваски' },
  '9':  { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'gidravlicheskie-deliteli', name: 'Гидравлические делители' },
  '12': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'deliteli-formovshiki', name: 'Делители-формовщики' },
  '16': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'presy-dlya-testa', name: 'Прессы для теста' },
  '10': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'avtomat-deliteli', name: 'Автоматические делители' },
  '11': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'shkafi-rasstoyki', name: 'Шкафы расстойки' },
  '13': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'testoformovochnye', name: 'Тестоформовочные машины' },
  '14': { parent: 'testoobrabotka', parentName: 'Оборудование для тестообработки', parentUrl: '/testoobrabotka/', slug: 'avtomatizirovannye-linii', name: 'Автоматизированные линии' }
};

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");

  // Expose CAT_SEO as global data
  eleventyConfig.addGlobalData("catSeo", CAT_SEO);

  // Get SEO category info for a product
  eleventyConfig.addFilter("getProductCatSeo", function(categories) {
    if (!categories) return null;
    for (const catId of categories) {
      if (CAT_SEO[catId]) return CAT_SEO[catId];
    }
    return null;
  });

  // Get SEO permalink for a product (uses id-url_key to guarantee uniqueness)
  eleventyConfig.addFilter("productPermalink", function(product) {
    if (!product || !product.categories) return 'produit/' + product.id + '-' + product.url_key + '/';
    for (const catId of product.categories) {
      if (CAT_SEO[catId]) {
        const cat = CAT_SEO[catId];
        return cat.parent + '/' + cat.slug + '/' + product.url_key + '/';
      }
    }
    return 'produit/' + product.id + '-' + product.url_key + '/';
  });

  // Get SEO product URL for use in links
  eleventyConfig.addFilter("productUrl", function(product) {
    if (!product || !product.categories) return '/produit/' + product.id + '-' + product.url_key + '/';
    for (const catId of product.categories) {
      if (CAT_SEO[catId]) {
        const cat = CAT_SEO[catId];
        return '/' + cat.parent + '/' + cat.slug + '/' + product.url_key + '/';
      }
    }
    return '/produit/' + product.id + '-' + product.url_key + '/';
  });

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

  // Filter out variant products (only keep main models, deduplicated by SEO path)
  eleventyConfig.addFilter("mainProductsOnly", function(products) {
    if (!products) return [];
    var urlPatterns = [
      /-oui/, /-non/, /-ral-/, /-tactile/, /-3-boutons/, /-ecran-tactile/,
      /-black-edition-free/, /-inox/, /-choix/, /-blanc$/, /-gris$/, /-rouge$/, /-noir$/,
      /-ral-9010/, /-ral-9006/, /-ral-9005/, /-ral-3013/, /-ral-9002/
    ];
    var namePatterns = [ /test/i ];
    var seenName = {};
    var seenPath = {};
    return products.filter(function(p) {
      if (!p.short_description) return false;
      var key = (p.url_key || "").toLowerCase();
      if (urlPatterns.some(function(rx) { return rx.test(key); })) return false;
      var name = (p.name || "").toLowerCase();
      if (namePatterns.some(function(rx) { return rx.test(name); })) return false;
      // Deduplicate by name
      var nameKey = (p.name || "").trim().toLowerCase();
      if (seenName[nameKey]) return false;
      seenName[nameKey] = true;
      // Deduplicate by SEO path (parent/subcat/url_key)
      var pathKey = null;
      if (p.categories) {
        for (var i = 0; i < p.categories.length; i++) {
          var cat = CAT_SEO[p.categories[i]];
          if (cat) { pathKey = cat.parent + '/' + cat.slug + '/' + p.url_key; break; }
        }
      }
      if (pathKey) {
        if (seenPath[pathKey]) return false;
        seenPath[pathKey] = true;
      }
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

  // Collection of filtered+deduplicated products for pagination (no URL conflicts)
  eleventyConfig.addCollection("mainProducts", function(collectionApi) {
    const products = require("./_data/products.json");
    const urlPatterns = [
      /-oui/, /-non/, /-ral-/, /-tactile/, /-3-boutons/, /-ecran-tactile/,
      /-black-edition-free/, /-inox/, /-choix/, /-blanc$/, /-gris$/, /-rouge$/, /-noir$/,
      /-ral-9010/, /-ral-9006/, /-ral-9005/, /-ral-3013/, /-ral-9002/
    ];
    const namePatterns = [/test/i];
    const seenName = {};
    const seenPath = {};
    return products.filter(function(p) {
      if (!p.short_description) return false;
      const key = (p.url_key || "").toLowerCase();
      if (urlPatterns.some(rx => rx.test(key))) return false;
      const name = (p.name || "").toLowerCase();
      if (namePatterns.some(rx => rx.test(name))) return false;
      // Filter to only products with a known SEO category
      let hasSEOCat = false;
      let pathKey = null;
      if (p.categories) {
        for (const catId of p.categories) {
          if (CAT_SEO[catId]) {
            hasSEOCat = true;
            pathKey = CAT_SEO[catId].parent + '/' + CAT_SEO[catId].slug + '/' + p.url_key;
            break;
          }
        }
      }
      if (!hasSEOCat) return false;
      // Deduplicate by name
      const nameKey = (p.name || "").trim().toLowerCase();
      if (seenName[nameKey]) return false;
      seenName[nameKey] = true;
      // Deduplicate by SEO path
      if (seenPath[pathKey]) return false;
      seenPath[pathKey] = true;
      return true;
    });
  });

  // Generate individual product pages via pagination
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
